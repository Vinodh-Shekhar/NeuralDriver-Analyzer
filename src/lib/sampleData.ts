import type { DriverDataset, FrameDataPoint } from '../types/telemetry';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function gaussianRandom(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}

function generateStableFrameTimes(count: number): number[] {
  const rng = seededRandom(42);
  const targetFt = 13.5;
  const frameTimes: number[] = [];

  for (let i = 0; i < count; i++) {
    const scenePressure = Math.sin(i / 200) * 1.2 + Math.sin(i / 47) * 0.4;
    const noise = gaussianRandom(rng) * 0.6;
    const ft = targetFt + scenePressure + noise;
    frameTimes.push(Math.max(6, Math.round(ft * 100) / 100));
  }

  return frameTimes;
}

function generateStutteryFrameTimes(count: number): number[] {
  const rng = seededRandom(137);
  const targetFt = 14.8;
  const frameTimes: number[] = [];

  for (let i = 0; i < count; i++) {
    const scenePressure = Math.sin(i / 180) * 1.8 + Math.sin(i / 33) * 0.7;
    let noise = gaussianRandom(rng) * 1.1;

    const roll = rng();
    if (roll < 0.015) {
      noise += 18 + rng() * 25;
    } else if (roll < 0.04) {
      noise += 8 + rng() * 10;
    } else if (roll < 0.08) {
      noise += 3 + rng() * 5;
    }

    if (i > 600 && i < 750) {
      noise += 2 + gaussianRandom(rng) * 2;
    }

    const ft = targetFt + scenePressure + noise;
    frameTimes.push(Math.max(6, Math.round(ft * 100) / 100));
  }

  return frameTimes;
}

function framesToDataset(
  frameTimes: number[],
  label: string,
  fileName: string
): DriverDataset {
  const frames: FrameDataPoint[] = frameTimes.map((ft, i) => ({
    frame: i + 1,
    frameTime: ft,
    fps: 1000 / ft,
  }));

  return { label, fileName, frames, rawFrameTimes: frameTimes };
}

export function generateSampleDatasets(): {
  datasetA: DriverDataset;
  datasetB: DriverDataset;
} {
  const stableFrameTimes = generateStableFrameTimes(1200);
  const stutteryFrameTimes = generateStutteryFrameTimes(1200);

  return {
    datasetA: framesToDataset(stableFrameTimes, 'Driver A', 'sample_driver_a_stable.csv'),
    datasetB: framesToDataset(stutteryFrameTimes, 'Driver B', 'sample_driver_b_stuttery.csv'),
  };
}
