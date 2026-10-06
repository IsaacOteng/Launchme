import { BODY_TYPE, HEADLINE_TYPE, SLOT } from '../sequence/stageText'

/**
 * The narration slot, shared by every stage. Timings and motion live in
 * ../sequence/stageText.js — this only lays the lines out.
 *
 * @param {{text:string, at:number, hold?:number, lead?:boolean, rule?:boolean,
 *          index?:string, kicker?:string}[]} lines
 */
export default function StageLines({ lines }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className={SLOT}>
        {lines.map((line) => (
          <div
            key={line.text}
            data-line-block
            data-at={line.at}
            data-hold={line.hold ?? ''}
            className="absolute right-0 bottom-0 left-0"
            style={{ opacity: 0 }}
          >
            {line.kicker && (
              <div
                data-line-kicker
                className="mb-5 flex items-center gap-4"
                style={{ opacity: 0 }}
              >
                <span className="font-mono text-[10px] tracking-[0.24em] text-white/45">
                  {line.index}
                </span>
                <span className="h-px w-12 bg-white/25 sm:w-16" />
                <span className="text-[10px] tracking-[0.28em] text-white/45 uppercase">
                  {line.kicker}
                </span>
              </div>
            )}

            {/* A rule marks a conclusion rather than another passing caption. */}
            {line.rule && <span className="mb-4 block h-px w-12 bg-white/25 sm:w-16" />}

            {line.lead ? (
              <h2 className={HEADLINE_TYPE}>
                <span data-mask className="block overflow-hidden pb-[0.08em]">
                  <span className="block">{line.text}</span>
                </span>
              </h2>
            ) : (
              <p className={BODY_TYPE}>{line.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
