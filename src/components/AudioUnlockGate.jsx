import { VideoPlayerProvider, useVideoPlayer } from '../contexts/VideoPlayerContext'

function GateInner(props) {
  var player = useVideoPlayer()

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

      {!player.unlocked ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8">
          <button
            onClick={player.unlock}
            className="flex flex-col items-center gap-4 rounded-3xl border-2 px-12 py-10"
            style={{ borderColor: '#F4D03F', background: 'rgba(139, 92, 246, 0.08)' }}
          >
            <span className="text-6xl">🔊</span>
            <span className="text-xl md:text-2xl font-extrabold text-white text-center">
              Toca para activar el sonido
            </span>
            <span className="text-sm text-neutral-400 text-center max-w-xs">
              Solo se hace una vez al preparar la pantalla. Despues, cada cancion se reproducira sola.
            </span>
          </button>
        </div>
      ) : (
        <div className="relative z-10">{props.children}</div>
      )}
    </>
  )
}

export default function AudioUnlockGate(props) {
  return (
    <VideoPlayerProvider>
      <GateInner>{props.children}</GateInner>
    </VideoPlayerProvider>
  )
}
