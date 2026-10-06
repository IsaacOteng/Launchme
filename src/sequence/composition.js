// Composition solver for the pinned canvases.
//
// Every sequence is a fixed 16:9 plate, but different stages need opposite
// framings, so the solver eases between a start and end scale chosen per
// stage rather than assuming one behaviour.

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const clamp01 = (v) => clamp(v, 0, 1)
const lerp = (a, b, t) => a + (b - a) * t

// Slow, symmetric ease — no overshoot, no bounce. Reads as a motorised dolly.
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// The scale change is held back until the subject actually needs the room, so
// the opening framing stays stable while the stage gets going.
const OPEN_FROM = 0.28
const OPEN_TO = 0.76

export const PRESETS = {
  /**
   * Opens out. A tight, dominant hero that widens as the subject needs room —
   * the exploded camera and the emerging photograph both have to end fully on
   * screen. Ends on `contain`; the plate is black-on-black so letterboxing is
   * invisible.
   */
  reveal: {
    scale: (contain, cover) => ({
      // Never overscan so hard that the subject leaves the frame, which is
      // what raw `cover` does on a phone.
      start: clamp(cover, contain * 1.15, contain * 2.2),
      end: contain,
    }),
    // Drifts from the camera body (right of plate centre when assembled) to
    // true centre as components fan out.
    focusX: (p) => lerp(0.53, 0.5, easeInOut(clamp01(p / 0.6))),
    // On portrait the opening composition sits high so copy has clear space
    // beneath the subject rather than behind it.
    portraitAnchor: (t) => lerp(0.42, 0.5, t),
  },

  /**
   * Draws in. A single object on black that becomes an environment you are
   * inside of. Ends on `cover` so the archive reaches every edge — letterboxing
   * an immersive space would break the illusion of being surrounded by it.
   */
  immerse: {
    scale: (contain, cover) => ({
      // Slightly inside `contain` so the lone opening plate is never clipped.
      start: contain * 1.02,
      end: Math.max(cover, contain),
    }),
    // The archive is a symmetric tunnel — any drift off centre reads as error.
    focusX: () => 0.5,
    portraitAnchor: () => 0.5,
  },
}

/**
 * @returns {{dx:number, dy:number, dw:number, dh:number}} drawImage rect in CSS px
 */
export function solveComposition(vw, vh, iw, ih, progress, presetName = 'reveal') {
  const preset = PRESETS[presetName] ?? PRESETS.reveal

  const contain = Math.min(vw / iw, vh / ih)
  const cover = Math.max(vw / iw, vh / ih)
  const { start, end } = preset.scale(contain, cover)

  const t = easeInOut(clamp01((progress - OPEN_FROM) / (OPEN_TO - OPEN_FROM)))
  const scale = lerp(start, end, t)

  const dw = iw * scale
  const dh = ih * scale

  const portrait = vw / vh < 0.9
  const anchorY = portrait ? preset.portraitAnchor(t) : 0.5

  return {
    dw,
    dh,
    dx: vw * 0.5 - dw * preset.focusX(progress),
    dy: vh * anchorY - dh * 0.5,
  }
}
