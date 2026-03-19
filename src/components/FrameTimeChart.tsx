import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { FrameDataPoint } from '../types/telemetry';

interface SingleChartProps {
  driverKey: 'A' | 'B';
  data: FrameDataPoint[];
}

export function SingleFrameTimeChart({ driverKey, data }: SingleChartProps) {
  const color = driverKey === 'A' ? '#76B900' : '#00ff9c';
  const avgFrameTime = data.reduce((s, d) => s + d.frameTime, 0) / data.length;

  const sampled = sampleData(data, 500);

  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
            driverKey === 'A'
              ? 'bg-nvidia-green/20 text-nvidia-green'
              : 'bg-nvidia-accent/20 text-nvidia-accent'
          }`}
        >
          {driverKey}
        </div>
        <span className="font-mono text-xs font-medium text-nvidia-text">
          Dataset {driverKey} Frame Time
        </span>
        <span className="ml-auto font-mono text-[10px] text-nvidia-muted">
          {data.length} frames
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampled} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="frame"
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
            />
            <YAxis
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'ms',
                position: 'insideTopLeft',
                fill: '#999',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgFrameTime}
              stroke={color}
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="frameTime"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface ComparisonChartProps {
  dataA: FrameDataPoint[];
  dataB: FrameDataPoint[];
}

export function ComparisonChart({ dataA, dataB }: ComparisonChartProps) {
  const maxLen = Math.max(dataA.length, dataB.length);
  const sampledA = sampleData(dataA, 500);
  const sampledB = sampleData(dataB, 500);

  const merged = sampledA.map((d, i) => ({
    frame: d.frame,
    driverA: d.frameTime,
    driverB: sampledB[i]?.frameTime ?? null,
  }));

  if (sampledB.length > sampledA.length) {
    for (let i = sampledA.length; i < sampledB.length; i++) {
      merged.push({
        frame: sampledB[i].frame,
        driverA: null as unknown as number,
        driverB: sampledB[i].frameTime,
      });
    }
  }

  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs font-medium text-nvidia-text">
          Comparison Overlay
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded bg-nvidia-green" />
            <span className="font-mono text-[10px] text-nvidia-muted">Dataset A</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded bg-nvidia-accent" />
            <span className="font-mono text-[10px] text-nvidia-muted">Dataset B</span>
          </div>
          <span className="font-mono text-[10px] text-nvidia-muted">
            {maxLen} frames
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="frame"
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
            />
            <YAxis
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'ms',
                position: 'insideTopLeft',
                fill: '#999',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />
            <Tooltip content={<ComparisonTooltip />} />
            <Line
              type="monotone"
              dataKey="driverA"
              stroke="#76B900"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#76B900' }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="driverB"
              stroke="#00ff9c"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#00ff9c' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-nvidia-border bg-nvidia-panel px-3 py-2 shadow-lg">
      <div className="font-mono text-[10px] text-nvidia-muted">Frame {d.frame}</div>
      <div className="font-mono text-xs text-nvidia-text">
        {d.frameTime?.toFixed(2)} ms
      </div>
      <div className="font-mono text-[10px] text-nvidia-green">
        {(1000 / d.frameTime).toFixed(1)} FPS
      </div>
    </div>
  );
}

function ComparisonTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-nvidia-border bg-nvidia-panel px-3 py-2 shadow-lg">
      <div className="mb-1 font-mono text-[10px] text-nvidia-muted">Frame {d.frame}</div>
      {d.driverA != null && (
        <div className="font-mono text-xs text-nvidia-green">
          A: {d.driverA.toFixed(2)} ms ({(1000 / d.driverA).toFixed(1)} FPS)
        </div>
      )}
      {d.driverB != null && (
        <div className="font-mono text-xs text-nvidia-accent">
          B: {d.driverB.toFixed(2)} ms ({(1000 / d.driverB).toFixed(1)} FPS)
        </div>
      )}
    </div>
  );
}

function sampleData(data: FrameDataPoint[], maxPoints: number): FrameDataPoint[] {
  if (data.length <= maxPoints) return data;
  const step = data.length / maxPoints;
  const sampled: FrameDataPoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(data[Math.floor(i * step)]);
  }
  return sampled;
}
