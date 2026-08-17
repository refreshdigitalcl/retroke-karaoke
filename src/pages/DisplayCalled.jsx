import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import RetrokeAtmosphere from '../components/retroke/RetrokeAtmosphere'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'

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

  return (
    <div
      className="h-screen relative overflow-hidden flex flex-col items-center justify-center px-8"
      style={{ background: 'var(--rk-bg-gradient, #05030a)' }}
    >
      <style>{RETROKE_STYLES}</style>
      {/* Mismos colores/grid que Retroke World (RetrokeAtmosphere con grid),
          solo el fondo -- avatar, nombre, cancion y artista quedan intactos. */}
      <RetrokeAtmosphere variant="none" grid />
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
            style={{ color: 'var(--rk-yellow, #F4D03F)' }}
          >
            Prepárate para cantar
          </p>
        </div>

        <div className="relative called-stage mb-8">
          <span className="called-spotlight called-spotlight-left" aria-hidden="true" />
          <span className="called-spotlight called-spotlight-right" aria-hidden="true" />
          <div className="called-ring called-ring-outer" />
          <div className="called-ring called-ring-inner" />
          <div
            className="relative called-avatar rounded-full overflow-hidden flex items-center justify-center text-8xl"
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

        <div className="called-song-card mt-6">
          <span className="called-song-note" aria-hidden="true">♫</span>
          <p className="called-song-eyebrow">A punto de sonar</p>
          <p className="called-song-title">{currentSinger.song}</p>
          <p className="called-song-artist">
            {artistName || 'Detectando artista...'}
          </p>
          <span className="called-song-rule" />
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

        .called-stage {
          width: 12rem;
          height: 12rem;
        }
        @media (min-width: 768px) {
          .called-stage { width: 16rem; height: 16rem; }
        }
        .called-avatar {
          position: absolute;
          inset: 0;
          z-index: 2;
        }

        /* Luces de seguimiento blancas detrás del avatar, como el momento
           justo antes de subir al escenario: dos focos que se mueven en
           busca del protagonista y convergen sobre él. */
        .called-spotlight {
          position: absolute;
          top: -230px;
          left: 50%;
          width: 150px;
          height: 420px;
          margin-left: -75px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 82%);
          clip-path: polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%);
          filter: blur(2px);
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 0;
          transform-origin: top center;
        }
        .called-spotlight-left {
          animation: spotlightSweepLeft 3.4s ease-in-out infinite;
        }
        .called-spotlight-right {
          animation: spotlightSweepRight 3.4s ease-in-out infinite;
          animation-delay: -1.7s;
        }
        @keyframes spotlightSweepLeft {
          0%, 100% { transform: rotate(-26deg); opacity: 0.45; }
          50% { transform: rotate(-6deg); opacity: 0.85; }
        }
        @keyframes spotlightSweepRight {
          0%, 100% { transform: rotate(26deg); opacity: 0.45; }
          50% { transform: rotate(6deg); opacity: 0.85; }
        }

        .called-ring {
          position: absolute;
          inset: -14px;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 1;
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

        /* Tarjeta de cancion/artista: mas creativa que un simple pill,
           con jerarquia clara (eyebrow -> titulo -> artista) y un acento
           de nota musical decorativa. */
        .called-song-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 22px 34px 20px;
          border-radius: 22px;
          background: linear-gradient(160deg, rgba(20,12,28,0.88), rgba(10,6,14,0.92));
          border: 1px solid rgba(139,92,246,0.35);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 40px -18px rgba(0,0,0,0.8);
          overflow: hidden;
          min-width: 260px;
          max-width: 90vw;
        }
        .called-song-note {
          position: absolute;
          top: -18px;
          right: 4px;
          font-size: 84px;
          line-height: 1;
          color: rgba(139,92,246,0.14);
          transform: rotate(12deg);
          pointer-events: none;
        }
        .called-song-eyebrow {
          position: relative;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #7ED957;
        }
        .called-song-title {
          position: relative;
          margin-top: 6px;
          font-weight: 800;
          text-align: center;
          color: #ffffff;
          font-size: clamp(1.15rem, 2.8vh, 1.65rem);
          text-shadow: 0 0 18px rgba(255,255,255,0.18);
        }
        .called-song-artist {
          position: relative;
          margin-top: 4px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-align: center;
          font-size: clamp(0.85rem, 2vh, 1.05rem);
          background: linear-gradient(90deg, #E91E8C, #F4D03F, #8B5CF6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: calledArtistShimmer 5s ease-in-out infinite;
        }
        @keyframes calledArtistShimmer {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        .called-song-rule {
          display: block;
          width: 46px;
          height: 2px;
          margin-top: 14px;
          border-radius: 999px;
          background: linear-gradient(90deg, #E91E8C, #8B5CF6, #F4D03F);
          opacity: 0.8;
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
