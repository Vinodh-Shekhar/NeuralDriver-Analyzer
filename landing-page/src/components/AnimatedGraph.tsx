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

    const generateWaveform = (x: number, offset: number) => {
      const frequency = 0.02
      const amplitude = height * 0.25
      const baseline = height / 2
      return baseline - Math.sin((x + offset) * frequency) * amplitude - Math.cos((x + offset) * frequency * 0.5) * amplitude * 0.3
    }

    const animate = () => {
      ctx.fillStyle = '#0b0f14'
      ctx.fillRect(0, 0, width, height)

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < width; i += 40) {
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

      // Main waveform
      ctx.strokeStyle = '#00ff41'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = generateWaveform(x, time)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Shadow/glow effect
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)'
      ctx.lineWidth = 8
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = generateWaveform(x, time)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Fill under curve
      ctx.fillStyle = 'rgba(0, 255, 65, 0.1)'
      ctx.beginPath()
      for (let x = 0; x < width; x++) {
        const y = generateWaveform(x, time)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.fill()

      time += 1
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={300}
      className="w-full h-auto"
    />
  )
}
