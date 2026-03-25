import { useEffect, useRef } from 'react'

export default function AnimatedGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    let animationFrame = 0
    let time = 0

    // Driver A — higher variance (nvidia-green #76B900)
    const waveA = (x: number, t: number) => {
      const freq = 0.018
      const amp = height * 0.22
      const base = height * 0.52
      return (
        base -
        Math.sin((x + t) * freq) * amp -
        Math.cos((x + t) * freq * 0.7) * amp * 0.3 -
        Math.sin((x + t) * freq * 2.3) * amp * 0.12
      )
    }

    // Driver B — smoother, lower avg frame time (nvidia-accent #00ff9c)
    const waveB = (x: number, t: number) => {
      const freq = 0.018
      const amp = height * 0.13
      const base = height * 0.36
      return (
        base -
        Math.sin((x + t * 1.05) * freq) * amp -
        Math.cos((x + t * 1.05) * freq * 0.6) * amp * 0.18
      )
    }

    const drawWave = (
      waveFn: (x: number, t: number) => number,
      strokeColor: string,
      glowColor: string,
      fillColor: string,
    ) => {
      // Glow pass
      ctx.strokeStyle = glowColor
      ctx.lineWidth = 8
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = waveFn(x, time)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Main line
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = waveFn(x, time)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Fill under curve
      ctx.fillStyle = fillColor
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = waveFn(x, time)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.fill()
    }

    const animate = () => {
      ctx.fillStyle = '#2b2b2b'
      ctx.fillRect(0, 0, width, height)

      // Grid
      ctx.strokeStyle = 'rgba(118, 185, 0, 0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(width, i)
        ctx.stroke()
      }

      // Draw Driver A then B (B on top)
      drawWave(waveA, '#76B900', 'rgba(118,185,0,0.15)', 'rgba(118,185,0,0.07)')
      drawWave(waveB, '#00ff9c', 'rgba(0,255,156,0.15)', 'rgba(0,255,156,0.06)')

      time += 0.7
      animationFrame = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={260}
      className="w-full h-auto"
    />
  )
}
