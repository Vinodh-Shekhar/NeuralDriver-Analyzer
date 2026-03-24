import { useState } from 'react'

export default function ComparisonShowcase() {
  const [activeTab, setActiveTab] = useState<'stable' | 'comparison'>('stable')

  return (
    <section className="py-32 relative overflow-hidden bg-nvidia-bg">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono tracking-tight uppercase">Performance Benchmarks</h2>
          <p className="text-lg text-nvidia-muted max-w-2xl mx-auto font-mono">
            Visualize real-world <span className="text-nvidia-green">frame-time telemetry</span> analyzed side-by-side.
          </p>
        </div>

        <div className="mb-10">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveTab('stable')}
              className={`px-6 py-2 rounded-md font-mono text-xs font-bold transition-all uppercase tracking-wider border ${
                activeTab === 'stable'
                  ? 'bg-nvidia-green text-black border-nvidia-green glow-green'
                  : 'bg-nvidia-panel text-nvidia-muted border-nvidia-border hover:border-nvidia-green/40'
              }`}
            >
              Single Dataset
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-2 rounded-md font-mono text-xs font-bold transition-all uppercase tracking-wider border ${
                activeTab === 'comparison'
                  ? 'bg-nvidia-green text-black border-nvidia-green glow-green'
                  : 'bg-nvidia-panel text-nvidia-muted border-nvidia-border hover:border-nvidia-green/40'
              }`}
            >
              Driver Comparison
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-nvidia-border bg-nvidia-panel overflow-hidden p-8 glow-green animate-slide-up">
          {activeTab === 'stable' ? (
            <div className="animate-fade-in">
              <div className="relative group overflow-hidden rounded-lg border border-nvidia-border mb-6">
                <img
                  src="/image.png"
                  alt="Stable performance benchmark"
                  className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-nvidia-green/20 border border-nvidia-green/40 backdrop-blur-md rounded-full">
                  <span className="font-mono text-[10px] font-bold text-nvidia-green uppercase tracking-widest">Baseline Build</span>
                </div>
              </div>
              <div className="p-6 bg-nvidia-bg/50 rounded-lg border border-nvidia-border">
                <h3 className="font-mono text-sm font-bold text-nvidia-green mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-nvidia-green"></span>
                  Telemetry Analysis
                </h3>
                <ul className="space-y-3 font-mono text-[11px] text-nvidia-muted uppercase tracking-tight">
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-green">/</span>
                    Consistent frame delivery: 4.2ms avg variance
                  </li>
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-green">/</span>
                    Frame timing clustering around 144Hz target
                  </li>
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-green">/</span>
                    0.0% Stutter score detected in 60s sample
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="relative group overflow-hidden rounded-lg border border-nvidia-border mb-6">
                <img
                  src="/edited-photo.png"
                  alt="Driver comparison benchmark"
                  className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-nvidia-accent/20 border border-nvidia-accent/40 backdrop-blur-md rounded-full">
                  <span className="font-mono text-[10px] font-bold text-nvidia-accent uppercase tracking-widest">A/B Regression Check</span>
                </div>
              </div>
              <div className="p-6 bg-nvidia-bg/50 rounded-lg border border-nvidia-border">
                <h3 className="font-mono text-sm font-bold text-nvidia-accent mb-4 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-nvidia-accent"></span>
                  Comparative Metrics
                </h3>
                <ul className="space-y-3 font-mono text-[11px] text-nvidia-muted uppercase tracking-tight">
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-accent">/</span>
                    Dataset A (Build 551.23): 238.3 Avg FPS
                  </li>
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-accent">/</span>
                    Dataset B (Build 555.85): 277.2 Avg FPS
                  </li>
                  <li className="flex gap-3 items-center">
                    <span className="text-nvidia-accent">/</span>
                    Delta: +16.3% performance uplift detected
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
