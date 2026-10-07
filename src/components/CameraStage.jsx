import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { CAMERA_PLAYBACK_END } from '../sequence/frames'
import { useFrameCanvas } from '../sequence/useFrameCanvas'
import Narration from './Narration'

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

export default function CameraStage({ imagesRef, frameCount, active }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const timelineRef = useRef(null)
  const cleanupRef = useRef(null)

  // Single source of truth for playback, it never enters React state
  const playhead = useRef({ value: 0 }).current

  useFrameCanvas({
    canvasRef,
    imagesRef,
    playhead,
    frameCount,
    playbackEnd: CAMERA_PLAYBACK_END,
    active,
  })

  useLayoutEffect(() => {
    if (!active) return

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

      // Structure before copy. The nav draws itself in — it is fixed and
      // belongs to the whole story, not to this stage.
      intro.fromTo('[data-kicker]', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 1 }, 0.6)
      intro.fromTo(
        '[data-line] > span',
        { yPercent: 115 },
        { yPercent: 0, duration: 1.15, stagger: 0.12, ease: 'power3.out' },
        0.75,
      )
      intro.fromTo('[data-meta]', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1)
      intro.fromTo('[data-scroll-cue]', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.6)
      intro.to({}, { duration: INTRO }, 0) // hold the still frame while titles land

      // The cue has done its job the moment the viewer scrolls; leaving it up
      // would nag. Fades on any downward movement, and comes back at the top.
      const cue = rootRef.current.querySelector('[data-scroll-cue]')
      const onScroll = () =>
        gsap.to(cue, {
          opacity: window.scrollY > 40 ? 0 : 1,
          duration: 0.4,
          overwrite: true,
        })
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanupRef.current = () => window.removeEventListener('scroll', onScroll)

      timelineRef.current = loop

      // Dev-only handles so the film can be seeked frame-accurately when
      // checking composition, instead of racing a wall clock.
      if (import.meta.env.DEV) {
        window.__film = loop
        window.__intro = intro
      }
    }, rootRef)

    return () => {
      cleanupRef.current?.()
      ctxGsap.revert()
      timelineRef.current = null
    }
  }, [active, playhead])

  return (
    <section
      ref={rootRef}
      className="relative h-svh w-full snap-start overflow-hidden bg-black"
    >
      <canvas
        ref={canvasRef}
        // pointer-events-none takes the canvas out of hit-testing, so the
        // browser's context menu never offers "Save image as…" / "Copy image".
        className="pointer-events-none absolute inset-0 block h-full w-full select-none"
        draggable={false}
        aria-label="Canon EOS R5 disassembling into an exploded view"
        role="img"
      />

      {/* Optical treatment: keeps the plate seated in the page instead of
          looking like an image pasted onto it. The lower scrim grounds the
          narration against the reflection in the plate. */}
      <div className="stage-vignette pointer-events-none absolute inset-0" />
      <div className="stage-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

      <Narration />

      {/* There is a page below now, so it has to be said. Sits bottom-centre,
          clear of the narration on the left and the meta block on the right. */}
      <div
        data-scroll-cue
        className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center gap-3 sm:bottom-9"
        style={{ opacity: 0 }}
      >
        <span className="text-[9px] tracking-[0.34em] text-white/45 uppercase sm:text-[10px]">
          Scroll
        </span>
        <span className="cue-line h-9 w-px bg-gradient-to-b from-white/50 to-transparent" />
      </div>
    </section>
  )
}


