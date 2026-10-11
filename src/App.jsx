import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CAMERA_FRAMES,
  CAPTURE_FRAMES,
  REPLICATION_FRAMES,
  selectFrames,
} from './sequence/frames'
import { useFrameLoader } from './sequence/useFrameLoader'
import CameraStage from './components/CameraStage'
import CaptureStage from './components/CaptureStage'
import ReplicationStage from './components/ReplicationStage'
import StoryStack from './components/StoryStack'
import Nav from './components/Nav'
import Preloader from './components/Preloader'

function App() {
  const cameraFrames = useMemo(() => selectFrames(CAMERA_FRAMES), [])
  const captureFrames = useMemo(() => selectFrames(CAPTURE_FRAMES), [])
  const replicationFrames = useMemo(() => selectFrames(REPLICATION_FRAMES), [])

  // Staged loading, in story order. The preloader gates on the opening
  // sequence alone — making it wait for every stage would put ~18MB in front
  // of the first frame. Each later stage streams in behind the one before it,
  // so bandwidth always goes to whatever the viewer reaches next.
  const camera = useFrameLoader(cameraFrames)
  const capture = useFrameLoader(captureFrames, { defer: !camera.ready })
  const replication = useFrameLoader(replicationFrames, { defer: !capture.ready })

  // Which stacked layers have been revealed. Latched, so scrolling back up
  // does not rewind a stage that has already told its part of the story.
  const [playing, setPlaying] = useState({})
  const handleReveal = useCallback((index) => {
    setPlaying((prev) => (prev[index] ? prev : { ...prev, [index]: true }))
  }, [])

  // Suppress the context menu over the artwork. This is a deterrent, not
  // protection — the frames are plain JPEGs at known URLs and sit in the
  // network tab and disk cache regardless. It only removes the one-click path.
  useEffect(() => {
    const block = (e) => {
      if (!e.target.closest('a, input, textarea, [data-allow-menu]')) {
        e.preventDefault()
      }
    }
    document.addEventListener('contextmenu', block)
    return () => document.removeEventListener('contextmenu', block)
  }, [])

  // Every stage after the opening lives in one sticky viewport, each wiping
  // over the last rather than scrolling in from underneath.
  const layers = useMemo(
    () => [
      {
        key: 'capture',
        render: (shouldPlay) => (
          <CaptureStage
            imagesRef={capture.imagesRef}
            frameCount={captureFrames.length}
            ready={capture.ready}
            shouldPlay={shouldPlay}
          />
        ),
      },
      {
        key: 'replication',
        render: (shouldPlay) => (
          <ReplicationStage
            imagesRef={replication.imagesRef}
            frameCount={replicationFrames.length}
            ready={replication.ready}
            shouldPlay={shouldPlay}
          />
        ),
      },
    ],
    // `useFrameLoader` returns a fresh object each render, so the loaders
    // themselves are not valid deps — the refs are stable and `ready` is a
    // boolean, which is all that actually affects what gets rendered.
    [
      capture.imagesRef,
      capture.ready,
      captureFrames.length,
      replication.imagesRef,
      replication.ready,
      replicationFrames.length,
    ],
  )

  return (
    <>
      <Preloader progress={camera.progress} ready={camera.ready} />

      {/* Fixed above every stage — the story changes underneath it. */}
      <Nav show={camera.ready} />

      <CameraStage
        imagesRef={camera.imagesRef}
        frameCount={cameraFrames.length}
        active={camera.ready}
      />

      <StoryStack layers={layers} playing={playing} onReveal={handleReveal} />
    </>
  )
}

export default App
