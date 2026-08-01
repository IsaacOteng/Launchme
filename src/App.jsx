import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CanvasBackdrop from './components/CanvasBackdrop'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const heroRef = useRef(null)
  const sectionRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-anim', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
      })

      gsap.from('.reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} className="relative min-h-svh w-full">
      <CanvasBackdrop />

      <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="hero-anim mb-4 text-sm tracking-[0.3em] text-purple-300 uppercase">
          Launchme
        </p>
        <h1 className="hero-anim text-4xl font-medium tracking-tight text-white sm:text-6xl">
          Environment ready.
        </h1>
        <p className="hero-anim mt-4 max-w-xl text-base text-gray-400 sm:text-lg">
          React + Vite, Tailwind CSS, GSAP with ScrollTrigger, and an HTML5
          canvas backdrop — all wired up and mobile-first.
        </p>
      </main>

      <section
        ref={sectionRef}
        className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-6 py-24 sm:grid-cols-3"
      >
        {['React + Vite', 'GSAP ScrollTrigger', 'Tailwind CSS'].map(
          (label) => (
            <div
              key={label}
              className="reveal rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur"
            >
              <h2 className="text-lg font-medium text-white">{label}</h2>
              <p className="mt-2 text-sm text-gray-400">
                Scroll to see this card animate in.
              </p>
            </div>
          ),
        )}
      </section>
    </div>
  )
}

export default App
