// Shared by the opening headline and the closing statement so the two are
// typographically identical — they bookend the film and should read as the
// same voice.
const HEADLINE_TYPE =
  'text-[2.15rem] leading-[1.02] font-medium tracking-[-0.045em] text-white sm:text-[2rem] lg:text-[3.4rem] max-w-[30rem]'

// Narration takes turns in a single slot, in seconds from the start of a loop
// cycle. `at` is the entry point, `hold` how long the line rests at full
// opacity before it leaves.
//
// Each line is on screen for seven seconds or more including its fades — long
// enough to be read without hurry. Timings are set so one line has fully left
// before the next arrives; the slot is only ever occupied by one line, and the
// 11s reassembly is left silent so the camera carries it alone.
// The opening headline holds first (it clears at 3.0s, see CameraStage), so
// these two pick up from there — the three statements split the cycle's text
// time roughly evenly rather than the headline getting only a moment.
const NARRATION = [
  // Enters once the title is clear and carries the disassembly.
  { text: 'Now, look closer.', at: 4.4, hold: 5.2 },
  // Lands as the camera finishes opening and rests through the pause. Set at
  // headline scale — it is the closing statement, not a passing caption.
  {
    text: 'Every component,  where it belongs.',
    at: 11.4,
    hold: 7.2,
    rule: true,
    lead: true,
  },
]

// The mask offset is deliberately NOT set inline here. GSAP reads an existing
// inline `translateY(115%)` back via getComputedStyle as a resolved pixel
// value and treats it as the element's base transform, then animates its own
// yPercent on top — leaving the line permanently pushed down. The timeline's
// fromTo owns the property outright, and immediateRender applies the hidden
// state before first paint.
const HeadlineLine = ({ children }) => (
  <span data-line className="block overflow-hidden pb-[0.08em]">
    <span className="block">{children}</span>
  </span>
)

export default function Narration() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* ── Left: the statement ───────────────────────────────────────── */}
      <div
        data-hero
        className="absolute right-6 bottom-24 left-6 sm:right-auto sm:bottom-28 sm:left-10 sm:w-[32rem] lg:left-16 lg:w-[40rem]"
      >
        <div data-kicker className="mb-5 flex items-center gap-4" style={{ opacity: 0 }}>
          <span className="font-mono text-[10px] tracking-[0.24em] text-white/45">01</span>
          <span className="h-px w-12 bg-white/25 sm:w-16" />
          <span className="text-[10px] tracking-[0.28em] text-white/45 uppercase">
            The beginning
          </span>
        </div>

        <h1 className={HEADLINE_TYPE}>
          <HeadlineLine>Every moment</HeadlineLine>
          <HeadlineLine>starts here.</HeadlineLine>
        </h1>
      </div>

      {/* ── Right: counterweight. The headline alone in one corner leaves the
             frame lopsided; this gives the composition its second anchor. ── */}
      <div
        data-meta
        className="absolute right-10 bottom-28 hidden w-[15rem] text-right lg:right-16 lg:block"
        style={{ opacity: 0 }}
      >
        <p className="mb-3 font-mono text-[10px] tracking-[0.24em] text-white/40 uppercase">
          Stage 01 — Exploded view
        </p>
        <span className="mb-4 ml-auto block h-px w-10 bg-white/20" />
        <p className="text-[13px] leading-relaxed text-white/55">
          A complete disassembly of the EOS R5 body and RF lens, in one
          continuous take.
        </p>
      </div>

      {/* ── Narration, occupying the same optical slot as the headline.
              Wider than the headline block so the closing line still breaks
             over two lines at headline scale. ─────────────────────────── */}
      <div className="absolute right-6 bottom-24 left-6 sm:right-auto sm:bottom-28 sm:left-10 sm:w-[38rem] lg:left-16 lg:w-[52rem]">
        {NARRATION.map((line) => (
          <div
            key={line.text}
            data-caption
            data-at={line.at}
            data-hold={line.hold}
            className="absolute right-0 bottom-0 left-0"
            style={{ opacity: 0 }}
          >
            {/* The closing line earns a rule; it reads as a conclusion
                rather than another passing caption. */}
            {line.rule && <span className="mb-4 block h-px w-12 bg-white/25 sm:w-16" />}
            <p
              className={
                line.lead
                  ? HEADLINE_TYPE
                  : 'text-xl leading-tight font-light tracking-[-0.015em] text-white/85 sm:text-2xl lg:text-[1.9rem]'
              }
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
