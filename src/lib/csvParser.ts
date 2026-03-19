import type { FrameDataPoint, DriverDataset, FrameViewMetadata } from '../types/telemetry';

const FRAME_TIME_HEADERS = [
  'frametime',
  'frame_time',
  'frame time',
  'msbetweenpresents',
  'msbetweendisplaychange',
];

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

export function parseCSV(csvText: string, label: string, fileName: string): DriverDataset {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const frameTimeIndex = headers.findIndex(h => FRAME_TIME_HEADERS.includes(h));

  if (frameTimeIndex === -1) {
    throw new Error(
      'CSV must contain a "FrameTime" or "MsBetweenPresents" column'
    );
  }

  const firstDataCols = lines[1].split(',');
  const metadata = detectFrameViewMetadata(headers, firstDataCols);

  const rawFrameTimes: number[] = [];
  const frames: FrameDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const raw = (cols[frameTimeIndex] ?? '').trim();
    if (raw === '' || raw.toUpperCase() === 'NA') continue;

    const frameTime = parseFloat(raw);
    if (isNaN(frameTime) || frameTime <= 0) continue;

    rawFrameTimes.push(frameTime);
    frames.push({
      frame: rawFrameTimes.length,
      frameTime,
      fps: 1000 / frameTime,
    });
  }

  if (frames.length === 0) {
    throw new Error('No valid frame time data found in CSV');
  }

  return { label, fileName, frames, rawFrameTimes, metadata };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
