import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useRetrokeFont } from '../lib/fonts'
import RetroEqualizer from '../components/RetroEqualizer'

// v4 -- distribucion rehecha de nuevo (feedback: "me encanta el avatar
// con el flujo de colores, pero no me gusto la distribucion, intenta
// algo moderno y retro").
//
// Lo que se mantiene (le encanto, no se toca): el anillo "chasing
// gradient" alrededor del avatar, el glitch periodico del nombre, el
// Ken Burns de la foto, el scanline CRT, el ecualizador fino en los
// bordes.
//
// Lo que cambia es la composicion completa. La v3 metia todo (badge +
// avatar + nombre + cancion) adentro de una sola tarjeta de vidrio
// centrada -- funcional, pero es exactamente el default de "card
// centrada" que se siente generico. Se rehizo como un grafico de
// transmision en vivo real: asimetrico, sin caja/card envolviendo todo,
// avatar grande anclado a un costado, texto anclado al otro con
// jerarquia tipografica fuerte (nombre gigante) en vez de todo
// encerrado en un rectangulo. Acentos de fondo pasan de blobs
// difuminados (eso fue lo que causaba la "mancha" en la v2) a lineas
// finas y nitidas con degrade a los extremos -- dan textura retro sin
// arriesgarse a verse sucias.
//
// Tipografia: se suma Space Grotesk (useRetrokeFont, el mismo font
// display que ya usan World/Rankings/Challenges) para el nombre y el
// badge -- mas "moderno" que el sans por defecto, y ata esta pantalla
// al mismo lenguaje tipografico del resto de Retroke World.
//
// Responsive para TV: grid de 2 columnas asimetricas desde 860px (el
// caso real de un TV 16:9), columna unica centrada debajo de eso.
// Tamaños en clamp() con vw/vh -- misma proporcion en cualquier TV real.
export default function DisplayCalled() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  useRetrokeFont()

  if (!currentSinger) return null

  // El nombre del artista original se detecta solo (iTunes) apenas se llama
  // al cantante — ver KaraokeSessionContext.callSinger. Mientras llega, la
  // pantalla no debe quedar mostrando un placeholder roto: se muestra solo
  // la canción hasta que el dato esté listo, y se actualiza solo (realtime)
  // cuando se resuelve.
  var artistName = currentSinger.artistName || ''

  return (
    <div
      className="h-screen relative overflow-hidden flex items-center justify-center called-page"
      style={{ background: 'var(--rk-bg-gradient, #05030a)' }}
    >
      <div className="called-lines" aria-hidden="true" />
      <RetroEqualizer />
      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 called-layout called-in">
        <div className="called-avatar-zone">
          <div className="relative called-stage">
            <span className="called-spotlight called-spotlight-left" aria-hidden="true" />
            <span className="called-spotlight called-spotlight-right" aria-hidden="true" />
            <div className="called-neon-ring" aria-hidden="true" />
            <div
              className="relative called-avatar rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}
            >
              {currentSinger.photo ? (
                <img src={currentSinger.photo} alt={currentSinger.name} className="called-avatar-img" />
              ) : (
                <span className="called-avatar-emoji">{currentSinger.avatar}</span>
              )}
            </div>
          </div>
        </div>

        <div className="called-text-zone">
          <span className="called-badge">
            <span aria-hidden="true">🎤</span>
            Prepárate para cantar
          </span>

          <p className="called-name">{currentSinger.name}</p>

          <span className="called-rule" aria-hidden="true" />

          <div className="called-song">
            <p className="called-song-title">{currentSinger.song}</p>
            <p className="called-song-artist">
              {artistName || 'Detectando artista...'}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .called-page {
          padding: 5vh 5vw;
          font-family: var(--rk-font-display, 'Space Grotesk', system-ui, sans-serif);
        }

        .called-in {
          animation: calledIn 0.6s steps(4) both;
        }
        @keyframes calledIn {
          0% { opacity: 0; transform: translate(-8px, 6px) scale(0.97); }
          30% { opacity: 1; transform: translate(5px, -3px) scale(1.01); }
          60% { transform: translate(-3px, 2px) scale(0.995); }
          100% { opacity: 1; transform: translate(0,0) scale(1); }
        }

        /* Acentos de fondo: lineas finas y nitidas con degrade a los
           extremos (nunca blobs difuminados -- eso fue lo que causo la
           "mancha" de la v2/v3). Dan textura synthwave sin arriesgarse
           a verse sucias. */
        .called-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .called-lines::before,
        .called-lines::after {
          content: '';
          position: absolute;
          left: -20%;
          width: 140%;
          height: 1.5px;
        }
        .called-lines::before {
          top: 22%;
          transform: rotate(-6deg);
          background: linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.4) 45%, rgba(244,208,63,0.3) 55%, transparent 100%);
        }
        .called-lines::after {
          bottom: 20%;
          transform: rotate(-6deg);
          background: linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 45%, rgba(126,217,87,0.25) 55%, transparent 100%);
        }

        /* Grid asimetrico: avatar en una columna angosta, texto en una
           mas ancha -- anti-simetria a proposito (dos columnas iguales
           se sentia "generico"). Colapsa a una sola columna centrada
           debajo de 860px. */
        .called-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(28px, 4vh, 48px);
          width: 100%;
          max-width: 1500px;
        }
        @media (min-width: 860px) {
          .called-layout {
            display: grid;
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
            align-items: center;
            gap: clamp(40px, 6vw, 96px);
          }
        }

        .called-avatar-zone {
          display: flex;
          justify-content: center;
        }
        @media (min-width: 860px) {
          .called-avatar-zone { justify-content: flex-end; }
        }

        .called-stage {
          position: relative;
          width: clamp(11rem, 24vh, 20rem);
          height: clamp(11rem, 24vh, 20rem);
          flex-shrink: 0;
        }
        .called-avatar {
          position: absolute;
          inset: 12px;
          z-index: 2;
        }
        .called-avatar-emoji {
          font-size: clamp(3.8rem, 8vh, 6rem);
        }
        .called-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.12) contrast(1.05);
          animation: calledAvatarKenBurns 16s ease-in-out infinite alternate;
        }
        @keyframes calledAvatarKenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }

        /* El anillo que le encanto -- intacto. */
        .called-neon-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 5px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: calledRingShift 5s linear infinite, calledRingGlowPulse 2.4s ease-in-out infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes calledRingShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes calledRingGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(233,30,140,0.45)) drop-shadow(0 0 18px rgba(139,92,246,0.3)); }
          50% { filter: drop-shadow(0 0 18px rgba(233,30,140,0.75)) drop-shadow(0 0 30px rgba(139,92,246,0.55)); }
        }

        .called-spotlight {
          position: absolute;
          top: -70%;
          left: 50%;
          width: 45%;
          height: 170%;
          margin-left: -22.5%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.06) 55%, rgba(255,255,255,0) 82%);
          clip-path: polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%);
          filter: blur(2px);
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 0;
          transform-origin: top center;
        }
        .called-spotlight-left { animation: spotlightSweepLeft 3.4s ease-in-out infinite; }
        .called-spotlight-right { animation: spotlightSweepRight 3.4s ease-in-out infinite; animation-delay: -1.7s; }
        @keyframes spotlightSweepLeft {
          0%, 100% { transform: rotate(-26deg); opacity: 0.4; }
          50% { transform: rotate(-6deg); opacity: 0.8; }
        }
        @keyframes spotlightSweepRight {
          0%, 100% { transform: rotate(26deg); opacity: 0.4; }
          50% { transform: rotate(6deg); opacity: 0.8; }
        }

        /* Zona de texto: sin card envolviendo -- cada elemento vive
           directo sobre el fondo, como un grafico de transmision real,
           con jerarquia por tamaño/peso en vez de por contenedor. */
        .called-text-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-width: 0;
        }
        @media (min-width: 860px) {
          .called-text-zone { align-items: flex-start; text-align: left; }
        }

        .called-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: clamp(12px, 1.1vw, 15px);
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--rk-yellow, #F4D03F);
          margin-bottom: clamp(10px, 1.6vh, 16px);
        }

        .called-name {
          font-weight: 800;
          color: #ffffff;
          line-height: 1.03;
          font-size: clamp(2.6rem, 6.4vw, 5.6rem);
          text-shadow: 0 2px 24px rgba(0,0,0,0.65), 0 0 34px rgba(233,30,140,0.4);
          animation: nameGlow 2.4s ease-in-out infinite, calledNameGlitch 8s steps(1, end) infinite;
        }
        @keyframes nameGlow {
          0%, 100% { text-shadow: 0 2px 24px rgba(0,0,0,0.65), 0 0 24px rgba(233,30,140,0.35); }
          50% { text-shadow: 0 2px 24px rgba(0,0,0,0.65), 0 0 44px rgba(139,92,246,0.6); }
        }
        @keyframes calledNameGlitch {
          0%, 4%, 100% { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
          0.6% { transform: translate(-6px, 2px) skewX(-1.4deg); filter: hue-rotate(18deg); }
          1.1% { transform: translate(5px, -2px); filter: hue-rotate(-14deg); }
          1.6% { transform: translate(-3px, 1px) skewX(0.8deg); filter: hue-rotate(10deg); }
          2%, 3.4% { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
        }

        /* Regla fina con el mismo degrade en movimiento del anillo --
           eco intencional del elemento que le gusto, ahora como acento
           horizontal en vez de circular. */
        .called-rule {
          display: block;
          width: clamp(64px, 8vw, 120px);
          height: 3px;
          border-radius: 999px;
          margin: clamp(16px, 2.6vh, 26px) 0;
          background: linear-gradient(90deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 100%;
          animation: calledRingShift 5s linear infinite;
        }

        .called-song-title {
          font-weight: 700;
          color: #ffffff;
          font-size: clamp(1.15rem, 2.2vw, 1.7rem);
          text-shadow: 0 0 18px rgba(255,255,255,0.16);
        }
        .called-song-artist {
          margin-top: 6px;
          font-weight: 600;
          letter-spacing: 0.4px;
          font-size: clamp(0.9rem, 1.4vw, 1.05rem);
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

        .called-scanlines {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
        }

        @media (prefers-reduced-motion: reduce) {
          .called-avatar-img,
          .called-neon-ring,
          .called-spotlight-left,
          .called-spotlight-right,
          .called-name,
          .called-rule,
          .called-song-artist {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
