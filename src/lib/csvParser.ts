import type { FrameDataPoint, DriverDataset, FrameViewMetadata } from '../types/telemetry';
import type { PerformanceMetrics, QAAnalysis } from '../types/telemetry';
import { computeMetricsFromAccumulator } from './analysis';

const FRAME_TIME_HEADERS = [
  'frametime',
  'frame_time',
  'frame time',
  'msbetweenpresents',
  'msbetweendisplaychange',
];

export const MAX_RENDER_FRAMES = 25_000;
export const MAX_ROWS_TO_PARSE = 50_000;
const YIELD_INTERVAL = 5_000;

const FPS_HIST_BUCKETS = 2_000;
const FPS_HIST_MAX = 2000;
const FPS_BUCKET_WIDTH = FPS_HIST_MAX / FPS_HIST_BUCKETS;

export const MAX_FILE_SIZE = 200 * 1024 * 1024;

function extractNthColumn(line: string, colIndex: number): string {
  let col = 0;
  let start = 0;
  for (let i = 0; i <= line.length; i++) {
    if (i === line.length || line.charCodeAt(i) === 44) {
      if (col === colIndex) {
        return line.slice(start, i).trim();
      }
      col++;
      start = i + 1;
    }
  }
  return '';
}

function detectFrameViewMetadata(
  headers: string[],
  firstDataRow: string[]
): FrameViewMetadata | undefined {
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h, i));

  const hasFrameView =
    headerMap.has('msbetweenpresents') ||
    headerMap.has('msbetweendisplaychange');

  if (!hasFrameView) return undefined;

  const getValue = (key: string): string => {
    const idx = headerMap.get(key);
    if (idx === undefined) return '';
    return (firstDataRow[idx] ?? '').trim();
  };

  return {
    application: getValue('application'),
    gpu: getValue('gpu'),
    cpu: getValue('cpu').replace(/\s+/g, ' ').trim(),
    resolution: getValue('resolution'),
    source: 'frameview',
  };
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export interface ParseResult {
  dataset: DriverDataset;
  metrics: PerformanceMetrics;
  analysis: QAAnalysis;
}

export type ProgressCallback = (framesProcessed: number, bytesProcessed: number, totalBytes: number) => void;

function parseInWorker(file: File, label: string, onProgress?: ProgressCallback): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./csvParserWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.frames, msg.bytes, msg.total);
      } else if (msg.type === 'result') {
        const { dataset, metrics, analysis } = msg;
        resolve({ dataset, metrics, analysis });
        worker.terminate();
      } else if (msg.type === 'error') {
        reject(new Error(msg.message));
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      reject(new Error(err.message || 'Worker failed'));
      worker.terminate();
    };
    worker.postMessage({ type: 'parse', file, label });
  });
}

export async function parseCSVFile(
  file: File,
  label: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(0)}MB). Maximum supported size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Consider compressing to .csv.gz.`);
  }

  try {
    return await parseInWorker(file, label, onProgress);
  } catch {
    return parseCSVFileStreaming(file, label, onProgress);
  }
}

function getReadableStream(file: File): ReadableStream<Uint8Array> {
  const raw = file.stream() as ReadableStream<Uint8Array>;
  if (file.name.endsWith('.gz')) {
    const ds = new DecompressionStream('gzip');
    return raw.pipeThrough(ds);
  }
  return raw;
}

async function parseCSVFileStreaming(
  file: File,
  label: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  const decoder = new TextDecoder('utf-8');
  const reader = getReadableStream(file).getReader();

  let headerLine: string | null = null;
  let headers: string[] = [];
  let frameTimeIndex = -1;
  let metadata: FrameViewMetadata | undefined;
  let firstDataRowParsed = false;

  const fpsHistogram = new Int32Array(FPS_HIST_BUCKETS);

  let n = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;
  let stutterCount = 0;
  let deviationSum = 0;
  let highCount = 0;
  let medCount = 0;

  let wMean = 0;
  let wM2 = 0;

  const sampledFrameTimes: number[] = [];
  let sampleStep = 1;
  let nextSampleAt = 1;

  let leftoverBytes = new Uint8Array(0);
  let bytesRead = 0;
  let yieldCounter = 0;
  let rowCapReached = false;
  const NEWLINE = 10;

  const processLine = (line: string): boolean => {
    if (line === '') return false;

    if (headerLine === null) {
      headerLine = line;
      headers = line.split(',').map(h => h.trim().toLowerCase());
      frameTimeIndex = headers.findIndex(h => FRAME_TIME_HEADERS.includes(h));
      if (frameTimeIndex === -1) {
        throw new Error('CSV must contain a "FrameTime" or "MsBetweenPresents" column');
      }
      return false;
    }

    if (!firstDataRowParsed) {
      const cols = line.split(',');
      metadata = detectFrameViewMetadata(headers, cols);
      firstDataRowParsed = true;
    }

    const raw = extractNthColumn(line, frameTimeIndex);
    if (raw === '' || raw === 'NA' || raw === 'na') return false;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) return false;

    n++;

    if (n > MAX_ROWS_TO_PARSE) {
      return true;
    }

    const delta = frameTime - wMean;
    wMean += delta / n;
    const delta2 = frameTime - wMean;
    wM2 += delta * delta2;

    if (frameTime < minFt) minFt = frameTime;
    if (frameTime > maxFt) maxFt = frameTime;

    const fps = 1000 / frameTime;
    const bucketIdx = Math.min(Math.floor(fps / FPS_BUCKET_WIDTH), FPS_HIST_BUCKETS - 1);
    fpsHistogram[bucketIdx]++;

    if (n === nextSampleAt) {
      sampledFrameTimes.push(frameTime);
      if (sampledFrameTimes.length >= MAX_RENDER_FRAMES) {
        for (let i = 0; i < sampledFrameTimes.length / 2; i++) {
          sampledFrameTimes[i] = sampledFrameTimes[i * 2];
        }
        sampledFrameTimes.length = Math.floor(sampledFrameTimes.length / 2);
        sampleStep *= 2;
      }
      nextSampleAt += sampleStep;
    }
    return false;
  };

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;

    const combined = new Uint8Array(leftoverBytes.length + value.length);
    combined.set(leftoverBytes);
    combined.set(value, leftoverBytes.length);

    let lineStart = 0;
    for (let i = 0; i < combined.length; i++) {
      if (combined[i] === NEWLINE) {
        const line = decoder.decode(combined.subarray(lineStart, i)).trim();
        lineStart = i + 1;
        const capped = processLine(line);
        if (capped) {
          rowCapReached = true;
          break outer;
        }
        yieldCounter++;
      }
    }
    leftoverBytes = combined.subarray(lineStart);

    onProgress?.(n, bytesRead, file.size);
    if (yieldCounter >= YIELD_INTERVAL) {
      await yieldToMain();
      yieldCounter = 0;
    }
  }
  reader.cancel().catch(() => {});
  if (!rowCapReached && leftoverBytes.length > 0) {
    processLine(decoder.decode(leftoverBytes).trim());
  }

  if (n === 0) throw new Error('No valid frame time data found in CSV');
  const framesAnalyzed = Math.min(n, MAX_ROWS_TO_PARSE);

  const avgFt = wMean;
  const variance = framesAnalyzed > 1 ? wM2 / framesAnalyzed : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));

  for (const frameTime of sampledFrameTimes) {
    deviationSum += Math.abs(frameTime - avgFt) / avgFt;
    if (frameTime > avgFt * 1.5) stutterCount++;
    if (stdDev > 0) {
      const zscore = Math.abs(frameTime - avgFt) / stdDev;
      if (zscore > 3) highCount++;
      else if (zscore > 2) medCount++;
    }
  }

  const sampleSize = sampledFrameTimes.length;
  if (sampleSize > 0 && sampleSize < framesAnalyzed) {
    const scaleFactor = framesAnalyzed / sampleSize;
    stutterCount = Math.round(stutterCount * scaleFactor);
    highCount = Math.round(highCount * scaleFactor);
    medCount = Math.round(medCount * scaleFactor);
    deviationSum = deviationSum * scaleFactor;
  }

  const avgDeviation = framesAnalyzed > 0 ? deviationSum / framesAnalyzed : 0;
  const truncated = framesAnalyzed > MAX_RENDER_FRAMES;

  const frameObjects: FrameDataPoint[] = sampledFrameTimes.map((frameTime, i) => ({
    frame: Math.round((i / sampledFrameTimes.length) * framesAnalyzed) + 1,
    frameTime,
    fps: 1000 / frameTime,
  }));

  const dataset: DriverDataset = {
    label,
    fileName: file.name,
    frames: frameObjects,
    metadata,
    truncated,
    partialRead: rowCapReached,
    totalFrameCount: framesAnalyzed,
  };

  const { metrics, analysis } = computeMetricsFromAccumulator({
    n: framesAnalyzed, sum: avgFt * framesAnalyzed, sumSq: (variance + avgFt * avgFt) * framesAnalyzed, minFt, maxFt,
    fpsHistogram, fpsHistBuckets: FPS_HIST_BUCKETS, fpsBucketWidth: FPS_BUCKET_WIDTH,
    stutterCount, avgDeviation, variance, highCount, medCount, avgFt, stdDev,
  });

  return { dataset, metrics, analysis };
}

export async function parseCSVText(
  csvText: string,
  label: string,
  fileName: string,
  onProgress?: (framesProcessed: number) => void
): Promise<ParseResult> {
  const newlineIdx = csvText.indexOf('\n');
  if (newlineIdx === -1) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  const headerLine = csvText.slice(0, newlineIdx).trim();
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
  const frameTimeIndex = headers.findIndex(h => FRAME_TIME_HEADERS.includes(h));

  if (frameTimeIndex === -1) {
    throw new Error('CSV must contain a "FrameTime" or "MsBetweenPresents" column');
  }

  const bodyStart = newlineIdx + 1;
  const firstNewline = csvText.indexOf('\n', bodyStart);
  const firstDataCols = csvText.slice(bodyStart, firstNewline === -1 ? undefined : firstNewline).split(',');
  const metadata = detectFrameViewMetadata(headers, firstDataCols);

  const fpsHistogram = new Int32Array(FPS_HIST_BUCKETS);

  let n = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;
  let stutterCount = 0;
  let deviationSum = 0;
  let highCount = 0;
  let medCount = 0;

  let wMean = 0;
  let wM2 = 0;

  const sampledFrameTimes: number[] = [];
  let sampleStep = 1;
  let nextSampleAt = 1;

  let pos = bodyStart;
  const len = csvText.length;
  let rowIndex = 0;
  let partialRead = false;

  while (pos < len) {
    let lineEnd = csvText.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = len;

    const line = csvText.slice(pos, lineEnd).trim();
    pos = lineEnd + 1;

    if (line === '') continue;

    const raw = extractNthColumn(line, frameTimeIndex);
    if (raw === '' || raw === 'NA' || raw === 'na') continue;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) continue;

    n++;

    if (n > MAX_ROWS_TO_PARSE) {
      partialRead = true;
      break;
    }

    const delta = frameTime - wMean;
    wMean += delta / n;
    const delta2 = frameTime - wMean;
    wM2 += delta * delta2;

    if (frameTime < minFt) minFt = frameTime;
    if (frameTime > maxFt) maxFt = frameTime;

    const fps = 1000 / frameTime;
    const bucketIdx = Math.min(Math.floor(fps / FPS_BUCKET_WIDTH), FPS_HIST_BUCKETS - 1);
    fpsHistogram[bucketIdx]++;

    if (n === nextSampleAt) {
      sampledFrameTimes.push(frameTime);
      if (sampledFrameTimes.length >= MAX_RENDER_FRAMES) {
        for (let i = 0; i < sampledFrameTimes.length / 2; i++) {
          sampledFrameTimes[i] = sampledFrameTimes[i * 2];
        }
        sampledFrameTimes.length = Math.floor(sampledFrameTimes.length / 2);
        sampleStep *= 2;
      }
      nextSampleAt += sampleStep;
    }

    rowIndex++;
    if (rowIndex % YIELD_INTERVAL === 0) {
      onProgress?.(n);
      await yieldToMain();
    }
  }

  if (n === 0) {
    throw new Error('No valid frame time data found in CSV');
  }

  const framesAnalyzed = Math.min(n, MAX_ROWS_TO_PARSE);

  const avgFt = wMean;
  const variance = framesAnalyzed > 1 ? wM2 / framesAnalyzed : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));

  for (const frameTime of sampledFrameTimes) {
    deviationSum += Math.abs(frameTime - avgFt) / avgFt;
    if (frameTime > avgFt * 1.5) stutterCount++;
    if (stdDev > 0) {
      const zscore = Math.abs(frameTime - avgFt) / stdDev;
      if (zscore > 3) highCount++;
      else if (zscore > 2) medCount++;
    }
  }

  const sampleSize = sampledFrameTimes.length;
  if (sampleSize > 0 && sampleSize < framesAnalyzed) {
    const scaleFactor = framesAnalyzed / sampleSize;
    stutterCount = Math.round(stutterCount * scaleFactor);
    highCount = Math.round(highCount * scaleFactor);
    medCount = Math.round(medCount * scaleFactor);
    deviationSum = deviationSum * scaleFactor;
  }

  const avgDeviation = deviationSum / framesAnalyzed;
  const truncated = framesAnalyzed > MAX_RENDER_FRAMES;

  const frames: FrameDataPoint[] = sampledFrameTimes.map((frameTime, i) => ({
    frame: Math.round((i / sampledFrameTimes.length) * framesAnalyzed) + 1,
    frameTime,
    fps: 1000 / frameTime,
  }));

  const dataset: DriverDataset = {
    label,
    fileName,
    frames,
    metadata,
    truncated,
    partialRead,
    totalFrameCount: framesAnalyzed,
  };

  const { metrics, analysis } = computeMetricsFromAccumulator({
    n: framesAnalyzed,
    sum: avgFt * framesAnalyzed,
    sumSq: (variance + avgFt * avgFt) * framesAnalyzed,
    minFt,
    maxFt,
    fpsHistogram,
    fpsHistBuckets: FPS_HIST_BUCKETS,
    fpsBucketWidth: FPS_BUCKET_WIDTH,
    stutterCount,
    avgDeviation,
    variance,
    highCount,
    medCount,
    avgFt,
    stdDev,
  });

  return { dataset, metrics, analysis };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
