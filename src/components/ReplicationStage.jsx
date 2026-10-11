import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useFrameCanvas } from '../sequence/useFrameCanvas'
import StageLines from './StageLines'
import { addStageLines } from '../sequence/stageText'

// 300 frames at ~24fps. Plays once on arrival and rests inside the archive —
// that lattice is what the scan stage acts on next.
const PLAY = 7

// One photograph becomes an event's worth. The closing line is the problem
// SnapSeek exists to solve, stated plainly while the viewer is surrounded by
// the scale of it.
const LINES = [
  { text: 'One event.', at: 1.2, hold: 4.2 },
  { text: 'Thousands of moments.', at: 6.8, hold: 4.2 },
  {
    // Lands once the archive has come to rest, and stays — it is the problem
    // the rest of the story answers.
    text: 'Now try finding yourself.',
    at: 12.4,
    lead: true,
    rule: true,
    index: '03',
    kicker: 'The archive',
  },
]

export default function ReplicationStage({ imagesRef, frameCount, ready, shouldPlay }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const playhead = useRef({ value: 0 }).current
  const timelineRef = useRef(null)

  useFrameCanvas({
    canvasRef,
    imagesRef,
    playhead,
    frameCount,
    // The archive has to reach every edge — see PRESETS.immerse.
    preset: 'immerse',
    active: ready,
  })

  useLayoutEffect(() => {
    if (!ready) return

    const ctxGsap = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      timelineRef.current = tl

      tl.to(playhead, { value: 1, duration: PLAY, ease: 'none' }, 0)
      addStageLines(tl)

      if (import.meta.env.DEV) window.__replication = tl
    }, rootRef)

    return () => {
      ctxGsap.revert()
      timelineRef.current = null
    }
  }, [ready, playhead])

  // The stack decides when this layer has finished wiping over the last one.
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
        aria-label="A single photograph multiplying into an archive of thousands"
        role="img"
      />

      <div className="stage-vignette pointer-events-none absolute inset-0" />
      <div className="stage-grain pointer-events-none absolute inset-0" />

      {/* Unlike the earlier stages this plate is bright and fills the frame,
          so the copy needs its own ground. Two crossed scrims darken the
          lower-left corner where the narration sits without dulling the
          archive itself. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-black/55 to-transparent" />

      <StageLines lines={LINES} />
    </div>
  )
}
