import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Black-on-black loading gate. The film only starts once every frame is
// resident, so the first scrub is never a slideshow.
export default function Preloader({ progress, ready }) {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const countRef = useRef(null)
  const shown = useRef({ value: 0 })

  useEffect(() => {
    // Tween the readout rather than snapping it — a counter that jumps reads
    // cheap, one that glides reads engineered.
    gsap.to(shown.current, {
      value: progress,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        const v = shown.current.value
        if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`
        if (countRef.current) {
          countRef.current.textContent = String(Math.round(v)).padStart(2, '0')
        }
      },
    })
  }, [progress])

  useEffect(() => {
    if (!ready) return
    const el = rootRef.current
    gsap.to(el, {
      opacity: 0,
      duration: 1.1,
      delay: 0.35,
      ease: 'power2.inOut',
      onComplete: () => el && (el.style.display = 'none'),
    })
  }, [ready])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
    >
      <p className="mb-8 text-[10px] tracking-[0.34em] text-white/40 uppercase sm:text-[11px]">
        Canon · R-Series
      </p>
      <div className="h-px w-40 overflow-hidden bg-white/12 sm:w-56">
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-white/70"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      <p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-white/35 tabular-nums">
        <span ref={countRef}>00</span>
      </p>
    </div>
  )
}
