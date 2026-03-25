interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-6 animate-fade-in hover:bg-nvidia-panel-light transition-colors group">
      <div className="mb-4 text-nvidia-green group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-nvidia-text mb-2">{title}</h3>
      <p className="text-nvidia-muted text-sm leading-relaxed font-mono">{description}</p>
    </div>
  )
}
