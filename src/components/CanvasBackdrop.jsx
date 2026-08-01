import { useEffect, useRef } from 'react'

// Lightweight animated dot-grid backdrop rendered on an HTML5 canvas.
// Respects device pixel ratio and resizes with the viewport.
export default function CanvasBackdrop() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frame
    let width
    let height
    let dpr

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const spacing = 36
    let t = 0

    const draw = () => {
      t += 0.006
      ctx.clearRect(0, 0, width, height)
      for (let x = 0; x < width + spacing; x += spacing) {
        for (let y = 0; y < height + spacing; y += spacing) {
          const wave =
            Math.sin(x * 0.01 + t * 4) + Math.cos(y * 0.01 + t * 4)
          const alpha = 0.04 + Math.max(0, wave) * 0.05
          ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`
          ctx.beginPath()
          ctx.arc(x, y, 1.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      frame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
