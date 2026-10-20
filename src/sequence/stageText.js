import gsap from 'gsap'

// One definition of the narration voice, shared by every stage so the type
// scale and rhythm stay identical as the story moves from page to page.

// Bookend statements — the opening headline and each stage's closing line.
export const HEADLINE_TYPE =
  'text-[2.15rem] leading-[1.02] font-medium tracking-[-0.045em] text-white sm:text-[2rem] lg:text-[3.4rem] max-w-[30rem]'

export const BODY_TYPE =
  'text-xl leading-tight font-light tracking-[-0.015em] text-white/85 sm:text-2xl lg:text-[1.9rem]'

// The lower-left slot, held constant across stages.
export const SLOT =
  'absolute right-6 bottom-24 left-6 sm:right-auto sm:bottom-28 sm:left-10 sm:w-[38rem] lg:left-16 lg:w-[52rem]'

/**
 * Registers the enter/leave tweens for every line in a stage.
 *
 * A line with no `hold` never leaves — that is the stage's resting statement.
 * Lead lines reveal from behind their own mask; body lines drift. Both are
 * slow enough to read, and timings are set so one line is fully gone before
 * the next arrives.
 */
export function addStageLines(tl) {
  gsap.utils.toArray('[data-line-block]').forEach((el) => {
    const at = Number(el.dataset.at)
    const hold = el.dataset.hold === '' ? null : Number(el.dataset.hold)
    const mask = el.querySelector('[data-mask] > span')

    if (mask) {
      // The block itself only needs to become visible; the mask carries the
      // motion. Opacity is set instantly so the reveal is not double-faded.
      tl.set(el, { opacity: 1 }, at)
      tl.fromTo(
        mask,
        { yPercent: 115 },
        { yPercent: 0, duration: 1.2, ease: 'power3.out' },
        at,
      )
      const kicker = el.querySelector('[data-line-kicker]')
      if (kicker) {
        tl.fromTo(kicker, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 1 }, at - 0.2)
      }
    } else {
      tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, at)
    }

    if (hold !== null) {
      tl.to(el, { opacity: 0, y: -10, duration: 1, ease: 'power2.inOut' }, at + hold)
    }
  })
}
