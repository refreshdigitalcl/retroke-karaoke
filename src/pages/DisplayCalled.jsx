import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useRetrokeFont } from '../lib/fonts'
import RetroEqualizer from '../components/RetroEqualizer'
import { useLanguage } from '../lib/i18n'

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
  var T = useLanguage().T
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
      {/* Video de fondo exclusivo de esta pantalla (bar de karaoke, blanco y
          negro cinematico -- letreros "KARAOKE NIGHT"/"OPEN MIC"/"BAR" y
          mic en su pie). object-fit:cover para full-bleed real; muted +
          playsInline + autoPlay + loop para que reproduzca solo, sin
          controles, mientras dure la pantalla de "Prepárate para cantar".
          El clip original (final.mov) traía ~9s de pantalla en negro al
          final (el resto del video, pensado para otro uso) -- se recortó a
          los primeros 13s de contenido real y se le agregó un crossfade de
          0.6s entre el final y el inicio (ver public/called/called-bg.mp4)
          para que el loop sea perfectamente continuo, sin el salto brusco
          de negro a la escena. El tinte de color inyecta la paleta neon
          de la marca sobre el blanco y negro (capa normal, sin blend
          mode -- ver .called-bg-tint), y el scrim oscurece arriba/abajo
          para que el texto siga legible -- misma logica que el fade del
          hero de World.jsx, adaptada a video. Re-encodeado a 720p para
          que decodifique fluido en TV boxes/navegadores debiles. */}
      <video
        className="called-bg-video"
        src="/called/called-bg.mp4"
        poster="/called/called-bg-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="called-bg-tint" aria-hidden="true" />
      <div className="called-bg-scrim" aria-hidden="true" />

      <RetroEqualizer />
      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 called-scene called-in">
        <span className="called-badge">
          <span aria-hidden="true">🎤</span>
          {T.called.badge}
        </span>

        <div className="called-stage-3d">
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

        <div className="called-track">
          <div className="called-track-art">
            <span className="called-track-art-ring" aria-hidden="true" />
            <div className="called-track-art-inner">
              {currentSinger.artworkUrl ? (
                <img src={currentSinger.artworkUrl} alt="" className="called-track-art-img" />
              ) : (
                <span className="called-track-art-note" aria-hidden="true">♫</span>
              )}
            </div>
          </div>
          <div className="called-track-info">
            <p className="called-song-title">{currentSinger.song}</p>
            <p className="called-song-artist">
              {artistName || 'Detectando artista...'}
            </p>
          </div>
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

        /* Video de fondo: cubre toda la pantalla. El grading de color
           (contraste/brillo/saturacion) ahora lo hacen el tinte y el
           scrim de abajo en vez de un filter CSS sobre el <video> --
           un filter en un elemento de video fuerza al navegador a
           desactivar la composicion acelerada por hardware y causaba
           lag notorio en esta pantalla. */
        .called-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 50% 42%;
          z-index: 0;
        }
        /* Tinte de color sobre el blanco y negro: antes usaba
           mix-blend-mode:color para inyectar la paleta neon en la
           luminancia del video. mix-blend-mode sobre una capa que
           esta encima de un <video> reproduciendose obliga al
           navegador a recalcular el blend en CADA frame del video (no
           solo cuando el tinte cambia) y en TV boxes/navegadores
           viejos eso suele forzar compositing por software -- el lag
           reportado en esas pantallas. Se reemplaza por una capa
           normal (sin blend mode), con un poco mas de opacidad para
           compensar que ya no "tiñe" la luminancia real, solo se
           superpone. */
        .called-bg-tint {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(233,30,140,0.4) 45%, rgba(5,3,10,0.6) 100%);
        }
        /* Scrim: oscurece arriba (donde va el badge) y abajo (donde va
           la tarjeta "ahora suena"), deja el centro (avatar) mas
           visible -- misma logica que el fade del hero de World.jsx. */
        .called-bg-scrim {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(to bottom, rgba(5,3,10,0.8) 0%, rgba(5,3,10,0.3) 26%, rgba(5,3,10,0.38) 68%, rgba(5,3,10,0.86) 100%);
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

        /* El anillo que le encanto -- se mantiene igual (mismo degrade
           "chasing" en movimiento via background-position). Lo unico
           que cambia es que el brillo (antes un filter:drop-shadow
           animado pulsando cada 2.4s) ahora es fijo: esa animacion de
           filter era el costo mas alto de toda la pantalla en
           navegadores/TV boxes debiles, mucho mas que el movimiento
           del degrade en si. */
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
          filter: drop-shadow(0 0 14px rgba(233,30,140,0.6)) drop-shadow(0 0 24px rgba(139,92,246,0.42));
          animation: calledRingShift 5s linear infinite;
          z-index: 1;
          pointer-events: none;
        }
        @keyframes calledRingShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        /* Antes tenia dos animaciones continuas (text-shadow pulsando +
           glitch de transform/filter:hue-rotate). Ambas fuerzan repaint
           en cada frame sobre un texto grande -- se dejan fijas
           (mismo look de glow, sin el costo de animarlo cada frame). */
        .called-name {
          font-weight: 800;
          color: #ffffff;
          line-height: 1.05;
          font-size: clamp(2.6rem, 6.4vw, 5.2rem);
          text-shadow: 0 2px 24px rgba(0,0,0,0.65), 0 0 34px rgba(233,30,140,0.45);
        }

        /* "Ahora suena": misma idea que la fila de la lista de espera
           (DisplayQueue.jsx -- caratula cuadrada + nombre de cancion +
           artista), pero con el lenguaje visual de esta pantalla: el
           mismo aro de degrade en movimiento que el avatar (adaptado a
           esquina redondeada en vez de circulo), envuelto en una
           capsula de vidrio para que se lea como un widget "now
           playing" aparte del nombre del cantante. */
        .called-track {
          display: flex;
          align-items: center;
          gap: clamp(14px, 1.8vw, 20px);
          margin-top: clamp(18px, 3vh, 30px);
          padding: 8px 26px 8px 8px;
          border-radius: 999px;
          background: rgba(10,6,15,0.55);
          border: 1px solid rgba(139,92,246,0.28);
          box-shadow: 0 10px 30px -14px rgba(0,0,0,0.7);
          max-width: 100%;
        }
        .called-track-art {
          position: relative;
          flex-shrink: 0;
          width: clamp(56px, 6vw, 76px);
          height: clamp(56px, 6vw, 76px);
        }
        .called-track-art-ring {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 3px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: calledRingShift 5s linear infinite;
          z-index: 1;
          pointer-events: none;
        }
        .called-track-art-inner {
          position: absolute;
          inset: 3px;
          border-radius: 13px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(139,92,246,0.35), rgba(233,30,140,0.35));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .called-track-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .called-track-art-note {
          font-size: clamp(20px, 2.4vw, 26px);
          color: rgba(255,255,255,0.85);
        }
        .called-track-info {
          min-width: 0;
          text-align: left;
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

        /* Mismo motivo que .called-bg-tint: sin mix-blend-mode, para no
           forzar un re-blend por software en cada frame del video de
           fondo. */
        .called-scanlines {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.035) 0px,
            rgba(255,255,255,0.035) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .called-badge,
          .called-avatar-img,
          .called-neon-ring,
          .called-song-artist {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
