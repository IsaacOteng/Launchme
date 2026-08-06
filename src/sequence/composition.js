// Composition solver for the pinned canvas.
//
// The sequence is a fixed 16:9 plate, but the story needs two different framings:
// a tight, dominant hero at the start, and a wide, fully-legible exploded view
// at the end. Rather than shrinking a desktop layout, we solve the framing per
// viewport aspect and ease between the two as the scroll progresses.

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const clamp01 = (v) => clamp(v, 0, 1)
const lerp = (a, b, t) => a + (b - a) * t

// Slow, symmetric ease — no overshoot, no bounce. Reads as a motorised dolly.
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

// The scale change is held back until the camera actually needs the room, so
// the opening framing stays stable while the product rotates.
const OPEN_FROM = 0.28
const OPEN_TO = 0.76

/**
 * @returns {{dx:number, dy:number, dw:number, dh:number}} drawImage rect in CSS px
 */
export function solveComposition(vw, vh, iw, ih, progress) {
  const contain = Math.min(vw / iw, vh / ih)
  const cover = Math.max(vw / iw, vh / ih)

  // Opening framing: fill the viewport, but never overscan so hard that the
  // body leaves the frame (which is what raw `cover` does on a phone).
  const startScale = clamp(cover, contain * 1.15, contain * 2.2)
  // Closing framing: every separated component must be on screen. The plate is
  // black-on-black, so letterboxing is invisible.
  const endScale = contain

  const t = easeInOut(clamp01((progress - OPEN_FROM) / (OPEN_TO - OPEN_FROM)))
  const scale = lerp(startScale, endScale, t)

  const dw = iw * scale
  const dh = ih * scale

  // Focal point drifts from the camera body (sitting right of plate centre in
  // the assembled shots) to true centre as the components fan out.
  const focusX = lerp(0.53, 0.5, easeInOut(clamp01(progress / 0.6)))
  const focusY = 0.5

  // On a portrait viewport the opening composition is anchored high so the
  // headline sits in clear space beneath the camera instead of over it.
  const portrait = vw / vh < 0.9
  const anchorY = portrait ? lerp(0.42, 0.5, t) : 0.5

  return {
    dw,
    dh,
    dx: vw * 0.5 - dw * focusX,
    dy: vh * anchorY - dh * focusY,
  }
}
