import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'

export default function DisplayCalled() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger

  if (!currentSinger) return null

  // El nombre del artista original se detecta solo (iTunes) apenas se llama
  // al cantante — ver KaraokeSessionContext.callSinger. Mientras llega, la
  // pantalla no debe quedar mostrando un placeholder roto: se muestra solo
  // la canción hasta que el dato esté listo, y se actualiza solo (realtime)
  // cuando se resuelve.
  var artistName = currentSinger.artistName || ''
  var songLine = artistName ? currentSinger.song + ' — ' + artistName : currentSinger.song

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 bg-black">
      <RetroEqualizer />
      <FloatingDecor />

      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center called-in">
        <div
          className="px-7 py-2 rounded-full flex items-center gap-2 called-pulse mb-9"
          style={{
            background: 'rgba(10,6,15,0.72)',
            border: '1.5px solid rgba(244,208,63,0.55)',
            boxShadow: '0 0 24px 2px rgba(244,208,63,0.35)'
          }}
        >
          <span className="text-lg">🎤</span>
          <p
            className="text-base md:text-xl tracking-[6px] uppercase font-extrabold"
            style={{ color: '#F4D03F' }}
          >
            Prepárate para cantar
          </p>
        </div>

        <div className="relative called-avatar-wrap mb-8">
          <div className="called-ring called-ring-outer" />
          <div className="called-ring called-ring-inner" />
          <div
            className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden flex items-center justify-center text-8xl"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>
        </div>

        <p
          className="relative text-4xl md:text-7xl font-extrabold text-white text-center leading-tight called-name"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 34px rgba(233,30,140,0.45)' }}
        >
          {currentSinger.name}
        </p>

        <div
          className="mt-5 px-6 py-2.5 rounded-2xl flex items-center gap-2.5"
          style={{ background: 'rgba(15,10,20,0.8)', border: '1.5px solid rgba(139,92,246,0.5)' }}
        >
          <span className="text-base md:text-lg">🎵</span>
          <p
            className="font-bold text-center"
            style={{ color: '#E91E8C', fontSize: 'clamp(1rem, 2.6vh, 1.5rem)' }}
          >
            {songLine}
          </p>
        </div>
      </div>

      <style>{`
        .called-in {
          animation: calledIn 0.6s steps(4) both;
        }
        @keyframes calledIn {
          0% { opacity: 0; transform: translate(-8px, 6px) scale(0.97); }
          30% { opacity: 1; transform: translate(5px, -3px) scale(1.01); }
          60% { transform: translate(-3px, 2px) scale(0.995); }
          100% { opacity: 1; transform: translate(0,0) scale(1); }
        }
        .called-pulse {
          animation: calledBadgePulse 1.6s ease-in-out infinite;
        }
        @keyframes calledBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .called-avatar-wrap {
          width: 12rem;
          height: 12rem;
        }
        @media (min-width: 768px) {
          .called-avatar-wrap { width: 16rem; height: 16rem; }
        }
        .called-ring {
          position: absolute;
          inset: -14px;
          border-radius: 9999px;
          pointer-events: none;
        }
        .called-ring-outer {
          border: 3px solid rgba(233,30,140,0.55);
          animation: ringSpin 6s linear infinite, ringPulse 2.2s ease-in-out infinite;
        }
        .called-ring-inner {
          inset: -6px;
          border: 3px solid rgba(139,92,246,0.6);
          animation: ringSpin 4.5s linear infinite reverse;
        }
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 30px 4px rgba(233,30,140,0.45); }
          50% { box-shadow: 0 0 46px 10px rgba(233,30,140,0.75); }
        }
        .called-name {
          animation: nameGlow 2.4s ease-in-out infinite;
        }
        @keyframes nameGlow {
          0%, 100% { text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 24px rgba(233,30,140,0.4); }
          50% { text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 44px rgba(139,92,246,0.65); }
        }
        .called-scanlines {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.025) 0px,
            rgba(255,255,255,0.025) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  )
}
