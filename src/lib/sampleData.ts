import type { DriverDataset, FrameDataPoint, PerformanceMetrics, QAAnalysis } from '../types/telemetry';

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

function computeSampleMetrics(frameTimes: number[]): PerformanceMetrics {
  const n = frameTimes.length;
  let sum = 0;
  let sumSq = 0;
  let minFt = Infinity;
  let maxFt = -Infinity;

  for (let i = 0; i < n; i++) {
    const ft = frameTimes[i];
    sum += ft;
    sumSq += ft * ft;
    if (ft < minFt) minFt = ft;
    if (ft > maxFt) maxFt = ft;
  }

  const avgFt = sum / n;
  const variance = sumSq / n - avgFt * avgFt;

  let stutterCount = 0;
  let deviationSum = 0;
  const sortedFps = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const ft = frameTimes[i];
    if (ft > avgFt * 1.5) stutterCount++;
    deviationSum += Math.abs(ft - avgFt) / avgFt;
    sortedFps[i] = 1000 / ft;
  }

  sortedFps.sort();

  const p1Idx = Math.max(0, Math.ceil(0.01 * n) - 1);
  const p01Idx = Math.max(0, Math.ceil(0.001 * n) - 1);

  const avgFps = 1000 / avgFt;
  const avgDeviation = deviationSum / n;
  const framePacingStability = Math.max(0, Math.min(100, (1 - avgDeviation) * 100));
  const stutterScore = (stutterCount / n) * 100;

  return {
    averageFps: Math.round(avgFps * 100) / 100,
    frameTimeVariance: Math.round(variance * 1000) / 1000,
    framePacingStability: Math.round(framePacingStability * 100) / 100,
    stutterScore: Math.round(stutterScore * 100) / 100,
    minFps: Math.round((1000 / maxFt) * 100) / 100,
    maxFps: Math.round((1000 / minFt) * 100) / 100,
    percentile1Low: Math.round(sortedFps[p1Idx] * 100) / 100,
    percentile01Low: Math.round(sortedFps[p01Idx] * 100) / 100,
    avgFrameTime: Math.round(avgFt * 1000) / 1000,
  };
}

function computeSampleAnalysis(frameTimes: number[], metrics: PerformanceMetrics): QAAnalysis {
  const n = frameTimes.length;
  const avgFt = metrics.avgFrameTime;
  const variance = metrics.frameTimeVariance;
  const stdDev = Math.sqrt(Math.max(0, variance));

  let highCount = 0;
  let medCount = 0;

  if (stdDev > 0) {
    for (let i = 0; i < n; i++) {
      const zscore = Math.abs(frameTimes[i] - avgFt) / stdDev;
      if (zscore > 3) highCount++;
      else if (zscore > 2) medCount++;
    }
  }

  const instabilityWarnings: string[] = [];
  const { framePacingStability, stutterScore, percentile1Low, averageFps } = metrics;

  if (highCount > n * 0.02) {
    instabilityWarnings.push(
      `High spike rate: ${highCount} severe frame spikes detected (${((highCount / n) * 100).toFixed(1)}%)`
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
  if (percentile1Low / averageFps < 0.5) {
    instabilityWarnings.push(
      `1% low FPS (${percentile1Low.toFixed(1)}) is significantly below average (${averageFps.toFixed(1)})`
    );
  }

  let stabilityRating: 'PASS' | 'WARNING' | 'FAIL';
  let overallScore: number;

  if (highCount > n * 0.05 || framePacingStability < 70 || stutterScore > 10) {
    stabilityRating = 'FAIL';
    overallScore = Math.max(0, 40 - highCount);
  } else if (highCount > n * 0.01 || medCount > n * 0.05 || framePacingStability < 85 || stutterScore > 3) {
    stabilityRating = 'WARNING';
    overallScore = Math.max(40, 75 - highCount - medCount * 0.5);
  } else {
    stabilityRating = 'PASS';
    overallScore = Math.min(100, 90 + framePacingStability * 0.1);
  }

  return {
    anomalyCounts: { high: highCount, medium: medCount, low: Math.max(0, n - highCount - medCount) },
    instabilityWarnings,
    stabilityRating,
    overallScore: Math.round(overallScore),
    totalFrames: n,
  };
}

function framesToDataset(frameTimes: number[], label: string, fileName: string): DriverDataset {
  const frames: FrameDataPoint[] = frameTimes.map((ft, i) => ({
    frame: i + 1,
    frameTime: ft,
    fps: 1000 / ft,
  }));

  return { label, fileName, frames, totalFrameCount: frameTimes.length };
}

export function generateSampleDatasets(): {
  datasetA: DriverDataset;
  datasetB: DriverDataset;
  metricsA: PerformanceMetrics;
  metricsB: PerformanceMetrics;
  analysisA: QAAnalysis;
  analysisB: QAAnalysis;
} {
  const stableFrameTimes = generateStableFrameTimes(1200);
  const stutteryFrameTimes = generateStutteryFrameTimes(1200);

  const metricsA = computeSampleMetrics(stableFrameTimes);
  const metricsB = computeSampleMetrics(stutteryFrameTimes);

  return {
    datasetA: framesToDataset(stableFrameTimes, 'Driver A', 'sample_driver_a_stable.csv'),
    datasetB: framesToDataset(stutteryFrameTimes, 'Driver B', 'sample_driver_b_stuttery.csv'),
    metricsA,
    metricsB,
    analysisA: computeSampleAnalysis(stableFrameTimes, metricsA),
    analysisB: computeSampleAnalysis(stutteryFrameTimes, metricsB),
  };
}
