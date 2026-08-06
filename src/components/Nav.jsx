const LINKS = ['Camera', 'Technology', 'Explore']

// A framed editorial header rather than a bar: a full-bleed hairline provides
// the structure, so the type itself can stay weightless and uncontained.
export default function Nav() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

      <div
        data-chrome
        className="relative flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6"
        style={{ opacity: 0 }}
      >
        {/* Lockup — weighted wordmark, hairline divider, quiet descriptor */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[13px] font-medium tracking-[0.2em] text-white sm:text-sm">
            CANON
          </span>
          <span className="h-3 w-px bg-white/25" />
          <span className="text-[10px] tracking-[0.28em] text-white/50 sm:text-[11px]">
            R-SERIES
          </span>
        </div>

        {/* Centre mark — the subject, stated once. Only shown from lg up:
            below that it crowds the link cluster. */}
        <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-white/40 lg:block">
          EOS R5
        </span>

        <nav className="pointer-events-auto flex items-center gap-5 sm:gap-8">
          {LINKS.map((link, i) => (
            <a
              key={link}
              href="#"
              onClick={(e) => e.preventDefault()}
              // Below sm there is only room for the lockup and one link
              // without the two colliding.
              className={`group relative text-[10px] tracking-[0.24em] text-white/55 uppercase transition-colors duration-500 hover:text-white sm:text-[11px] ${
                i < LINKS.length - 1 ? 'hidden sm:block' : ''
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
