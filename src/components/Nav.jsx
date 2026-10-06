import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

const LINKS = ['How it works', 'Find Photos']

// A framed editorial header rather than a bar: a full-bleed hairline provides the structure, so the type itself can stay weightless and uncontained.
// Fixed, not absolute, it belongs to the whole story, not to the first stage, and it animates itself in rather than borrowing the hero's timeline.

export default function Nav({ show }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (!show) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo('[data-rule]', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0.1)
      tl.fromTo('[data-chrome]', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.5)
    }, rootRef)
    return () => ctx.revert()
  }, [show])

  return (
    <header
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 top-0 z-40"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

      <div
        data-chrome
        className="relative flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[13px] font-medium tracking-[0.2em] text-white sm:text-sm">
            SNAPSEEK
          </span>
          <span className="h-3 w-px bg-white/25" />
          <span className="text-[10px] tracking-[0.28em] text-white/50 sm:text-[11px]">
            EVENT PHOTOS
          </span>
        </div>

        {/* Centre mark is what the product does, stated once */}

        <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-white/40 lg:block">
          FIND YOURSELF
        </span>

        <nav className="pointer-events-auto flex items-center gap-5 sm:gap-8">
          {LINKS.map((link, i) => (
            <a
              key={link}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`group relative text-[10px] tracking-[0.24em] uppercase transition-colors duration-500 hover:text-white sm:text-[11px] ${
                i === LINKS.length - 1 ? 'text-white' : 'hidden text-white/55 sm:block'
              }`}
            >
              {link}
              {/* Underline wipes in from the left on hover */}
              <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-500 ease-out group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
      </div>

      <div
        data-rule
        className="h-px w-full origin-left bg-white/12"
        style={{ transform: 'scaleX(0)' }}
      />
    </header>
  )
}
