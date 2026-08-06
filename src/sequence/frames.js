// Canon EOS R5 product film — frame sequence source.
//
// The frames live in src/assets so Vite fingerprints them and serves them with
// long-lived cache headers. `eager` keeps the manifest static (no dynamic
// chunks) — we only resolve URLs here, decoding happens in the loader.
const modules = import.meta.glob('../assets/cameraframes/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const frameNumber = (path) => Number(path.match(/(\d+)\.jpg$/)?.[1] ?? 0)

const ALL_FRAMES = Object.keys(modules)
  .sort((a, b) => frameNumber(a) - frameNumber(b))
  .map((key) => modules[key])

// Narrative beats, expressed as normalised positions in the source sequence.
// Derived from the footage itself rather than invented: the camera holds and
// rotates, light sweeps the body, then it comes apart.
export const BEATS = {
  hero: [0.0, 0.2],
  light: [0.2, 0.31],
  disassembly: [0.31, 0.45],
  separation: [0.45, 0.79],
  exploded: [0.79, 1.0],
}

// The last slice of playback holds on the final frame so the exploded state
// resolves and rests instead of ending the instant it arrives.
export const PLAYBACK_END = 0.94

/**
 * Memory-aware frame list. A full-resolution frame decodes to ~3.7MB, so on
 * small/low-memory devices we halve the sequence rather than risk the decoder
 * cache thrashing mid-scrub. 120 frames is still well above the threshold
 * where scrubbing reads as continuous.
 */
export function selectFrames() {
  if (typeof window === 'undefined') return ALL_FRAMES

  const lowMemory = (navigator.deviceMemory ?? 8) < 4
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 480

  if (!lowMemory && !smallViewport) return ALL_FRAMES

  const strided = ALL_FRAMES.filter((_, i) => i % 2 === 0)
  // Always keep the true final frame — it is the resting composition.
  const last = ALL_FRAMES[ALL_FRAMES.length - 1]
  if (strided[strided.length - 1] !== last) strided.push(last)
  return strided
}

export const FRAME_ASPECT = 1280 / 720
