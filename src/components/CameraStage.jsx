import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { PLAYBACK_END } from '../sequence/frames'
import { solveComposition } from '../sequence/composition'
import Narration from './Narration'
import Nav from './Nav'

// The film plays itself, forever. 240 frames across PLAY seconds lands at
// ~22fps — slow enough to feel deliberate, fast enough that it never reads as
// a slideshow.
//
// One cycle: assemble → explode → rest → reassemble → rest → repeat. HOLD is
// the pause at each extreme, where the composition is allowed to just be a
// photograph. INTRO runs once before the loop so the title lands over a still
// camera rather than one already coming apart.
const INTRO = 2.4
const PLAY = 11
const HOLD = 10

// Cycle landmarks, in seconds from the start of a loop.
const REVERSE_AT = PLAY + HOLD // 21 — starts coming back together
const ASSEMBLED_AT = PLAY * 2 + HOLD // 32 — whole again
const CYCLE = (PLAY + HOLD) * 2 // 42

// The plate's background is near-black but not #000, so wherever the framing
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

export default function CameraStage({ imagesRef, frameCount, active }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const timelineRef = useRef(null)

  useLayoutEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })

    // Single source of truth for playback. Never enters React state.
    const playhead = { value: 0 }

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

    // Runs every tick and decides for itself whether anything moved. Deriving
    // this from the playhead rather than from a tween callback keeps the canvas
    // correct through seeks and restarts, which suppress callbacks by default.
    const render = () => {
      const progress = playhead.value
      const played = Math.min(1, progress / PLAYBACK_END)
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
      )
      ctx.drawImage(img, dx, dy, dw, dh)
      featherLetterbox(ctx, vw, vh, dx, dy, dw, dh)
    }

    resize()
    window.addEventListener('resize', resize)
    gsap.ticker.add(render)

    const ctxGsap = gsap.context(() => {
      // ── The cycle, repeating forever ──────────────────────────────────
      const loop = gsap.timeline({ repeat: -1, paused: true })

      // The film, then back again. Constant rate both ways: the footage
      // carries its own pacing, and easing it would drop the effective frame
      // rate into judder.
      loop.to(playhead, { value: 1, duration: PLAY, ease: 'none' }, 0)
      loop.to(playhead, { value: 0, duration: PLAY, ease: 'none' }, REVERSE_AT)
      loop.to({}, { duration: CYCLE }, 0) // pin the cycle length

      // Headline holds through the rotation and clears just as the camera
      // begins to come apart (~progress 0.27), then returns once it is whole
      // again. Plain `.to` rather than `fromTo`: the intro leaves it visible,
      // and a fromTo would blank it the moment the loop is built.
      loop.to('[data-hero]', { opacity: 0, y: -22, duration: 0.9, ease: 'power2.in' }, 3.0)
      loop.to('[data-hero]', { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' }, ASSEMBLED_AT + 0.5)

      // Narration lines take turns in one slot, each drifting in and out
      // slowly enough to be read. Timings live in Narration.jsx; the fades are
      // long and the travel short, so nothing snaps.
      gsap.utils.toArray('[data-caption]').forEach((el) => {
        const at = Number(el.dataset.at)
        loop.fromTo(
          el,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
          at,
        )
        loop.to(el, { opacity: 0, y: -10, duration: 1, ease: 'power2.inOut' }, at + Number(el.dataset.hold))
      })

      // ── Opening titles, once ──────────────────────────────────────────
      const intro = gsap.timeline({ onComplete: () => loop.play() })

      // Frame draws in: hairlines first, then content. Structure before copy.
      intro.fromTo('[data-rule]', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0.1)
      intro.fromTo('[data-chrome]', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.5)
      intro.fromTo('[data-kicker]', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 1 }, 0.6)
      intro.fromTo(
        '[data-line] > span',
        { yPercent: 115 },
        { yPercent: 0, duration: 1.15, stagger: 0.12, ease: 'power3.out' },
        0.75,
      )
      intro.fromTo('[data-meta]', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1)
      intro.to({}, { duration: INTRO }, 0) // hold the still frame while titles land

      timelineRef.current = loop

      // Dev-only handles so the film can be seeked frame-accurately when
      // checking composition, instead of racing a wall clock.
      if (import.meta.env.DEV) {
        window.__film = loop
        window.__intro = intro
      }
    }, rootRef)

    return () => {
      ctxGsap.revert()
      timelineRef.current = null
      gsap.ticker.remove(render)
      window.removeEventListener('resize', resize)
    }
  }, [active, frameCount, imagesRef])

  return (
    <div ref={rootRef} className="relative h-svh w-full overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-label="Canon EOS R5 disassembling into an exploded view"
        role="img"
      />

      {/* Optical treatment: keeps the plate seated in the page instead of
          looking like an image pasted onto it. The lower scrim grounds the
          narration against the reflection in the plate. */}
      <div className="stage-vignette pointer-events-none absolute inset-0" />
      <div className="stage-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

      <Nav />
      <Narration />
    </div>
  )
}
