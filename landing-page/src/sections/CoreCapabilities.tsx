import { TrendingUp, AlertTriangle, Activity, BarChart3 } from 'lucide-react'
import StatCard from '../components/StatCard'

export default function CoreCapabilities() {
  const capabilities = [
    {
      icon: <TrendingUp size={24} />,
      label: "Driver Comparison",
      value: "Multi",
      unit: "datasets",
      status: "optimal" as const,
      description: "Compare multiple driver builds or hardware configurations side-by-side with synchronized timelines."
    },
    {
      icon: <AlertTriangle size={24} />,
      label: "Regression Detection",
      value: "Auto",
      unit: "detected",
      status: "optimal" as const,
      description: "Instantly identify performance drops across driver versions with statistical anomaly detection."
    },
    {
      icon: <Activity size={24} />,
      label: "Stutter Analysis",
      value: "1.0%",
      unit: "lows & stutters",
      status: "optimal" as const,
      description: "Deep-dive into frame-time variance to find micro-stutters that FPS averages often hide."
    },
    {
      icon: <BarChart3 size={24} />,
      label: "Pacing Stability",
      value: "95%",
      unit: "stability score",
      status: "optimal" as const,
      description: "Evaluate the consistency of frame delivery to ensure a smooth, judder-free gaming experience."
    }
  ]

  return (
    <section id="capabilities" className="py-32 relative overflow-hidden bg-nvidia-bg">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono tracking-tight uppercase">Core Capabilities</h2>
          <p className="text-lg text-nvidia-muted max-w-2xl mx-auto font-mono">
            Professional-grade performance analysis tools built for <span className="text-nvidia-green">GPU driver validation</span> and performance engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="flex flex-col">
              <StatCard
                icon={cap.icon}
                label={cap.label}
                value={cap.value}
                unit={cap.unit}
                status={cap.status}
              />
              <p className="mt-4 text-nvidia-muted text-[11px] font-mono leading-relaxed px-2">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
