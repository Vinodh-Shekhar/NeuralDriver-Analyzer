import { Gamepad2, FlaskConical, HardDrive, Settings } from 'lucide-react'

interface UseCaseProps {
  icon: React.ReactNode
  title: string
  description: string
  points: string[]
}

function UseCaseCard({ icon, title, description, points }: UseCaseProps) {
  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-8 hover:bg-nvidia-panel-light hover:border-nvidia-green/40 transition-all duration-300 animate-fade-in" data-animate>
      <div className="text-nvidia-green mb-4">{icon}</div>
      <h3 className="font-mono text-xl font-bold text-nvidia-text mb-2 uppercase tracking-tight">{title}</h3>
      <p className="font-mono text-xs text-nvidia-muted mb-6 leading-relaxed uppercase tracking-tighter">{description}</p>
      <ul className="space-y-3">
        {points.map((point, idx) => (
          <li key={idx} className="flex gap-3 items-start">
            <span className="font-mono text-nvidia-green text-sm leading-none mt-1">/</span>
            <span className="font-mono text-[11px] text-nvidia-muted uppercase tracking-tight">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function UseCases() {
  const useCases = [
    {
      icon: <Gamepad2 size={24} />,
      title: 'Driver Validation',
      description: 'Automated regression detection for GPU driver builds.',
      points: [
        'Side-by-side driver build comparison',
        'Z-score based statistical validation',
        'Automatic PASS/FAIL verdict generation',
        'Syncronized frame-time telemetry',
      ],
    },
    {
      icon: <FlaskConical size={24} />,
      title: 'Performance QA',
      description: 'In-depth analysis of frame pacing and stuttering.',
      points: [
        'Micro-stutter detection algorithms',
        '1% Lows & frame-time distribution',
        'Pacing stability scoring',
        'Identify systemic engine bottlenecks',
      ],
    },
    {
      icon: <HardDrive size={24} />,
      title: 'Hardware Testing',
      description: 'Benchmark system stability across configurations.',
      points: [
        'Cross-GPU architecture comparison',
        'V-RAM & system memory impact',
        'Thermal throttling impact analysis',
        'Hardware-agnostic CSV ingestion',
      ],
    },
    {
      icon: <Settings size={24} />,
      title: 'Game Optimization',
      description: 'Validate graphics settings for stability.',
      points: [
        'Analyze preset performance scaling',
        'Frame-time impact of Ray Tracing/DLSS',
        'Optimization report generation',
        'Consistent methodology validation',
      ],
    },
  ]

  return (
    <section className="py-32 relative overflow-hidden bg-nvidia-bg">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono tracking-tight uppercase">Operational Scenarios</h2>
          <p className="text-lg text-nvidia-muted max-w-2xl mx-auto font-mono">
            FrameBench powers critical workflows for <span className="text-nvidia-green underline decoration-nvidia-green/40 decoration-2 underline-offset-8">performance engineering</span> teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <UseCaseCard key={idx} {...useCase} />
          ))}
        </div>
      </div>
    </section>
  )
}
