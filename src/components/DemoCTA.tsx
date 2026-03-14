import { Zap, ChevronRight, Activity } from 'lucide-react';

interface DemoCTAProps {
  onGenerate: () => void;
}

export default function DemoCTA({ onGenerate }: DemoCTAProps) {
  return (
    <div className="relative animate-fade-in py-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-32 w-32 rounded-full border border-nvidia-green/10 animate-ring-expand" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="h-32 w-32 rounded-full border border-nvidia-green/10 animate-ring-expand"
          style={{ animationDelay: '0.8s' }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="h-32 w-32 rounded-full border border-nvidia-green/10 animate-ring-expand"
          style={{ animationDelay: '1.6s' }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 animate-text-flicker">
          <Activity className="h-3.5 w-3.5 text-nvidia-green/60" />
          <span className="font-mono text-xs tracking-widest uppercase text-nvidia-green/60">
            No telemetry loaded
          </span>
          <Activity className="h-3.5 w-3.5 text-nvidia-green/60" />
        </div>

        <h3 className="font-mono text-lg font-semibold text-nvidia-text tracking-tight">
          See it in action
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            <ChevronRight className="h-4 w-4 text-nvidia-green/40 animate-chevron-nudge" />
            <ChevronRight
              className="h-4 w-4 text-nvidia-green/60 animate-chevron-nudge"
              style={{ animationDelay: '0.15s' }}
            />
            <ChevronRight
              className="h-4 w-4 text-nvidia-green/80 animate-chevron-nudge"
              style={{ animationDelay: '0.3s' }}
            />
          </div>

          <button
            onClick={onGenerate}
            className="shimmer-btn group relative flex items-center gap-2.5 rounded-lg border border-nvidia-green/40 bg-nvidia-green/10 px-6 py-3 font-mono text-sm font-semibold text-nvidia-green transition-all animate-bounce-gentle hover:border-nvidia-green hover:bg-nvidia-green/20 hover:shadow-[0_0_30px_rgba(118,185,0,0.25)] active:scale-[0.97]"
          >
            <Zap className="h-4 w-4 transition-transform group-hover:scale-125 group-hover:rotate-12" />
            Generate Sample Telemetry
            <span className="ml-1 rounded bg-nvidia-green/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-nvidia-green animate-pulse-glow">
              DEMO
            </span>
          </button>

          <div className="flex gap-0.5">
            <ChevronRight
              className="h-4 w-4 text-nvidia-green/80 rotate-180 animate-chevron-nudge"
              style={{ animationDelay: '0.3s' }}
            />
            <ChevronRight
              className="h-4 w-4 text-nvidia-green/60 rotate-180 animate-chevron-nudge"
              style={{ animationDelay: '0.15s' }}
            />
            <ChevronRight
              className="h-4 w-4 text-nvidia-green/40 rotate-180 animate-chevron-nudge"
            />
          </div>
        </div>

        <p className="font-mono text-[11px] text-nvidia-muted animate-text-flicker mt-1">
          Instantly generate GPU frame-time data to explore the full dashboard
        </p>
      </div>
    </div>
  );
}
