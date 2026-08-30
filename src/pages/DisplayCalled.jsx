import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import RetrokeAtmosphere from '../components/retroke/RetrokeAtmosphere'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'

// v2 -- rediseño mas profundo (no solo agregar efectos encima de v1):
// antes todo vivia apilado y centrado en una sola columna angosta, lo que
// en un TV/proyector ancho (16:9) dejaba muchisimo espacio negro vacio a
// los costados (solo lo llenaban los iconos sueltos de FloatingDecor). En
// pantallas >=900px ahora es un layout de dos columnas tipo "zocalo de
// transmision en vivo" (avatar a la izquierda, nombre + cancion a la
// derecha, alineado a la izquierda) -- usa el ancho real de un TV en vez
// de pelear contra el. En pantallas angostas (celular en modo preview,
// tablet) sigue cayendo a la composicion apilada y centrada de siempre.
//
// Tecnicas nuevas que sumamos esta sesion en /inicio y /world y que aca
// se traen por primera vez:
//   - Anillo de borde neon "chasing gradient" (tecnica de mascara: padding
//     + mask-composite:exclude) alrededor del avatar Y en el borde de la
//     tarjeta de cancion, reemplazando los bordes solidos/anillos de un
//     solo color de la v1 -- mismo truco que el borde animado del cuadro
//     final de /inicio.
//   - Glitch periodico (steps() para que salte en vez de interpolar) en
//     el nombre del cantante -- interferencia digital breve cada 8s, como
//     "la señal sintonizando" al proximo cantante. Mismo patron que el
//     glitch del hero de /world (steps(1,end) + transform/filter en vez
//     de animation suave).
//   - Ken Burns sutil en la foto del avatar cuando existe (antes quedaba
//     estatica).
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
      className="h-screen relative overflow-hidden flex items-center justify-center px-8 md:px-16"
      style={{ background: 'var(--rk-bg-gradient, #05030a)' }}
    >
      <style>{RETROKE_STYLES}</style>
      {/* Mismos colores/grid que Retroke World (RetrokeAtmosphere con grid),
          solo el fondo -- avatar, nombre, cancion y artista quedan intactos. */}
      <RetrokeAtmosphere variant="none" grid />
      <RetroEqualizer />
      <FloatingDecor />

      <div className="called-scanlines" aria-hidden="true" />

      <div className="relative z-10 called-layout called-in">
        <div className="called-avatar-col">
          <div className="relative called-stage">
            <span className="called-spotlight called-spotlight-left" aria-hidden="true" />
            <span className="called-spotlight called-spotlight-right" aria-hidden="true" />
            <div className="called-neon-ring" aria-hidden="true" />
            <div
              className="relative called-avatar rounded-full overflow-hidden flex items-center justify-center text-8xl"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}
            >
              {currentSinger.photo ? (
                <img src={currentSinger.photo} alt={currentSinger.name} className="called-avatar-img" />
              ) : (
                currentSinger.avatar
              )}
            </div>
          </div>
        </div>

        <div className="called-info-col">
          <div className="called-badge">
            <span className="text-lg">🎤</span>
            <p className="called-badge-text">Prepárate para cantar</p>
          </div>

          <p className="relative called-name">
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
        .called-badge {
          animation: calledBadgePulse 1.6s ease-in-out infinite;
        }
        @keyframes calledBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }

        /* Layout: apilado y centrado en angosto, dos columnas ("zocalo de
           transmision") desde 900px -- ver comentario arriba del componente. */
        .called-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          max-width: 1180px;
          width: 100%;
        }
        @media (min-width: 900px) {
          .called-layout { flex-direction: row; align-items: center; justify-content: center; gap: 76px; }
        }
        .called-avatar-col {
          flex-shrink: 0;
        }
        .called-info-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        @media (min-width: 900px) {
          .called-info-col { align-items: flex-start; text-align: left; }
        }

        .called-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 26px;
          border-radius: 999px;
          background: rgba(10,6,15,0.72);
          border: 1.5px solid rgba(244,208,63,0.55);
          box-shadow: 0 0 24px 2px rgba(244,208,63,0.35);
          margin-bottom: 22px;
        }
        .called-badge-text {
          font-size: 15px;
          letter-spacing: 5px;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--rk-yellow, #F4D03F);
        }
        @media (min-width: 768px) {
          .called-badge-text { font-size: 18px; letter-spacing: 6px; }
        }

        .called-stage {
          width: 13.5rem;
          height: 13.5rem;
        }
        @media (min-width: 768px) {
          .called-stage { width: 17rem; height: 17rem; }
        }
        @media (min-width: 1280px) {
          .called-stage { width: 19rem; height: 19rem; }
        }
        .called-avatar {
          position: absolute;
          inset: 11px;
          z-index: 2;
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

        /* Anillo neon "chasing gradient" -- misma tecnica de mascara que el
           borde animado del cuadro final de /inicio: padding crea el grosor
           del aro, el degrade se mueve en loop, y la mascara con
           mask-composite:exclude deja ver SOLO el aro (no rellena el
           circulo entero). Reemplaza los dos anillos giratorios solidos de
           la v1 por un solo aro mas premium. */
        .called-neon-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 6px;
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

        /* Nombre: glow constante (siempre) + un glitch breve cada 8s
           (steps() para que "salte" en vez de interpolar, igual que el
           hero de /world) -- son dos animaciones sobre propiedades
           distintas (text-shadow vs. transform/filter), no compiten. */
        .called-name {
          font-size: clamp(2.5rem, 6.2vw, 5.5rem);
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

        /* Tarjeta de cancion/artista: mismo aro "chasing gradient" que el
           avatar (via ::before, exactamente del tamaño del padre -- no se
           corta con el overflow:hidden de la tarjeta porque no lo excede,
           a diferencia de un pseudo-elemento que sobresale). */
        .called-song-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 22px 34px 20px;
          border-radius: 22px;
          background: linear-gradient(160deg, rgba(20,12,28,0.88), rgba(10,6,14,0.92));
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 40px -18px rgba(0,0,0,0.8);
          overflow: hidden;
          min-width: 260px;
          max-width: 90vw;
        }
        @media (min-width: 900px) {
          .called-song-card { align-items: flex-start; }
        }
        .called-song-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.5px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: calledRingShift 6s linear infinite;
          pointer-events: none;
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
        @media (min-width: 900px) {
          .called-song-title { text-align: left; }
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
        @media (min-width: 900px) {
          .called-song-artist { text-align: left; }
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

        @media (prefers-reduced-motion: reduce) {
          .called-badge,
          .called-avatar-img,
          .called-neon-ring,
          .called-spotlight-left,
          .called-spotlight-right,
          .called-name,
          .called-song-card::before,
          .called-song-artist {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
