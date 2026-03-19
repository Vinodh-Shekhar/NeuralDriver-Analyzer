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

export const MAX_RENDER_FRAMES = 100_000;
const YIELD_INTERVAL = 10_000;

const FPS_HIST_BUCKETS = 200_000;
const FPS_HIST_MAX = 2000;
const FPS_BUCKET_WIDTH = FPS_HIST_MAX / FPS_HIST_BUCKETS;

const FILE_SIZE_STREAM_THRESHOLD = 200 * 1024 * 1024;

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

export async function parseCSVFile(
  file: File,
  label: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  if (file.size > FILE_SIZE_STREAM_THRESHOLD) {
    return parseCSVFileStreaming(file, label, onProgress);
  }
  const text = await readFileAsText(file);
  return parseCSVText(text, label, file.name, onProgress ? (frames) => onProgress(frames, file.size, file.size) : undefined);
}

async function parseCSVFileStreaming(
  file: File,
  label: string,
  onProgress?: ProgressCallback
): Promise<ParseResult> {
  const decoder = new TextDecoder('utf-8');
  const reader = file.stream().getReader();

  let headerLine: string | null = null;
  let headers: string[] = [];
  let frameTimeIndex = -1;
  let metadata: FrameViewMetadata | undefined;
  let firstDataRowParsed = false;

  const frames: FrameDataPoint[] = [];
  const fpsHistogram = new Int32Array(FPS_HIST_BUCKETS);

  let n = 0;
  let sum = 0;
  let sumSq = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;
  let stutterCount = 0;
  let deviationSum = 0;
  let highCount = 0;
  let medCount = 0;

  let leftover = '';
  let bytesRead = 0;
  let yieldCounter = 0;

  const processLine = (line: string, avgFt?: number, stdDev?: number) => {
    if (line === '') return;

    if (headerLine === null) {
      headerLine = line;
      headers = line.split(',').map(h => h.trim().toLowerCase());
      frameTimeIndex = headers.findIndex(h => FRAME_TIME_HEADERS.includes(h));
      if (frameTimeIndex === -1) {
        throw new Error('CSV must contain a "FrameTime" or "MsBetweenPresents" column');
      }
      return;
    }

    const cols = line.split(',');
    const raw = (cols[frameTimeIndex] ?? '').trim();
    if (raw === '' || raw.toUpperCase() === 'NA') return;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) return;

    if (!firstDataRowParsed) {
      metadata = detectFrameViewMetadata(headers, cols);
      firstDataRowParsed = true;
    }

    if (avgFt === undefined) {
      n++;
      sum += frameTime;
      sumSq += frameTime * frameTime;
      if (frameTime < minFt) minFt = frameTime;
      if (frameTime > maxFt) maxFt = frameTime;

      const fps = 1000 / frameTime;
      const bucketIdx = Math.min(Math.floor(fps / FPS_BUCKET_WIDTH), FPS_HIST_BUCKETS - 1);
      fpsHistogram[bucketIdx]++;

      if (n <= MAX_RENDER_FRAMES) {
        frames.push({ frame: n, frameTime, fps });
      }
    } else {
      deviationSum += Math.abs(frameTime - avgFt) / avgFt;
      if (frameTime > avgFt * 1.5) stutterCount++;
      if (stdDev && stdDev > 0) {
        const zscore = Math.abs(frameTime - avgFt) / stdDev;
        if (zscore > 3) highCount++;
        else if (zscore > 2) medCount++;
      }
    }
  };

  const processChunk = (chunk: string, avgFt?: number, stdDev?: number) => {
    const combined = leftover + chunk;
    const lines = combined.split('\n');
    leftover = lines.pop() ?? '';
    for (const line of lines) {
      processLine(line.trim(), avgFt, stdDev);
      yieldCounter++;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    const chunk = decoder.decode(value, { stream: true });
    processChunk(chunk);
    onProgress?.(n, bytesRead, file.size);
    if (yieldCounter >= YIELD_INTERVAL) {
      await yieldToMain();
      yieldCounter = 0;
    }
  }
  if (leftover.trim()) processLine(leftover.trim());

  if (n === 0) throw new Error('No valid frame time data found in CSV');

  const avgFt = sum / n;
  const variance = sumSq / n - avgFt * avgFt;
  const stdDev = Math.sqrt(Math.max(0, variance));

  leftover = '';
  yieldCounter = 0;
  bytesRead = 0;
  firstDataRowParsed = false;

  const reader2 = file.stream().getReader();
  let headerSkipped = false;

  const processLine2 = (line: string) => {
    if (line === '') return;
    if (!headerSkipped) { headerSkipped = true; return; }
    const cols = line.split(',');
    const raw = (cols[frameTimeIndex] ?? '').trim();
    if (raw === '' || raw.toUpperCase() === 'NA') return;
    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) return;
    deviationSum += Math.abs(frameTime - avgFt) / avgFt;
    if (frameTime > avgFt * 1.5) stutterCount++;
    if (stdDev > 0) {
      const zscore = Math.abs(frameTime - avgFt) / stdDev;
      if (zscore > 3) highCount++;
      else if (zscore > 2) medCount++;
    }
    yieldCounter++;
  };

  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    bytesRead += value.byteLength;
    const chunk = decoder.decode(value, { stream: true });
    const combined = leftover + chunk;
    const lines = combined.split('\n');
    leftover = lines.pop() ?? '';
    for (const line of lines) processLine2(line.trim());
    if (yieldCounter >= YIELD_INTERVAL) {
      await yieldToMain();
      yieldCounter = 0;
    }
  }
  if (leftover.trim()) processLine2(leftover.trim());

  const avgDeviation = n > 0 ? deviationSum / n : 0;
  const truncated = n > MAX_RENDER_FRAMES;

  const dataset: DriverDataset = {
    label,
    fileName: file.name,
    frames,
    metadata,
    truncated,
    totalFrameCount: n,
  };

  const { metrics, analysis } = computeMetricsFromAccumulator({
    n, sum, sumSq, minFt, maxFt,
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

  const frames: FrameDataPoint[] = [];
  const fpsHistogram = new Int32Array(FPS_HIST_BUCKETS);

  let n = 0;
  let sum = 0;
  let sumSq = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;

  let pos = bodyStart;
  const len = csvText.length;
  let rowIndex = 0;

  while (pos < len) {
    let lineEnd = csvText.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = len;

    const line = csvText.slice(pos, lineEnd).trim();
    pos = lineEnd + 1;

    if (line === '') continue;

    const cols = line.split(',');
    const raw = (cols[frameTimeIndex] ?? '').trim();
    if (raw === '' || raw.toUpperCase() === 'NA') continue;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) continue;

    n++;
    sum += frameTime;
    sumSq += frameTime * frameTime;
    if (frameTime < minFt) minFt = frameTime;
    if (frameTime > maxFt) maxFt = frameTime;

    const fps = 1000 / frameTime;
    const bucketIdx = Math.min(Math.floor(fps / FPS_BUCKET_WIDTH), FPS_HIST_BUCKETS - 1);
    fpsHistogram[bucketIdx]++;

    if (n <= MAX_RENDER_FRAMES) {
      frames.push({ frame: n, frameTime, fps });
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

  const avgFt = sum / n;
  const variance = sumSq / n - avgFt * avgFt;
  const stdDev = Math.sqrt(Math.max(0, variance));

  let stutterCount = 0;
  let deviationSum = 0;
  let highCount = 0;
  let medCount = 0;

  let pos2 = bodyStart;
  let rowIndex2 = 0;

  while (pos2 < len) {
    let lineEnd = csvText.indexOf('\n', pos2);
    if (lineEnd === -1) lineEnd = len;

    const line = csvText.slice(pos2, lineEnd).trim();
    pos2 = lineEnd + 1;

    if (line === '') continue;

    const cols = line.split(',');
    const raw = (cols[frameTimeIndex] ?? '').trim();
    if (raw === '' || raw.toUpperCase() === 'NA') continue;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) continue;

    deviationSum += Math.abs(frameTime - avgFt) / avgFt;

    if (frameTime > avgFt * 1.5) stutterCount++;

    if (stdDev > 0) {
      const zscore = Math.abs(frameTime - avgFt) / stdDev;
      if (zscore > 3) highCount++;
      else if (zscore > 2) medCount++;
    }

    rowIndex2++;
    if (rowIndex2 % YIELD_INTERVAL === 0) {
      onProgress?.(n);
      await yieldToMain();
    }
  }

  const avgDeviation = deviationSum / n;
  const truncated = n > MAX_RENDER_FRAMES;

  const dataset: DriverDataset = {
    label,
    fileName,
    frames,
    metadata,
    truncated,
    totalFrameCount: n,
  };

  const { metrics, analysis } = computeMetricsFromAccumulator({
    n,
    sum,
    sumSq,
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
