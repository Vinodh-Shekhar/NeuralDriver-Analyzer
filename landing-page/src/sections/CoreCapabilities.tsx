import { TrendingUp, AlertTriangle, Award } from 'lucide-react'
import StatCard from '../components/StatCard'

export default function CoreCapabilities() {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Core Capabilities</h2>
          <p className="text-lg text-nvidia-muted font-mono max-w-2xl mx-auto">
            Professional-grade performance analysis tools built for GPU driver validation and performance engineering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div data-animate>
            <StatCard
              icon={<TrendingUp size={32} />}
              label="Driver Comparison"
              value="2-3"
              unit="builds simultaneously"
              status="optimal"
            />
            <p className="mt-4 text-nvidia-muted text-sm font-mono">Side-by-side FPS, variance, and stutter analysis across driver versions</p>
          </div>

          <div data-animate>
            <StatCard
              icon={<AlertTriangle size={32} />}
              label="Regression Detection"
              value="Auto"
              unit="detected"
              status="optimal"
            />
            <p className="mt-4 text-nvidia-muted text-sm font-mono">Threshold-based alerts highlight performance drops instantly</p>
          </div>

          <div data-animate>
            <StatCard
              icon={<Award size={32} />}
              label="QA Scoring"
              value="0–100"
              unit="scale"
              status="optimal"
            />
            <p className="mt-4 text-nvidia-muted text-sm font-mono">Automated PASS / WARNING / FAIL classification with detailed metrics</p>
          </div>
        </div>
      </div>
    </section>
  )
}
