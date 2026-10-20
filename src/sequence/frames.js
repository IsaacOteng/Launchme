// Frame sequences for the story stages.
//
// The frames live in src/assets so Vite fingerprints them and serves them with
// long-lived cache headers. `eager` keeps the manifest static (no dynamic
// chunks) — we only resolve URLs here, decoding happens in the loader.
// import.meta.glob needs a literal path, so each stage gets its own glob.
const cameraModules = import.meta.glob('../assets/cameraframes/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const captureModules = import.meta.glob('../assets/captureframes/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const replicationModules = import.meta.glob('../assets/replicationframe/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const frameNumber = (path) => Number(path.match(/(\d+)\.jpg$/)?.[1] ?? 0)

const ordered = (modules) =>
  Object.keys(modules)
    .sort((a, b) => frameNumber(a) - frameNumber(b))
    .map((key) => modules[key])

export const CAMERA_FRAMES = ordered(cameraModules)

// The capture sequence runs on past its own best composition: by frame ~245
// the lens has fully dissolved and the tail is nothing but a bare white plate
// on black, which reads as a placeholder rather than a photograph. Frame 240
// is where the plate has resolved but the coloured lens elements still ring
// it, so the frame still has depth and context. Trimming here also means the
// unused tail is never downloaded.
const CAPTURE_REST_FRAME = 240
export const CAPTURE_FRAMES = ordered(captureModules).slice(0, CAPTURE_REST_FRAME)

// Runs its full length: the archive is still resolving into a stable lattice
// through the final frames, and that lattice is what the scan stage acts on.
export const REPLICATION_FRAMES = ordered(replicationModules)

// The camera loop holds on its final frame for the last slice of playback so
// the exploded state resolves and rests. Capture plays clean to its last frame
// — the resting photograph is the handoff to the next stage.
export const CAMERA_PLAYBACK_END = 0.94
export const CAPTURE_PLAYBACK_END = 1

/**
 * Memory-aware frame list. A full-resolution frame decodes to ~3.7MB, so on
 * small/low-memory devices we halve each sequence rather than risk the decoder
 * cache thrashing mid-playback. Half the frames is still well above the
 * threshold where playback reads as continuous.
 */
export function selectFrames(all) {
  if (typeof window === 'undefined') return all

  const lowMemory = (navigator.deviceMemory ?? 8) < 4
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 480

  if (!lowMemory && !smallViewport) return all

  const strided = all.filter((_, i) => i % 2 === 0)
  // Always keep the true final frame — it is the resting composition, and for
  // capture it is the frame the next stage takes over from.
  const last = all[all.length - 1]
  if (strided[strided.length - 1] !== last) strided.push(last)
  return strided
}
