export interface FrameDataPoint {
  frame: number;
  frameTime: number;
  fps: number;
}

export interface FrameViewMetadata {
  application: string;
  gpu: string;
  cpu: string;
  resolution: string;
  source: 'frameview' | 'generic';
}

export interface DriverDataset {
  label: string;
  fileName: string;
  frames: FrameDataPoint[];
  metadata?: FrameViewMetadata;
  truncated?: boolean;
  totalFrameCount: number;
}

export interface PerformanceMetrics {
  averageFps: number;
  frameTimeVariance: number;
  framePacingStability: number;
  stutterScore: number;
  minFps: number;
  maxFps: number;
  percentile1Low: number;
  percentile01Low: number;
  avgFrameTime: number;
}


export interface QAAnalysis {
  anomalyCounts: { high: number; medium: number; low: number };
  instabilityWarnings: string[];
  stabilityRating: 'PASS' | 'WARNING' | 'FAIL';
  overallScore: number;
  totalFrames: number;
}

export interface RegressionResult {
  fpsRegression: boolean;
  fpsChange: number;
  varianceIncrease: boolean;
  varianceChange: number;
  stutterIncrease: boolean;
  stutterChange: number;
  isRegressed: boolean;
  summary: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
