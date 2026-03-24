interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-6 animate-fade-in hover:bg-nvidia-panel-light hover:border-nvidia-green/40 transition-all duration-300 group">
      <div className="mb-4 text-nvidia-green group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-mono text-lg font-bold text-nvidia-text mb-2 uppercase tracking-tight">{title}</h3>
      <p className="font-mono text-[13px] text-nvidia-muted leading-relaxed">{description}</p>
    </div>
  )
}
