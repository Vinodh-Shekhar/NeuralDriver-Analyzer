interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  status?: 'optimal' | 'fair' | 'warning'
}

export default function StatCard({ icon, label, value, unit, status }: StatCardProps) {
  const statusColors = {
    optimal: 'border-nvidia-green glow-green',
    fair: 'border-nvidia-warning',
    warning: 'border-nvidia-danger glow-danger',
  }

  return (
    <div className={`rounded-lg border bg-nvidia-panel p-6 animate-fade-in ${status ? statusColors[status] : 'border-nvidia-border'} transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-nvidia-green">{icon}</div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-3xl font-bold text-nvidia-green">{value}</p>
        {unit && <p className="font-mono text-nvidia-muted text-sm">{unit}</p>}
      </div>
    </div>
  )
}
