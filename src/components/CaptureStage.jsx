import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useFrameCanvas } from '../sequence/useFrameCanvas'
import StageLines from './StageLines'
import { addStageLines } from '../sequence/stageText'

// 240 frames across PLAY seconds lands at ~24fps — the rate the sequence was
// rendered at, so the flash reads as a flash rather than a stutter.
//
// Unlike the opening hero this does not loop. It plays once and rests on the
// photograph, because that resting plate is the object the next stage takes
// over: the archive multiplies out of it.
const PLAY = 7

// "One moment." rides the push into the glass and clears before the aperture
// snaps, so the flash lands on an empty frame. "Captured." arrives with the
// photograph and stays — no `hold` means it never leaves.
const LINES = [
  { text: 'One moment.', at: 1.2, hold: 4.2 },
  {
    text: 'Captured.',
    at: 9.3,
    lead: true,
    index: '02',
    kicker: 'The capture',
  },
]

export default function CaptureStage({ imagesRef, frameCount, ready, shouldPlay }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const playhead = useRef({ value: 0 }).current
  const timelineRef = useRef(null)

  useFrameCanvas({
    canvasRef,
    imagesRef,
    playhead,
    frameCount,
    active: ready,
  })

  useLayoutEffect(() => {
    if (!ready) return

    const ctxGsap = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      timelineRef.current = tl

      tl.to(playhead, { value: 1, duration: PLAY, ease: 'none' }, 0)
      addStageLines(tl)

      if (import.meta.env.DEV) window.__capture = tl
    }, rootRef)

    return () => {
      ctxGsap.revert()
      timelineRef.current = null
    }
  }, [ready, playhead])

  // The stack decides when this layer is on screen — playing on scroll
  // position here would start the film behind a half-open wipe.
  useLayoutEffect(() => {
    if (ready && shouldPlay) timelineRef.current?.play()
  }, [ready, shouldPlay])

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        // pointer-events-none takes the canvas out of hit-testing, so the
        // browser's context menu never offers "Save image as…" / "Copy image".
        className="pointer-events-none absolute inset-0 block h-full w-full select-none"
        draggable={false}
        aria-label="A camera lens closing its aperture, firing, and releasing a single photograph"
        role="img"
      />

      <div className="stage-vignette pointer-events-none absolute inset-0" />
      <div className="stage-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />

      <StageLines lines={LINES} />
    </div>
  )
}
