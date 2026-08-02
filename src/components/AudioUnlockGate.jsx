import { useEffect, useRef } from 'react'
import { VideoPlayerProvider, useVideoPlayer } from '../contexts/VideoPlayerContext'

function GateInner(props) {
  var player = useVideoPlayer()
  var triedRef = useRef(false)

  useEffect(function () {
    if (triedRef.current) return
    triedRef.current = true
    // El video del reproductor arranca silenciado, y eso los navegadores
    // siempre lo permiten sin necesidad de un toque real. Por eso ya no
    // hace falta pedirle a la persona que toque la pantalla: lo activamos
    // solos apenas carga.
    if (props.onUnlock) props.onUnlock()
    player.unlock()
  }, [])

  return (
    <>
      <div ref={player.containerRef} id="persistent-yt-player" className="fixed inset-0 z-0 bg-black" />
      <style>{`
        #persistent-yt-player iframe {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed;
          top: 0;
          left: 0;
        }
      `}</style>
      <div className="relative z-10">{props.children}</div>
    </>
  )
}

export default function AudioUnlockGate(props) {
  return (
    <VideoPlayerProvider>
      <GateInner onUnlock={props.onUnlock}>{props.children}</GateInner>
    </VideoPlayerProvider>
  )
}
