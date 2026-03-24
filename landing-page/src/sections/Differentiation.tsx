import { Zap, BarChart3, Cpu, Lightbulb } from 'lucide-react'
import FeatureCard from '../components/FeatureCard'

export default function Differentiation() {
  const features = [
    {
      icon: <Zap size={24} />,
      title: 'Actionable Insights',
      description: 'Go beyond raw numbers. Our engine automatically flags performance regressions and micro-stutters with clear visual indicators.',
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Statistical Precision',
      description: 'Utilize Z-score based anomaly detection and frame-time distribution analysis to validate performance consistency across any dataset.',
    },
    {
      icon: <Cpu size={24} />,
      title: 'Driver QA Workflow',
      description: 'Designed specifically for GPU driver validation teams. Import CSV telemetry from FrameView or PresentMon and generate reports in seconds.',
    },
    {
      icon: <Lightbulb size={24} />,
      title: 'Automated Scoring',
      description: 'A unified PASS/WARNING/FAIL system based on industry-standard stability metrics like 1% lows and Pacing Stability.',
    },
  ]

  return (
    <section className="py-32 relative overflow-hidden bg-nvidia-panel/20 border-y border-nvidia-border">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-nvidia-green/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-nvidia-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono tracking-tight uppercase">Why FrameBench?</h2>
          <p className="text-lg text-nvidia-muted max-w-2xl mx-auto font-mono">
            Engineered for high-performance <span className="text-nvidia-text underline decoration-nvidia-green decoration-2 underline-offset-4">validation pipelines</span> where every millisecond counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx}>
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
