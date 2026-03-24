import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  href,
  target,
  rel,
}: ButtonProps) {
  const baseStyles = 'font-mono font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-tight'

  const variants = {
    primary: 'bg-nvidia-green text-black hover:bg-nvidia-accent glow-green shimmer-btn',
    secondary: 'bg-nvidia-panel text-nvidia-green border border-nvidia-border hover:bg-nvidia-panel-light hover:border-nvidia-green/50',
    outline: 'border border-nvidia-green/40 bg-nvidia-green/10 text-nvidia-green hover:bg-nvidia-green/20 glow-green',
  }

  const sizes = {
    sm: 'px-4 py-1.5 text-[11px]',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={combinedClasses} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      className={combinedClasses}
    >
      {children}
    </button>
  )
}
