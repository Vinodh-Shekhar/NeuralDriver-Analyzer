import type { FrameDataPoint, DriverDataset } from '../types/telemetry';

export function parseCSV(csvText: string, label: string, fileName: string): DriverDataset {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const frameTimeIndex = headers.findIndex(
    h => h === 'frametime' || h === 'frame_time' || h === 'frame time'
  );

  if (frameTimeIndex === -1) {
    throw new Error('CSV must contain a "FrameTime" column');
  }

  const rawFrameTimes: number[] = [];
  const frames: FrameDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const frameTime = parseFloat(cols[frameTimeIndex]);

    if (isNaN(frameTime) || frameTime <= 0) continue;

    rawFrameTimes.push(frameTime);
    frames.push({
      frame: i,
      frameTime,
      fps: 1000 / frameTime,
    });
  }

  if (frames.length === 0) {
    throw new Error('No valid frame time data found in CSV');
  }

  return { label, fileName, frames, rawFrameTimes };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
