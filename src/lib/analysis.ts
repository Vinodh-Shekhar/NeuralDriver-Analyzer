import type {
  PerformanceMetrics,
  AnomalyResult,
  QAAnalysis,
  RegressionResult,
} from '../types/telemetry';

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
}

function standardDeviation(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function calculateMetrics(frameTimes: number[]): PerformanceMetrics {
  const fpsValues = frameTimes.map(ft => 1000 / ft);
  const avgFps = mean(fpsValues);
  const ftVariance = variance(frameTimes);
  const avgFrameTime = mean(frameTimes);

  const pacingDeviations = frameTimes.map(ft => Math.abs(ft - avgFrameTime) / avgFrameTime);
  const avgDeviation = mean(pacingDeviations);
  const framePacingStability = Math.max(0, Math.min(100, (1 - avgDeviation) * 100));

  let stutterCount = 0;
  for (let i = 1; i < frameTimes.length; i++) {
    if (frameTimes[i] > avgFrameTime * 1.5) {
      stutterCount++;
    }
  }
  const stutterScore = (stutterCount / frameTimes.length) * 100;

  const sortedFps = [...fpsValues].sort((a, b) => a - b);
  const p1Index = Math.ceil(0.01 * sortedFps.length) - 1;
  const p01Index = Math.ceil(0.001 * sortedFps.length) - 1;

  return {
    averageFps: Math.round(avgFps * 100) / 100,
    frameTimeVariance: Math.round(ftVariance * 1000) / 1000,
    framePacingStability: Math.round(framePacingStability * 100) / 100,
    stutterScore: Math.round(stutterScore * 100) / 100,
    minFps: Math.round(Math.min(...fpsValues) * 100) / 100,
    maxFps: Math.round(Math.max(...fpsValues) * 100) / 100,
    percentile1Low: Math.round(sortedFps[Math.max(0, p1Index)] * 100) / 100,
    percentile01Low: Math.round(sortedFps[Math.max(0, p01Index)] * 100) / 100,
    avgFrameTime: Math.round(avgFrameTime * 1000) / 1000,
  };
}

export function detectAnomalies(frameTimes: number[]): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];
  const avg = mean(frameTimes);
  const stdDev = standardDeviation(frameTimes);

  const windowSize = 10;

  for (let i = 0; i < frameTimes.length; i++) {
    const ft = frameTimes[i];
    const deviation = Math.abs(ft - avg) / stdDev;

    if (deviation > 3) {
      anomalies.push({
        frameIndex: i,
        frameTime: ft,
        expectedFrameTime: avg,
        severity: 'high',
        type: ft > avg ? 'spike' : 'drop',
      });
    } else if (deviation > 2) {
      anomalies.push({
        frameIndex: i,
        frameTime: ft,
        expectedFrameTime: avg,
        severity: 'medium',
        type: ft > avg ? 'spike' : 'drop',
      });
    }

    if (i >= windowSize) {
      const window = frameTimes.slice(i - windowSize, i);
      const windowVar = variance(window);
      const globalVar = variance(frameTimes);
      if (windowVar > globalVar * 2.5) {
        const existing = anomalies.find(a => a.frameIndex === i);
        if (!existing) {
          anomalies.push({
            frameIndex: i,
            frameTime: ft,
            expectedFrameTime: avg,
            severity: 'low',
            type: 'instability',
          });
        }
      }
    }
  }

  return anomalies;
}

export function runQAAnalysis(frameTimes: number[]): QAAnalysis {
  const anomalies = detectAnomalies(frameTimes);
  const metrics = calculateMetrics(frameTimes);

  const instabilityWarnings: string[] = [];

  const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
  const medAnomalies = anomalies.filter(a => a.severity === 'medium').length;
  const totalFrames = frameTimes.length;

  if (highAnomalies > totalFrames * 0.02) {
    instabilityWarnings.push(
      `High spike rate: ${highAnomalies} severe frame spikes detected (${((highAnomalies / totalFrames) * 100).toFixed(1)}%)`
    );
  }

  if (metrics.framePacingStability < 85) {
    instabilityWarnings.push(
      `Frame pacing instability: stability score ${metrics.framePacingStability.toFixed(1)}% is below threshold`
    );
  }

  if (metrics.stutterScore > 5) {
    instabilityWarnings.push(
      `Elevated stutter: ${metrics.stutterScore.toFixed(1)}% of frames exceed 1.5x average frame time`
    );
  }

  const p1Ratio = metrics.percentile1Low / metrics.averageFps;
  if (p1Ratio < 0.5) {
    instabilityWarnings.push(
      `1% low FPS (${metrics.percentile1Low.toFixed(1)}) is significantly below average (${metrics.averageFps.toFixed(1)})`
    );
  }

  let stabilityRating: 'PASS' | 'WARNING' | 'FAIL';
  let overallScore: number;

  if (
    highAnomalies > totalFrames * 0.05 ||
    metrics.framePacingStability < 70 ||
    metrics.stutterScore > 10
  ) {
    stabilityRating = 'FAIL';
    overallScore = Math.max(0, 40 - highAnomalies);
  } else if (
    highAnomalies > totalFrames * 0.01 ||
    medAnomalies > totalFrames * 0.05 ||
    metrics.framePacingStability < 85 ||
    metrics.stutterScore > 3
  ) {
    stabilityRating = 'WARNING';
    overallScore = Math.max(40, 75 - highAnomalies - medAnomalies * 0.5);
  } else {
    stabilityRating = 'PASS';
    overallScore = Math.min(100, 90 + metrics.framePacingStability * 0.1);
  }

  return {
    anomalies,
    instabilityWarnings,
    stabilityRating,
    overallScore: Math.round(overallScore),
  };
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
