import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { solveComposition } from './composition'

// A plate's background is near-black but not #000, so wherever the framing
// letterboxes (portrait phones, ultrawide desktops) the edge shows as a seam.
// Feathering it into the page black keeps the illusion of one continuous
// studio space instead of an image sitting in a box.
function featherLetterbox(ctx, vw, vh, dx, dy, dw, dh) {
  const band = (x0, y0, x1, y1, w, h) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, '#000')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h)
  }

  if (dh < vh - 1) {
    const f = Math.min(64, dh * 0.22)
    band(0, dy, 0, dy + f, vw, f)
    band(0, dy + dh, 0, dy + dh - f, vw, f)
  }
  if (dw < vw - 1) {
    const f = Math.min(64, dw * 0.22)
    band(dx, 0, dx + f, 0, f, vh)
    band(dx + dw, 0, dx + dw - f, 0, f, vh)
  }
}

/**
 * Drives a canvas from a frame sequence and a playhead.
 *
 * The playhead is a plain mutable object — never React state — so playback
 * never touches the render path. Drawing runs on GSAP's ticker and decides for
 * itself whether anything moved, which keeps the canvas correct through seeks
 * and restarts (both suppress tween callbacks by default).
 *
 * @param {object}  o
 * @param {object}  o.canvasRef    ref to the <canvas>
 * @param {object}  o.imagesRef    ref holding the loaded Image array
 * @param {object}  o.playhead     stable `{ value: 0..1 }` object
 * @param {number}  o.frameCount
 * @param {number}  o.playbackEnd  playhead value at which the last frame is reached
 * @param {string}  o.preset       composition preset — 'reveal' or 'immerse'
 * @param {boolean} o.active       gate — nothing runs until the frames are resident
 */
export function useFrameCanvas({
  canvasRef,
  imagesRef,
  playhead,
  frameCount,
  playbackEnd = 1,
  preset = 'reveal',
  active,
}) {
  useLayoutEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })

    let vw = 0
    let vh = 0
    let lastIndex = -1
    let lastProgress = -1

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      vw = canvas.clientWidth
      vh = canvas.clientHeight
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      // Setting canvas.width clears the surface, so the change-detection guard
      // below must be invalidated or the next tick would skip the redraw and
      // leave an empty canvas.
      lastIndex = -1
      lastProgress = -1
    }

    const render = () => {
      const progress = playhead.value
      const played = Math.min(1, progress / playbackEnd)
      const index = Math.min(frameCount - 1, Math.round(played * (frameCount - 1)))

      if (index === lastIndex && Math.abs(progress - lastProgress) < 0.0004) return
      lastIndex = index
      lastProgress = progress

      const img = imagesRef.current[index]
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, vw, vh)
      if (!img?.naturalWidth) return

      const { dx, dy, dw, dh } = solveComposition(
        vw,
        vh,
        img.naturalWidth,
        img.naturalHeight,
        progress,
        preset,
      )
      ctx.drawImage(img, dx, dy, dw, dh)
      featherLetterbox(ctx, vw, vh, dx, dy, dw, dh)
    }

    resize()
    window.addEventListener('resize', resize)
    gsap.ticker.add(render)

    return () => {
      gsap.ticker.remove(render)
      window.removeEventListener('resize', resize)
    }
  }, [active, frameCount, playbackEnd, preset, canvasRef, imagesRef, playhead])
}
