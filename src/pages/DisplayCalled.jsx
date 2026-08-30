import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useRetrokeFont } from '../lib/fonts'
import RetroEqualizer from '../components/RetroEqualizer'

// v5 -- reconstruida desde cero (feedback: "no me gusto para nada,
// reconstruye desde 0, elimina esas luces arriba y esas rayas, necesito
// algo mucho mas atractivo y moderno retro neon... que sea fullscreen,
// incluye elementos 3D algo mas creativo"). Lo unico que se mantiene sin
// tocar de las versiones anteriores es el anillo "chasing gradient"
// alrededor del avatar (el elemento que SI le gusto en todas las rondas).
//
// Se descartan los spotlights (v2/v3) y las lineas diagonales de acento
// (v4) por completo -- ninguno volvio a aparecer aca.
//
// Direccion nueva: en vez de forzar una composicion asimetrica de dos
// columnas (v4, rechazada), se vuelve a centrar -- pero esta vez el
// centro esta justificado: esto es un momento de foco unico sobre UN
// protagonista (como un spotlight real siempre centra a su sujeto), no
// una landing page con multiples mensajes compitiendo. Lo que cambia
// respecto a la v2/v3 (que tambien centraban) es que ahora hay
// profundidad real en vez de una tarjeta plana:
//
//   1. Piso con perspectiva (transform: rotateX + grid de lineas
//      NITIDAS, sin blur) -- un escenario real bajo el cantante, no una
//      tarjeta flotando en el vacio.
//   2. Reflejo del avatar en el piso (copia volteada + mask-image que
//      la desvanece hacia abajo -- nunca blur, por eso no se ve como
//      mancha) -- efecto de vidrio/piso pulido, tipico de keynotes
//      premium.
//   3. Halo 3D detras del avatar: un segundo anillo (mismo truco de
//      degrade en movimiento que el anillo que le gusto) pero inclinado
//      en perspectiva real (rotateX) y girando en el eje Z -- un "anillo
//      de Saturno" neon orbitando al cantante. Vive en un elemento
//      APARTE del anillo pegado al avatar (que sigue plano, intacto) asi
//      que no compiten por el mismo transform.
//
// Linea de horizonte: en vez del blob radial difuminado que causo la
// "mancha" de la v2, es una linea horizontal FINA con un blur chico
// (6px, no 70px) -- lee como el brillo de un horizonte real, no como una
// forma amorfa.
//
// Fullscreen real: el contenedor ya no tiene padding de pagina -- el
// piso y el horizonte llegan hasta los bordes de la pantalla, la escena
// central flota sobre ellos.
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

  var avatarVisual = currentSinger.photo ? (
    <img src={currentSinger.photo} alt={currentSinger.name} className="called-avatar-img" />
  ) : (
    <span className="called-avatar-emoji">{currentSinger.avatar}</span>
  )

  return (
    <div
      className="h-screen w-full relative overflow-hidden flex items-center justify-center called-page"
      style={{ background: 'var(--rk-bg-gradient, #05030a)' }}
    >
      <div className="called-floor-scene" aria-hidden="true">
        <span className="called-horizon" />
        <div className="called-floor" />
      </div>

      <RetroEqualizer />
      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 called-scene called-in">
        <span className="called-badge">
          <span aria-hidden="true">🎤</span>
          Prepárate para cantar
        </span>

        <div className="called-stage-3d">
          <div className="called-halo-3d" aria-hidden="true" />
          <div className="called-avatar-reflect" aria-hidden="true">{avatarVisual}</div>
          <div className="relative called-stage">
            <div className="called-neon-ring" aria-hidden="true" />
            <div
              className="relative called-avatar rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}
            >
              {avatarVisual}
            </div>
          </div>
        </div>

        <p className="called-name">{currentSinger.name}</p>
        <span className="called-rule" aria-hidden="true" />

        <div className="called-song">
          <p className="called-song-title">{currentSinger.song}</p>
          <p className="called-song-artist">
            {artistName || 'Detectando artista...'}
          </p>
        </div>
      </div>

      <style>{`
        .called-page {
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

        /* Escenario 3D: piso con perspectiva real + linea de horizonte
           fina (nunca un blob difuminado -- eso fue lo que causo la
           "mancha" de rondas anteriores). Todo nitido. */
        .called-floor-scene {
          position: absolute;
          inset: 0;
          overflow: hidden;
          perspective: 700px;
          perspective-origin: 50% 42%;
          pointer-events: none;
        }
        .called-horizon {
          position: absolute;
          left: 8%;
          right: 8%;
          top: 42%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.55) 20%, rgba(244,208,63,0.5) 50%, rgba(139,92,246,0.55) 80%, transparent 100%);
          filter: blur(1.5px);
          box-shadow: 0 0 16px 1px rgba(233,30,140,0.25);
        }
        .called-floor {
          position: absolute;
          left: -60%;
          right: -60%;
          top: 42%;
          height: 70%;
          background-image:
            linear-gradient(rgba(139,92,246,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(233,30,140,0.28) 1px, transparent 1px);
          background-size: 64px 64px;
          transform: rotateX(78deg);
          transform-origin: 50% 0%;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 78%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 78%);
        }

        .called-scene {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4vh 6vw;
          max-width: 900px;
        }

        .called-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 22px;
          border-radius: 999px;
          background: rgba(10,6,15,0.65);
          border: 1.5px solid rgba(244,208,63,0.5);
          box-shadow: 0 0 22px 1px rgba(244,208,63,0.3);
          font-size: clamp(12px, 1.1vw, 15px);
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--rk-yellow, #F4D03F);
          margin-bottom: clamp(22px, 4vh, 40px);
          animation: calledBadgePulse 1.6s ease-in-out infinite;
        }
        @keyframes calledBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Contenedor 3D: perspective real para que el halo (rotateX) y
           el reflejo lean en el mismo espacio dimensional que el piso. */
        .called-stage-3d {
          position: relative;
          perspective: 900px;
          margin-bottom: clamp(20px, 3.4vh, 34px);
        }

        .called-stage {
          position: relative;
          width: clamp(11rem, 26vh, 21rem);
          height: clamp(11rem, 26vh, 21rem);
        }
        .called-avatar {
          position: absolute;
          inset: 11px;
          z-index: 2;
        }
        .called-avatar-emoji {
          font-size: clamp(3.8rem, 9vh, 6.4rem);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .called-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.14) contrast(1.06);
          animation: calledAvatarKenBurns 16s ease-in-out infinite alternate;
        }
        @keyframes calledAvatarKenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }

        /* El anillo que le encanto -- sin cambios en su tecnica. */
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

        /* Halo 3D nuevo: un segundo anillo, mas grande, inclinado en
           perspectiva real (rotateX) como un anillo de Saturno, girando
           en su propio eje. Vive en un elemento distinto al anillo del
           avatar (que sigue plano) -- ningun transform compite. */
        .called-halo-3d {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 148%;
          height: 148%;
          margin-left: -74%;
          margin-top: -74%;
          border-radius: 9999px;
          padding: 2px;
          box-sizing: border-box;
          background: linear-gradient(120deg, rgba(233,30,140,0.9), rgba(244,208,63,0.7), rgba(139,92,246,0.9), rgba(126,217,87,0.6), rgba(233,30,140,0.9));
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          transform-style: preserve-3d;
          transform: rotateX(72deg);
          animation: haloSpin 9s linear infinite, calledRingShift 5s linear infinite;
          opacity: 0.75;
          z-index: 0;
          pointer-events: none;
        }
        @keyframes haloSpin {
          from { transform: rotateX(72deg) rotateZ(0deg); }
          to { transform: rotateX(72deg) rotateZ(360deg); }
        }

        /* Reflejo del avatar sobre el piso: copia volteada, desvanecida
           con mask-image (nunca blur) -- efecto de piso pulido. */
        .called-avatar-reflect {
          position: absolute;
          left: 11px;
          right: 11px;
          top: calc(100% - 11px);
          height: clamp(11rem, 26vh, 21rem);
          border-radius: 9999px;
          overflow: hidden;
          transform: scaleY(-1);
          opacity: 0.28;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 65%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 65%);
          pointer-events: none;
        }
        .called-avatar-reflect .called-avatar-emoji,
        .called-avatar-reflect .called-avatar-img {
          filter: saturate(1.1);
        }

        .called-name {
          font-weight: 800;
          color: #ffffff;
          line-height: 1.05;
          font-size: clamp(2.6rem, 6.4vw, 5.2rem);
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

        .called-rule {
          display: block;
          width: clamp(56px, 6vw, 90px);
          height: 3px;
          border-radius: 999px;
          margin: clamp(16px, 2.6vh, 24px) 0;
          background: linear-gradient(90deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 100%;
          animation: calledRingShift 5s linear infinite;
        }

        .called-song-title {
          font-weight: 700;
          color: #ffffff;
          font-size: clamp(1.15rem, 2.4vw, 1.7rem);
          text-shadow: 0 0 18px rgba(255,255,255,0.16);
        }
        .called-song-artist {
          margin-top: 6px;
          font-weight: 600;
          letter-spacing: 0.4px;
          font-size: clamp(0.9rem, 1.5vw, 1.05rem);
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
          .called-halo-3d,
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
