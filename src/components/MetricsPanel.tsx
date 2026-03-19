import { Gauge, Timer, BarChart3, AlertTriangle, Activity } from 'lucide-react';
import type { PerformanceMetrics } from '../types/telemetry';

interface Props {
  driverKey: 'A' | 'B';
  metrics: PerformanceMetrics | null;
}

export default function MetricsPanel({ driverKey, metrics }: Props) {
  const accentClass = driverKey === 'A' ? 'text-nvidia-green' : 'text-nvidia-accent';

  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
            driverKey === 'A'
              ? 'bg-nvidia-green/20 text-nvidia-green'
              : 'bg-nvidia-accent/20 text-nvidia-accent'
          }`}
        >
          {driverKey}
        </div>
        <span className="font-mono text-sm font-medium text-nvidia-text">
          Dataset {driverKey} Performance
        </span>
      </div>

      {metrics ? (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Gauge className="h-4 w-4" />}
            label="Average FPS"
            value={metrics.averageFps.toFixed(1)}
            unit="fps"
            accentClass={accentClass}
          />
          <MetricCard
            icon={<Timer className="h-4 w-4" />}
            label="Frame Time Variance"
            value={metrics.frameTimeVariance.toFixed(2)}
            unit="ms2"
            accentClass={accentClass}
            warn={metrics.frameTimeVariance > 10}
          />
          <MetricCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Pacing Stability"
            value={metrics.framePacingStability.toFixed(1)}
            unit="%"
            accentClass={accentClass}
            warn={metrics.framePacingStability < 85}
          />
          <MetricCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Stutter Score"
            value={metrics.stutterScore.toFixed(2)}
            unit="%"
            accentClass={accentClass}
            warn={metrics.stutterScore > 3}
          />
          <MetricCard
            icon={<Gauge className="h-4 w-4" />}
            label="1% Low FPS"
            value={metrics.percentile1Low.toFixed(1)}
            unit="fps"
            accentClass={accentClass}
          />
          <MetricCard
            icon={<Timer className="h-4 w-4" />}
            label="Avg Frame Time"
            value={metrics.avgFrameTime.toFixed(2)}
            unit="ms"
            accentClass={accentClass}
          />
          <FramePacingQualityCard metrics={metrics} />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-nvidia-border bg-nvidia-bg/20">
          <span className="font-mono text-xs text-nvidia-muted">
            Upload Dataset {driverKey} to view metrics
          </span>
        </div>
      )}
    </div>
  );
}

function getFramePacingStatus(metrics: PerformanceMetrics) {
  const delta = metrics.averageFps - metrics.percentile1Low;
  if (delta <= 10) return { label: 'Excellent', color: 'text-nvidia-green', border: 'border-nvidia-green/40', bg: 'bg-nvidia-green/5', glow: true };
  if (delta <= 25) return { label: 'Good', color: 'text-nvidia-warning', border: 'border-nvidia-warning/30', bg: 'bg-nvidia-warning/5', glow: false };
  return { label: 'Unstable', color: 'text-nvidia-danger', border: 'border-nvidia-danger/30', bg: 'bg-nvidia-danger/5', glow: false };
}

function FramePacingQualityCard({ metrics }: { metrics: PerformanceMetrics }) {
  const status = getFramePacingStatus(metrics);
  const delta = (metrics.averageFps - metrics.percentile1Low).toFixed(1);

  return (
    <div
      className={`col-span-2 rounded-md border px-3 py-2.5 transition-all ${status.border} ${status.bg} ${
        status.glow ? 'shadow-[0_0_12px_rgba(118,185,0,0.15)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Activity className={`h-4 w-4 ${status.color}`} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
              Frame Pacing Quality
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-lg font-bold ${status.color}`}>
              {status.label}
            </span>
            <span className="font-mono text-[10px] text-nvidia-muted">
              delta {delta} fps
            </span>
          </div>
          <span className="font-mono text-[10px] text-nvidia-muted/70">
            Frame delivery stability indicator
          </span>
        </div>
        {status.label === 'Unstable' && (
          <AlertTriangle className="h-5 w-5 shrink-0 text-nvidia-danger" />
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  accentClass,
  warn = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  accentClass: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2.5 transition-colors ${
        warn
          ? 'border-nvidia-warning/30 bg-nvidia-warning/5'
          : 'border-nvidia-border/50 bg-nvidia-bg/40'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className={warn ? 'text-nvidia-warning' : accentClass}>{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono text-lg font-bold ${
            warn ? 'text-nvidia-warning' : 'text-nvidia-text'
          }`}
        >
          {value}
        </span>
        <span className="font-mono text-[10px] text-nvidia-muted">{unit}</span>
      </div>
    </div>
  );
}
