import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  href?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  href,
}: ButtonProps) {
  const baseStyles = 'font-mono rounded transition-all duration-300 flex items-center justify-center gap-2'

  const variants = {
    primary: 'shimmer-btn bg-nvidia-green/10 text-nvidia-green border border-nvidia-green/50 hover:bg-nvidia-green/20',
    secondary: 'border border-nvidia-border/50 bg-nvidia-bg/40 hover:bg-nvidia-panel-light text-nvidia-text transition-colors',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
    >
      {children}
    </button>
  )
}
