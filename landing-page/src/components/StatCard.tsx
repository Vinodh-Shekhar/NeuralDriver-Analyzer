interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  status?: 'optimal' | 'fair' | 'warning'
}

export default function StatCard({ icon, label, value, unit, status }: StatCardProps) {
  const statusColors = {
    optimal: 'border-nvidia-green/40 shadow-nvidia-green/10',
    fair: 'border-nvidia-warning/40 shadow-nvidia-warning/10',
    warning: 'border-nvidia-danger/40 shadow-nvidia-danger/10',
  }

  return (
    <div className={`rounded-lg border bg-nvidia-panel p-6 animate-fade-in hover:bg-nvidia-panel-light transition-all duration-300 ${status ? statusColors[status] : 'border-nvidia-border'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-nvidia-green">{icon}</div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-3xl font-bold text-nvidia-text">{value}</p>
        {unit && <p className="font-mono text-[11px] text-nvidia-muted">{unit}</p>}
      </div>
    </div>
  )
}
