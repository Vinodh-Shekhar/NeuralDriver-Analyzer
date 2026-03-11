import { Fan, Thermometer, Zap, MemoryStick } from 'lucide-react';

interface Props {
  hasData: boolean;
}

const colorStyles: Record<string, { text: string; bg: string }> = {
  green: { text: 'text-nvidia-green', bg: 'bg-nvidia-green' },
  accent: { text: 'text-nvidia-accent', bg: 'bg-nvidia-accent' },
};

export default function GpuStatusWidget({ hasData }: Props) {
  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Fan className="h-4 w-4 animate-fan-spin text-nvidia-green" />
        <span className="font-mono text-sm font-medium text-nvidia-text">GPU Status</span>
        <div
          className={`ml-auto h-2 w-2 rounded-full ${
            hasData ? 'bg-nvidia-green animate-pulse-glow' : 'bg-nvidia-muted'
          }`}
        />
      </div>

      <div className="space-y-2.5">
        <GpuStat
          icon={<Thermometer className="h-3.5 w-3.5" />}
          label="Core Temp"
          value={hasData ? '67C' : '--'}
          bar={hasData ? 67 : 0}
          color="green"
        />
        <GpuStat
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Power"
          value={hasData ? '245W' : '--'}
          bar={hasData ? 78 : 0}
          color="accent"
        />
        <GpuStat
          icon={<MemoryStick className="h-3.5 w-3.5" />}
          label="VRAM"
          value={hasData ? '8.2 GB' : '--'}
          bar={hasData ? 68 : 0}
          color="green"
        />
        <GpuStat
          icon={<Fan className="h-3.5 w-3.5" />}
          label="Fan RPM"
          value={hasData ? '1840' : '--'}
          bar={hasData ? 55 : 0}
          color="accent"
        />
      </div>

      <div className="mt-3 rounded bg-nvidia-bg/40 px-2.5 py-2 ring-1 ring-nvidia-border/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
            Driver Status
          </span>
          <span
            className={`font-mono text-[10px] font-bold ${
              hasData ? 'text-nvidia-green' : 'text-nvidia-muted'
            }`}
          >
            {hasData ? 'MONITORING' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
}

function GpuStat({
  icon,
  label,
  value,
  bar,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bar: number;
  color: string;
}) {
  const styles = colorStyles[color] ?? colorStyles.green;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={styles.text}>{icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
            {label}
          </span>
        </div>
        <span className="font-mono text-xs font-medium text-nvidia-text">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-nvidia-bg">
        <div
          className={`h-full rounded-full ${styles.bg} transition-all duration-700`}
          style={{ width: `${bar}%` }}
        />
      </div>
    </div>
  );
}
