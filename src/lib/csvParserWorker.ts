import type { FrameDataPoint, DriverDataset, FrameViewMetadata } from '../types/telemetry';
import type { PerformanceMetrics, QAAnalysis } from '../types/telemetry';

const FRAME_TIME_HEADERS = [
  'frametime',
  'frame_time',
  'frame time',
  'msbetweenpresents',
  'msbetweendisplaychange',
];

const MAX_RENDER_FRAMES = 25_000;
const MAX_ROWS_TO_PARSE = 50_000;
const FPS_HIST_BUCKETS = 2_000;
const FPS_HIST_MAX = 2000;
const FPS_BUCKET_WIDTH = FPS_HIST_MAX / FPS_HIST_BUCKETS;

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

function percentileFromHistogram(
  histogram: Int32Array,
  buckets: number,
  bucketWidth: number,
  totalCount: number,
  pFraction: number
): number {
  const targetCount = Math.ceil(pFraction * totalCount);
  let cumulative = 0;
  for (let i = 0; i < buckets; i++) {
    cumulative += histogram[i];
    if (cumulative >= targetCount) {
      return (i + 0.5) * bucketWidth;
    }
  }
  return buckets * bucketWidth;
}

interface WorkerParseMessage {
  type: 'parse';
  file: File;
  label: string;
}

export interface WorkerProgressMessage {
  type: 'progress';
  frames: number;
  bytes: number;
  total: number;
}

export interface WorkerResultMessage {
  type: 'result';
  dataset: DriverDataset;
  metrics: PerformanceMetrics;
  analysis: QAAnalysis;
}

export interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

export type WorkerOutMessage = WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage;

function getReadableStream(file: File): ReadableStream<Uint8Array> {
  const raw = file.stream() as ReadableStream<Uint8Array>;
  if (file.name.endsWith('.gz')) {
    const ds = new DecompressionStream('gzip');
    return raw.pipeThrough(ds);
  }
  return raw;
}

async function parseFile(file: File, label: string) {
  const decoder = new TextDecoder('utf-8');
  const stream = getReadableStream(file);
  const reader = stream.getReader();

  let headerLine: string | null = null;
  let headers: string[] = [];
  let frameTimeIndex = -1;
  let metadata: FrameViewMetadata | undefined;
  let firstDataRowParsed = false;

  const fpsHistogram = new Int32Array(FPS_HIST_BUCKETS);

  let n = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;

  let wMean = 0;
  let wM2 = 0;

  const sampledFrameTimes: number[] = [];
  let sampleStep = 1;
  let nextSampleAt = 1;

  let leftoverBytes = new Uint8Array(0);
  let bytesRead = 0;
  let lastProgressAt = 0;
  let rowCapReached = false;
  let stutterCount = 0;
  let deviationSum = 0;
  let highCount = 0;
  let medCount = 0;

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
    if (n > MAX_ROWS_TO_PARSE) return true;

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

  const NEWLINE = 10;

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
        const lineBytes = combined.subarray(lineStart, i);
        const line = decoder.decode(lineBytes).trim();
        lineStart = i + 1;
        const capped = processLine(line);
        if (capped) {
          rowCapReached = true;
          break outer;
        }
      }
    }

    leftoverBytes = combined.subarray(lineStart);

    if (bytesRead - lastProgressAt > 100_000) {
      self.postMessage({ type: 'progress', frames: n, bytes: bytesRead, total: file.size } satisfies WorkerProgressMessage);
      lastProgressAt = bytesRead;
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

  const frames: FrameDataPoint[] = sampledFrameTimes.map((frameTime, i) => ({
    frame: Math.round((i / sampledFrameTimes.length) * framesAnalyzed) + 1,
    frameTime,
    fps: 1000 / frameTime,
  }));

  const dataset: DriverDataset = {
    label,
    fileName: file.name,
    frames,
    metadata,
    truncated,
    partialRead: rowCapReached,
    totalFrameCount: framesAnalyzed,
  };

  const avgFps = 1000 / avgFt;
  const minFps = 1000 / maxFt;
  const maxFps = 1000 / minFt;
  const framePacingStability = Math.max(0, Math.min(100, (1 - avgDeviation) * 100));
  const stutterScore = (stutterCount / framesAnalyzed) * 100;

  const p1Low = percentileFromHistogram(fpsHistogram, FPS_HIST_BUCKETS, FPS_BUCKET_WIDTH, framesAnalyzed, 0.01);
  const p01Low = percentileFromHistogram(fpsHistogram, FPS_HIST_BUCKETS, FPS_BUCKET_WIDTH, framesAnalyzed, 0.001);

  const metrics: PerformanceMetrics = {
    averageFps: Math.round(avgFps * 100) / 100,
    frameTimeVariance: Math.round(variance * 1000) / 1000,
    framePacingStability: Math.round(framePacingStability * 100) / 100,
    stutterScore: Math.round(stutterScore * 100) / 100,
    minFps: Math.round(minFps * 100) / 100,
    maxFps: Math.round(maxFps * 100) / 100,
    percentile1Low: Math.round(p1Low * 100) / 100,
    percentile01Low: Math.round(p01Low * 100) / 100,
    avgFrameTime: Math.round(avgFt * 1000) / 1000,
  };

  const instabilityWarnings: string[] = [];
  if (highCount > framesAnalyzed * 0.02) {
    instabilityWarnings.push(
      `High spike rate: ${highCount} severe frame spikes detected (${((highCount / framesAnalyzed) * 100).toFixed(1)}%)`
    );
  }
  if (framePacingStability < 85) {
    instabilityWarnings.push(
      `Frame pacing instability: stability score ${framePacingStability.toFixed(1)}% is below threshold`
    );
  }
  if (stutterScore > 5) {
    instabilityWarnings.push(
      `Elevated stutter: ${stutterScore.toFixed(1)}% of frames exceed 1.5x average frame time`
    );
  }
  const p1Ratio = p1Low / avgFps;
  if (p1Ratio < 0.5) {
    instabilityWarnings.push(
      `1% low FPS (${p1Low.toFixed(1)}) is significantly below average (${avgFps.toFixed(1)})`
    );
  }

  let stabilityRating: 'PASS' | 'WARNING' | 'FAIL';
  let overallScore: number;
  if (highCount > framesAnalyzed * 0.05 || framePacingStability < 70 || stutterScore > 10) {
    stabilityRating = 'FAIL';
    overallScore = Math.max(0, 40 - highCount);
  } else if (highCount > framesAnalyzed * 0.01 || medCount > framesAnalyzed * 0.05 || framePacingStability < 85 || stutterScore > 3) {
    stabilityRating = 'WARNING';
    overallScore = Math.max(40, 75 - highCount - medCount * 0.5);
  } else {
    stabilityRating = 'PASS';
    overallScore = Math.min(100, 90 + framePacingStability * 0.1);
  }

  const analysis: QAAnalysis = {
    anomalyCounts: { high: highCount, medium: medCount, low: Math.max(0, framesAnalyzed - highCount - medCount) },
    instabilityWarnings,
    stabilityRating,
    overallScore: Math.round(overallScore),
    totalFrames: framesAnalyzed,
  };

  return { dataset, metrics, analysis };
}

self.onmessage = async (e: MessageEvent<WorkerParseMessage>) => {
  try {
    const { file, label } = e.data;
    const result = await parseFile(file, label);
    self.postMessage({ type: 'result', ...result } satisfies WorkerResultMessage);
  } catch (err) {
    self.postMessage({ type: 'error', message: err instanceof Error ? err.message : 'Parse failed' } satisfies WorkerErrorMessage);
  }
};
