import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Scroll runway, in viewports.
const LEAD = 1.0 // the first layer alone before anything covers it
const REVEAL = 1.0 // scroll distance for each layer to wipe over the last
const TRAIL = 0.6 // rest on the final layer

/**
 * A single sticky viewport holding every stage as a stacked layer.
 *
 * Scrolling does not move to a page underneath — the viewport stays put and
 * each successive layer is unveiled *over* the one before it, so the story
 * changes without the scene ever leaving. Adding a stage means adding one
 * entry to `layers`.
 *
 * Each layer is told when it has been fully revealed so its own film starts
 * from frame one with the layer already covering the screen, rather than
 * playing behind a half-open wipe.
 *
 * @param {{key:string, render:(shouldPlay:boolean)=>React.ReactNode}[]} layers
 */
export default function StoryStack({ layers, playing, onReveal }) {
  const stackRef = useRef(null)
  const layerRefs = useRef([])

  const layerCount = layers.length
  const height = 1 + LEAD + (layerCount - 1) * REVEAL + TRAIL

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const vh = () => window.innerHeight

      // The base layer starts as soon as the stack is reached.
      ScrollTrigger.create({
        trigger: stackRef.current,
        start: 'top 60%',
        once: true,
        onEnter: () => onReveal(0),
      })

      for (let index = 1; index < layerCount; index++) {
        const el = layerRefs.current[index]
        if (!el) continue

        const from = LEAD + (index - 1) * REVEAL
        const to = from + REVEAL
        let latched = false

        ScrollTrigger.create({
          trigger: stackRef.current,
          start: () => `top top-=${vh() * from}`,
          end: () => `top top-=${vh() * to}`,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Wipe upward: the layer is uncovered from the bottom edge.
            gsap.set(el, {
              clipPath: `inset(${(1 - self.progress) * 100}% 0% 0% 0%)`,
            })
            if (!latched && self.progress > 0.985) {
              latched = true
              onReveal(index)
            }
          },
        })
      }

      ScrollTrigger.refresh()
    }, stackRef)

    return () => ctx.revert()
    // Only the number of layers changes the scroll wiring. Depending on the
    // `layers` array itself would tear down and rebuild every ScrollTrigger on
    // each render, resetting the reveal latches mid-scroll.
  }, [layerCount, onReveal])

  return (
    <div
      ref={stackRef}
      className="relative w-full snap-start"
      style={{ height: `${height * 100}svh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-black">
        {layers.map((layer, i) => (
          <div
            key={layer.key}
            ref={(el) => {
              layerRefs.current[i] = el
            }}
            className="absolute inset-0"
            style={{
              zIndex: 10 + i,
              // Layers above the base start fully clipped away.
              clipPath: i === 0 ? undefined : 'inset(100% 0% 0% 0%)',
            }}
          >
            {layer.render(!!playing[i])}
          </div>
        ))}
      </div>
    </div>
  )
}
