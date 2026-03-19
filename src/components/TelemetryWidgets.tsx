import { Shield, BarChart3, Award } from 'lucide-react';
import type { PerformanceMetrics, QAAnalysis } from '../types/telemetry';

interface Props {
  metricsA: PerformanceMetrics | null;
  metricsB: PerformanceMetrics | null;
  analysisA: QAAnalysis | null;
  analysisB: QAAnalysis | null;
}

export default function TelemetryWidgets({
  metricsA,
  metricsB,
  analysisA,
  analysisB,
}: Props) {
  const gpuStability = computeGpuStability(analysisA, analysisB);
  const framePacing = computeFramePacing(metricsA, metricsB);
  const reliability = computeReliability(analysisA, analysisB);

  return (
    <div className="grid grid-cols-3 gap-3">
      <ScoreWidget
        icon={<Shield className="h-5 w-5" />}
        label="GPU Stability Score"
        score={gpuStability.score}
        rating={gpuStability.rating}
        color={gpuStability.color}
      />
      <ScoreWidget
        icon={<BarChart3 className="h-5 w-5" />}
        label="Frame Pacing Score"
        score={framePacing.score}
        rating={framePacing.rating}
        color={framePacing.color}
      />
      <ScoreWidget
        icon={<Award className="h-5 w-5" />}
        label="Benchmark Reliability"
        score={reliability.score}
        rating={reliability.rating}
        color={reliability.color}
      />
    </div>
  );
}

function ScoreWidget({
  icon,
  label,
  score,
  rating,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  rating: string;
  color: string;
}) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    color === 'green' ? '#76B900' : color === 'yellow' ? '#ffaa00' : '#ff4d4d';
  const textColor =
    color === 'green'
      ? 'text-nvidia-green'
      : color === 'yellow'
      ? 'text-nvidia-warning'
      : 'text-nvidia-danger';

  return (
    <div className="flex flex-col items-center rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="relative mb-3">
        <svg width="88" height="88" className="-rotate-90">
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="#2b2b2b"
            strokeWidth="5"
          />
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textColor}`}>{icon}</span>
          <span className={`font-mono text-lg font-bold ${textColor}`}>{score}</span>
        </div>
      </div>
      <span className="text-center font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
        {label}
      </span>
      <span className={`mt-0.5 font-mono text-xs font-bold ${textColor}`}>{rating}</span>
    </div>
  );
}

function computeGpuStability(a: QAAnalysis | null, b: QAAnalysis | null) {
  if (!a && !b) return { score: 0, rating: 'N/A', color: 'gray' };
  const scores = [a?.overallScore, b?.overallScore].filter(Boolean) as number[];
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  return {
    score: Math.round(avg),
    rating: avg >= 80 ? 'STABLE' : avg >= 50 ? 'MARGINAL' : 'UNSTABLE',
    color: avg >= 80 ? 'green' : avg >= 50 ? 'yellow' : 'red',
  };
}

function computeFramePacing(a: PerformanceMetrics | null, b: PerformanceMetrics | null) {
  if (!a && !b) return { score: 0, rating: 'N/A', color: 'gray' };
  const scores = [a?.framePacingStability, b?.framePacingStability].filter(
    Boolean
  ) as number[];
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  return {
    score: Math.round(avg),
    rating: avg >= 90 ? 'EXCELLENT' : avg >= 75 ? 'FAIR' : 'POOR',
    color: avg >= 90 ? 'green' : avg >= 75 ? 'yellow' : 'red',
  };
}

function computeReliability(a: QAAnalysis | null, b: QAAnalysis | null) {
  if (!a && !b) return { score: 0, rating: 'N/A', color: 'gray' };
  const ratings = [a?.stabilityRating, b?.stabilityRating].filter(Boolean) as string[];
  const passCount = ratings.filter((r) => r === 'PASS').length;
  const failCount = ratings.filter((r) => r === 'FAIL').length;

  if (failCount > 0) return { score: 25, rating: 'UNRELIABLE', color: 'red' };
  if (passCount === ratings.length)
    return { score: 95, rating: 'RELIABLE', color: 'green' };
  return { score: 65, rating: 'CONDITIONAL', color: 'yellow' };
}
