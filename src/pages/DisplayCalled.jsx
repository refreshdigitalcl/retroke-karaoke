import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'

// v3 -- fondo y distribucion rehechos desde cero (feedback: "el fondo es
// muy feo, tiene como una mancha detras del gradiente, y no me gusto la
// distribucion").
//
// Que causaba la mancha: la v2 usaba RetrokeAtmosphere(grid) -- que trae
// un "horizonte" (radial-gradient blureado, blur:8px, posicionado a
// bottom:42%) -- MAS FloatingDecor, cuyo StageSmoke pinta 4 blobs blancos
// semitransparentes (radial-gradient + blur:18px) que flotan y derivan
// (@keyframes smokeDrift) por toda la pantalla. Encima de todo eso iban
// nuestros propios glows (anillo del avatar, spotlights, sombra de la
// tarjeta). En una pantalla mas ocupada (SessionHub, World) ese ruido se
// disimula; aca, con una composicion centrada y poco contenido, se veia
// exactamente como una mancha sucia flotando detras del texto. Se sacaron
// ambos componentes de esta pantalla -- el fondo ahora es 100% a medida:
// un solo brillo ambiental, grande, MUY difuminado (blur 60px) y de baja
// opacidad, fijo en el centro (nunca deriva ni cambia de forma), que lee
// como luz de escenario y no como una forma reconocible.
//
// Distribucion nueva: en vez de dos columnas sueltas flotando sobre el
// fondo (v2), ahora TODO -- badge, avatar, nombre, cancion -- vive DENTRO
// de una sola tarjeta de vidrio con el borde neon animado envolviendo el
// conjunto completo. Eso es lo que se sentia "sin distribucion": los
// elementos no tenian un borde que los uniera como una sola pieza de
// diseño. Adentro de esa tarjeta, el avatar y el texto se acomodan en
// fila en pantallas anchas (el caso real de un TV) y en columna en
// angostas.
//
// Responsive para TV: nada de anchos/altos fijos en px salvo el limite
// maximo -- el ancho de la tarjeta, el tamaño del avatar, las tipografias
// y los espaciados usan clamp() con vw/vh, asi la proporcion se mantiene
// igual en un TV de 32" (1920x1080) que en uno de 75" 4K (3840x2160,
// misma proporcion 16:9 = mismos vw/vh relativos) y sigue viendose bien
// si el navegador no es exactamente 16:9.
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
      className="h-screen relative overflow-hidden flex items-center justify-center called-page"
      style={{ background: 'var(--rk-bg-gradient, #05030a)' }}
    >
      <div className="called-bg-glow" aria-hidden="true" />
      <div className="called-bg-grid" aria-hidden="true" />
      <RetroEqualizer />
      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 called-card called-in">
        <div className="called-badge">
          <span className="text-lg">🎤</span>
          <p className="called-badge-text">Prepárate para cantar</p>
        </div>

        <div className="called-body">
          <div className="called-stage">
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

          <div className="called-text">
            <p className="called-name">{currentSinger.name}</p>

            <div className="called-song">
              <p className="called-song-eyebrow">A punto de sonar</p>
              <p className="called-song-title">{currentSinger.song}</p>
              <p className="called-song-artist">
                {artistName || 'Detectando artista...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .called-page {
          padding: 4vh 4vw;
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

        /* Fondo: un solo brillo ambiental, fijo y muy difuminado (no
           deriva, no cambia de forma) -- lee como luz de escenario, no
           como una mancha. Radio y opacidad bajos a propósito. */
        .called-bg-glow {
          position: absolute;
          inset: -15%;
          background:
            radial-gradient(ellipse 55% 45% at 50% 38%, rgba(139,92,246,0.18) 0%, transparent 65%),
            radial-gradient(ellipse 45% 40% at 50% 62%, rgba(233,30,140,0.13) 0%, transparent 65%);
          filter: blur(70px);
          pointer-events: none;
        }
        /* Grid muy sutil de piso (una sola cara, no el "cuarto" completo) --
           da textura retro sin competir con la tarjeta central. */
        .called-bg-grid {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image:
            linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px);
          background-size: 3.5vw 3.5vw;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, black 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, black 75%);
          pointer-events: none;
        }

        /* Tarjeta unica: badge + avatar + nombre + cancion viven todos
           adentro, con el borde neon "chasing gradient" envolviendo el
           conjunto completo (antes eran piezas sueltas sin nada que las
           uniera como una sola pieza de diseño). Ancho/alto/padding en
           clamp() -- ni fijo en px ni 100% fluido, para que se vea igual
           de proporcionada en cualquier tamaño de TV real (misma
           proporcion 16:9 = mismos vw/vh relativos). */
        .called-card {
          position: relative;
          width: min(94vw, 1320px);
          max-height: 90vh;
          padding: clamp(28px, 4.5vh, 56px) clamp(24px, 5vw, 72px);
          border-radius: clamp(20px, 2.2vw, 34px);
          background: linear-gradient(160deg, rgba(20,12,28,0.86), rgba(8,5,12,0.92));
          box-shadow: 0 30px 70px -30px rgba(0,0,0,0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }
        .called-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: calledBorderShift 6s linear infinite;
          pointer-events: none;
        }
        @keyframes calledBorderShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        .called-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 24px;
          border-radius: 999px;
          background: rgba(10,6,15,0.72);
          border: 1.5px solid rgba(244,208,63,0.55);
          box-shadow: 0 0 24px 2px rgba(244,208,63,0.35);
          margin-bottom: clamp(20px, 3.5vh, 40px);
          animation: calledBadgePulse 1.6s ease-in-out infinite;
        }
        @keyframes calledBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .called-badge-text {
          font-size: clamp(13px, 1.3vw, 18px);
          letter-spacing: 4px;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--rk-yellow, #F4D03F);
        }

        /* Cuerpo: fila en pantallas anchas (el caso real de un TV),
           columna en angostas. */
        .called-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(20px, 3vh, 36px);
          width: 100%;
        }
        @media (min-width: 820px) {
          .called-body { flex-direction: row; justify-content: center; gap: clamp(36px, 5vw, 72px); }
        }

        .called-stage {
          position: relative;
          flex-shrink: 0;
          width: clamp(9.5rem, 22vh, 15rem);
          height: clamp(9.5rem, 22vh, 15rem);
        }
        .called-avatar {
          position: absolute;
          inset: 11px;
          z-index: 2;
        }
        .called-avatar-emoji {
          font-size: clamp(3.5rem, 9vh, 5.5rem);
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
          animation: calledBorderShift 5s linear infinite, calledRingGlowPulse 2.4s ease-in-out infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes calledRingGlowPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(233,30,140,0.45)) drop-shadow(0 0 18px rgba(139,92,246,0.3)); }
          50% { filter: drop-shadow(0 0 18px rgba(233,30,140,0.75)) drop-shadow(0 0 30px rgba(139,92,246,0.55)); }
        }

        /* Luces de seguimiento, contenidas dentro de .called-stage (ya no
           se salen a pintar sobre el resto de la tarjeta). */
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

        .called-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-width: 0;
        }
        @media (min-width: 820px) {
          .called-text { align-items: flex-start; text-align: left; }
        }

        .called-name {
          font-size: clamp(2.1rem, 5.2vw, 4.2rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.05;
          text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 34px rgba(233,30,140,0.45);
          animation: nameGlow 2.4s ease-in-out infinite, calledNameGlitch 8s steps(1, end) infinite;
        }
        @keyframes nameGlow {
          0%, 100% { text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 24px rgba(233,30,140,0.4); }
          50% { text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 0 44px rgba(139,92,246,0.65); }
        }
        @keyframes calledNameGlitch {
          0%, 4%, 100% { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
          0.6% { transform: translate(-6px, 2px) skewX(-1.4deg); filter: hue-rotate(18deg); }
          1.1% { transform: translate(5px, -2px); filter: hue-rotate(-14deg); }
          1.6% { transform: translate(-3px, 1px) skewX(0.8deg); filter: hue-rotate(10deg); }
          2%, 3.4% { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
        }

        .called-song {
          margin-top: clamp(14px, 2.4vh, 24px);
          padding-top: clamp(14px, 2.4vh, 24px);
          border-top: 1px solid rgba(255,255,255,0.1);
          width: 100%;
        }
        .called-song-eyebrow {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #7ED957;
        }
        .called-song-title {
          margin-top: 6px;
          font-weight: 800;
          color: #ffffff;
          font-size: clamp(1.1rem, 2.4vw, 1.7rem);
          text-shadow: 0 0 18px rgba(255,255,255,0.18);
        }
        .called-song-artist {
          margin-top: 4px;
          font-weight: 700;
          letter-spacing: 0.5px;
          font-size: clamp(0.85rem, 1.5vw, 1.05rem);
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
          .called-badge,
          .called-avatar-img,
          .called-neon-ring,
          .called-card::before,
          .called-spotlight-left,
          .called-spotlight-right,
          .called-name,
          .called-song-artist {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
