import { useEffect, useRef, useState } from 'react'

/**
 * Preloads the full frame sequence before the experience is allowed to start.
 *
 * Images are held in a ref — never in React state — so scrubbing never touches
 * the React render path. Progress is reported coarsely (whole percent) to keep
 * the loader itself cheap.
 */
export function useFrameLoader(urls, concurrency = 8) {
  const imagesRef = useRef([])
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const images = new Array(urls.length)
    imagesRef.current = images

    let loaded = 0
    let reported = -1
    let cursor = 0

    const bump = () => {
      loaded += 1
      const pct = Math.floor((loaded / urls.length) * 100)
      if (pct !== reported) {
        reported = pct
        setProgress(pct)
      }
    }

    const loadAt = (index) =>
      new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        // Resolve on error too: one missing frame should degrade the sequence,
        // not deadlock the whole experience behind the loader.
        img.onload = resolve
        img.onerror = resolve
        img.src = urls[index]
        images[index] = img
      })

    // Fixed-size worker pool. Sequential ordering matters: the first frames are
    // on screen first, so they should be decoded and cached first.
    const worker = async () => {
      while (!cancelled && cursor < urls.length) {
        const index = cursor++
        await loadAt(index)
        if (cancelled) return
        bump()
      }
    }

    Promise.all(
      Array.from({ length: Math.min(concurrency, urls.length) }, worker),
    ).then(() => {
      if (!cancelled) setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [urls, concurrency])

  return { imagesRef, progress, ready }
}
