import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { AlertTriangle, Info } from 'lucide-react';
import type { FrameDataPoint } from '../types/telemetry';

interface Props {
  driverKey: 'A' | 'B';
  data: FrameDataPoint[];
}

interface Bucket {
  range: string;
  rangeMin: number;
  rangeMax: number;
  count: number;
  midpoint: number;
}

function buildHistogram(data: FrameDataPoint[], binWidth: number): Bucket[] {
  if (data.length === 0) return [];

  let rawMin = Infinity;
  let rawMax = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const ft = data[i].frameTime;
    if (ft < rawMin) rawMin = ft;
    if (ft > rawMax) rawMax = ft;
  }
  const min = Math.floor(rawMin / binWidth) * binWidth;
  const max = Math.ceil(rawMax / binWidth) * binWidth;

  const buckets: Bucket[] = [];
  for (let start = min; start < max; start += binWidth) {
    const end = start + binWidth;
    buckets.push({
      range: `${start.toFixed(0)}-${end.toFixed(0)}`,
      rangeMin: start,
      rangeMax: end,
      count: 0,
      midpoint: start + binWidth / 2,
    });
  }

  for (let i = 0; i < data.length; i++) {
    const ft = data[i].frameTime;
    const idx = Math.min(
      Math.floor((ft - min) / binWidth),
      buckets.length - 1
    );
    if (idx >= 0) buckets[idx].count++;
  }

  return buckets;
}

const SIXTY_FPS_MS = 16.67;
const STUTTER_THRESHOLD_MS = 30;

export default function FrameTimeDistribution({ driverKey, data }: Props) {
  const color = driverKey === 'A' ? '#76B900' : '#22d3ee';
  const colorFaded = driverKey === 'A' ? 'rgba(118,185,0,0.7)' : 'rgba(34,211,238,0.7)';
  const labelClass = driverKey === 'A' ? 'text-nvidia-green' : 'text-cyan-400';
  const badgeClass =
    driverKey === 'A'
      ? 'bg-nvidia-green/20 text-nvidia-green'
      : 'bg-cyan-400/20 text-cyan-400';

  const buckets = useMemo(() => buildHistogram(data, 2), [data]);

  const stutterFrames = useMemo(() => {
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].frameTime > STUTTER_THRESHOLD_MS) count++;
    }
    return count;
  }, [data]);

  const hasStutterSpikes = stutterFrames > 0;

  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${badgeClass}`}
        >
          {driverKey}
        </div>
        <span className="font-mono text-xs font-medium text-nvidia-text">
          Dataset {driverKey} Frame Time Distribution
        </span>
        <span className="ml-auto font-mono text-[10px] text-nvidia-muted">
          {data.length} frames
        </span>
      </div>

      <div className="mb-2 flex items-start gap-1.5 rounded border border-nvidia-border/40 bg-nvidia-bg/30 px-2.5 py-1.5">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-nvidia-muted" />
        <span className="font-mono text-[10px] leading-relaxed text-nvidia-muted">
          Frame time distribution reveals frame pacing irregularities and micro stutters.
        </span>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="8%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fill: '#999', fontSize: 9, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'Frame Time (ms)',
                position: 'insideBottom',
                offset: -2,
                fill: '#999',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#999', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#3a3a3a' }}
              tickLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'Frames',
                position: 'insideTopLeft',
                fill: '#999',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />
            <Tooltip content={<DistributionTooltip driverKey={driverKey} color={color} />} />
            <ReferenceLine
              x={buckets.find(
                (b) => b.rangeMin <= SIXTY_FPS_MS && b.rangeMax > SIXTY_FPS_MS
              )?.range}
              stroke="#ffaa00"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: '60 FPS',
                position: 'top',
                fill: '#ffaa00',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {buckets.map((bucket, i) => (
                <Cell
                  key={i}
                  fill={bucket.rangeMin >= STUTTER_THRESHOLD_MS ? '#ff4d4d' : color}
                  fillOpacity={bucket.rangeMin >= STUTTER_THRESHOLD_MS ? 0.85 : 0.8}
                  stroke={bucket.rangeMin >= STUTTER_THRESHOLD_MS ? '#ff4d4d' : color}
                  strokeWidth={0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          <span className={`font-mono text-[10px] ${labelClass}`}>
            Dataset {driverKey}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-4 border-t border-dashed border-nvidia-warning" />
          <span className="font-mono text-[10px] text-nvidia-warning">60 FPS (16.67 ms)</span>
        </div>
      </div>

      {hasStutterSpikes && (
        <div className="mt-2 flex items-center gap-2 rounded border border-nvidia-danger/30 bg-nvidia-danger/5 px-2.5 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-nvidia-danger" />
          <span className="font-mono text-[10px] text-nvidia-danger">
            Potential stutter events detected in frame time distribution ({stutterFrames} frames above {STUTTER_THRESHOLD_MS} ms)
          </span>
        </div>
      )}
    </div>
  );
}

function DistributionTooltip({
  active,
  payload,
  driverKey,
  color,
}: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Bucket;
  return (
    <div className="rounded border border-nvidia-border bg-nvidia-panel px-3 py-2 shadow-lg">
      <div className="font-mono text-[10px] text-nvidia-muted">
        Dataset {driverKey}
      </div>
      <div className="font-mono text-xs" style={{ color }}>
        {d.rangeMin.toFixed(1)} - {d.rangeMax.toFixed(1)} ms
      </div>
      <div className="font-mono text-xs text-nvidia-text">
        {d.count} frames
      </div>
    </div>
  );
}
