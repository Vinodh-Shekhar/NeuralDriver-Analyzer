import type {
  PerformanceMetrics,
  QAAnalysis,
  RegressionResult,
} from '../types/telemetry';

export interface StatsAccumulator {
  n: number;
  sum: number;
  sumSq: number;
  minFt: number;
  maxFt: number;
  fpsHistogram: Int32Array;
  fpsHistBuckets: number;
  fpsBucketWidth: number;
  stutterCount: number;
  avgDeviation: number;
  variance: number;
  highCount: number;
  medCount: number;
  avgFt: number;
  stdDev: number;
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

export function computeMetricsFromAccumulator(acc: StatsAccumulator): {
  metrics: PerformanceMetrics;
  analysis: QAAnalysis;
} {
  const { n, minFt, maxFt, fpsHistogram, fpsHistBuckets, fpsBucketWidth,
          stutterCount, avgDeviation, variance, highCount, medCount, avgFt } = acc;

  const avgFps = 1000 / avgFt;
  const minFps = 1000 / maxFt;
  const maxFps = 1000 / minFt;
  const framePacingStability = Math.max(0, Math.min(100, (1 - avgDeviation) * 100));
  const stutterScore = (stutterCount / n) * 100;

  const p1Low = percentileFromHistogram(fpsHistogram, fpsHistBuckets, fpsBucketWidth, n, 0.01);
  const p01Low = percentileFromHistogram(fpsHistogram, fpsHistBuckets, fpsBucketWidth, n, 0.001);

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

  const p1Ratio = p1Low / avgFps;
  if (p1Ratio < 0.5) {
    instabilityWarnings.push(
      `1% low FPS (${p1Low.toFixed(1)}) is significantly below average (${avgFps.toFixed(1)})`
    );
  }

  let stabilityRating: 'PASS' | 'WARNING' | 'FAIL';
  let overallScore: number;

  if (
    highCount > n * 0.05 ||
    framePacingStability < 70 ||
    stutterScore > 10
  ) {
    stabilityRating = 'FAIL';
    overallScore = Math.max(0, 40 - highCount);
  } else if (
    highCount > n * 0.01 ||
    medCount > n * 0.05 ||
    framePacingStability < 85 ||
    stutterScore > 3
  ) {
    stabilityRating = 'WARNING';
    overallScore = Math.max(40, 75 - highCount - medCount * 0.5);
  } else {
    stabilityRating = 'PASS';
    overallScore = Math.min(100, 90 + framePacingStability * 0.1);
  }

  const analysis: QAAnalysis = {
    anomalyCounts: { high: highCount, medium: medCount, low: Math.max(0, n - highCount - medCount) },
    instabilityWarnings,
    stabilityRating,
    overallScore: Math.round(overallScore),
    totalFrames: n,
  };

  return { metrics, analysis };
}

export function detectRegression(
  metricsA: PerformanceMetrics,
  metricsB: PerformanceMetrics
): RegressionResult {
  const fpsChange =
    ((metricsB.averageFps - metricsA.averageFps) / metricsA.averageFps) * 100;
  const varianceChange =
    ((metricsB.frameTimeVariance - metricsA.frameTimeVariance) /
      Math.max(metricsA.frameTimeVariance, 0.001)) *
    100;
  const stutterChange = metricsB.stutterScore - metricsA.stutterScore;

  const fpsRegression = fpsChange < -3;
  const varianceIncrease = varianceChange > 20;
  const stutterIncrease = stutterChange > 2;

  const isRegressed = fpsRegression || (varianceIncrease && stutterIncrease);

  let summary: string;
  if (isRegressed) {
    const reasons: string[] = [];
    if (fpsRegression) reasons.push(`FPS dropped ${Math.abs(fpsChange).toFixed(1)}%`);
    if (varianceIncrease) reasons.push(`variance increased ${varianceChange.toFixed(1)}%`);
    if (stutterIncrease) reasons.push(`stutter increased by ${stutterChange.toFixed(1)} points`);
    summary = `Driver Performance Regression Detected: ${reasons.join(', ')}`;
  } else {
    summary = 'Driver Performance Stable';
  }

  return {
    fpsRegression,
    fpsChange: Math.round(fpsChange * 100) / 100,
    varianceIncrease,
    varianceChange: Math.round(varianceChange * 100) / 100,
    stutterIncrease,
    stutterChange: Math.round(stutterChange * 100) / 100,
    isRegressed,
    summary,
  };
}
