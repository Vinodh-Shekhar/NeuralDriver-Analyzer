import {
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowDown,
  ArrowUp,
  Minus,
} from 'lucide-react';
import type { RegressionResult } from '../types/telemetry';

interface Props {
  result: RegressionResult | null;
}

export default function RegressionPanel({ result }: Props) {
  if (!result) return null;

  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        {result.isRegressed ? (
          <TrendingDown className="h-4 w-4 text-nvidia-danger" />
        ) : (
          <TrendingUp className="h-4 w-4 text-nvidia-green" />
        )}
        <span className="font-mono text-sm font-medium text-nvidia-text">
          Performance Regression Detection
        </span>
      </div>

      <div
        className={`mb-4 rounded-md border px-4 py-3 ${
          result.isRegressed
            ? 'border-nvidia-danger/30 bg-nvidia-danger/5'
            : 'border-nvidia-green/30 bg-nvidia-green/5'
        }`}
      >
        <div className="flex items-center gap-3">
          {result.isRegressed ? (
            <XCircle className="h-6 w-6 shrink-0 text-nvidia-danger" />
          ) : (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-nvidia-green" />
          )}
          <div>
            <div
              className={`font-mono text-sm font-bold ${
                result.isRegressed ? 'text-nvidia-danger' : 'text-nvidia-green'
              }`}
            >
              {result.isRegressed
                ? 'Performance Regression Detected'
                : 'Performance Stable'}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-nvidia-muted">
              {result.summary}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <RegressionMetric
          label="FPS Change"
          value={`${result.fpsChange > 0 ? '+' : ''}${result.fpsChange.toFixed(1)}%`}
          isNegative={result.fpsRegression}
          icon={
            result.fpsChange < 0 ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : result.fpsChange > 0 ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )
          }
        />
        <RegressionMetric
          label="Variance Change"
          value={`${result.varianceChange > 0 ? '+' : ''}${result.varianceChange.toFixed(1)}%`}
          isNegative={result.varianceIncrease}
          icon={
            result.varianceChange > 0 ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : result.varianceChange < 0 ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )
          }
        />
        <RegressionMetric
          label="Stutter Delta"
          value={`${result.stutterChange > 0 ? '+' : ''}${result.stutterChange.toFixed(2)} pts`}
          isNegative={result.stutterIncrease}
          icon={
            result.stutterChange > 0 ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : result.stutterChange < 0 ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )
          }
        />
      </div>
    </div>
  );
}

function RegressionMetric({
  label,
  value,
  isNegative,
  icon,
}: {
  label: string;
  value: string;
  isNegative: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2.5 ${
        isNegative
          ? 'border-nvidia-danger/30 bg-nvidia-danger/5'
          : 'border-nvidia-border/50 bg-nvidia-bg/40'
      }`}
    >
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={isNegative ? 'text-nvidia-danger' : 'text-nvidia-green'}>{icon}</span>
        <span
          className={`font-mono text-sm font-bold ${
            isNegative ? 'text-nvidia-danger' : 'text-nvidia-text'
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
