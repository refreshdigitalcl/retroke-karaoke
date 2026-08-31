import { forwardRef } from 'react'
import { useRetrokeFont } from '../lib/fonts'

// Tarjeta "Momento Retroke": la pieza que se ve al terminar de cantar,
// pensada primero para Instagram Stories/TikTok/WhatsApp (formato 9:16),
// no para leerse como un panel de estadisticas. Reutilizada en vivo en
// RegisterForm.jsx (YourTurnScreen y PerformanceShareScreen) y en la
// pagina publica /r/:id (SharePerformance.jsx).
//
// SEGUNDA VUELTA (feedback real sobre la primera version): "todo
// descuadrado, el diseño es muy basico, el logo se ve mal cortado, no es
// responsive, tiene que ser 9:16 obligatorio, la foto en pesima calidad,
// ubica los elementos de forma mas creativa". Se rediseño la composicion
// (ver "Diseño muy basico" mas abajo) y se cambio el mecanismo de 9:16 a
// la tecnica "padding-top: 177.78%" + un hijo con position:absolute que
// llena ese espacio -- PERO esa combinacion causo una regresion peor: con
// TODO el contenido interno en position:absolute, el contenedor
// (`.momento-outer`) quedaba sin ningun contenido de flujo normal del cual
// derivar un ancho, y como esta tarjeta vive dentro de un contenedor
// `flex flex-col items-center` (RegisterForm.jsx/SharePerformance.jsx),
// `align-items:center` hace que el wrapper NO se estire al ancho
// disponible -- se ajusta al contenido. Sin contenido de flujo normal que
// medir, el navegador no tenia de donde sacar un ancho, y "width:100%" de
// un ancho indefinido se resuelve como 0 -> tarjeta colapsada a practicamente
// nada (lo que se vio: un cuadrito rosa solido al compartir, y case nada
// visible en la pagina). Fix DEFINITIVO (dos capas, no una sola):
//   1. Se vuelve a `aspect-ratio: 9/16` (que SI funcionaba para dar tamaño
//      en la v1 -- el problema de la v1 nunca fue el mecanismo de 9:16,
//      fue que el CONTENIDO se pasaba del alto disponible) + `.momento-inner`
//      ahora es un hijo de FLUJO NORMAL (no position:absolute), asi la
//      tarjeta siempre tiene un ancho intrinseco que ofrecer aunque un
//      ancestro futuro vuelva a shrink-to-fit.
//   2. Los 3 lugares que renderizan esta tarjeta (RegisterForm.jsx x2,
//      SharePerformance.jsx) ahora envuelven `<ShareResultCard>` en un div
//      con `w-full max-w-sm` explicito, para que nunca dependa de que el
//      contenedor padre decida estirarse o no.
// El contenido de la v2 (mas compacto que la v1: sin subpuntajes ni
// logros, ver "Diseño muy basico") de todos modos entra comodo dentro del
// 9:16 fijo, asi que volver a aspect-ratio no reintroduce el recorte
// original.
//
// 2. "Diseño muy basico" / "mas creativa": la v1 era una columna de cajas
//    redondeadas apiladas (logo, avatar chico, nombre, caja de resultados,
//    fila de cancion) -- se leia como una pantalla de app, no como una
//    pieza para compartir. Ahora la composicion es "HERO + FICHA": la
//    FOTO del cantante ocupa la mitad de arriba a pantalla completa (como
//    una story real), con su nombre superpuesto abajo con degrade oscuro
//    (misma tecnica de fade que el hero de World.jsx), y una "ficha" de
//    vidrio abajo con cancion + resultados + lugar + marca. Si no hay foto
//    (avatar emoji), el hero cae a un fondo con glow y el emoji grande con
//    el mismo anillo de degrade que ya se uso en el avatar/portada.
//
// 3. "Foto en pesima calidad": la foto del cantante se guarda a 240x240
//    (ver resizeToSquareJpeg en RegisterForm.jsx) pensada para un avatar
//    chico de ~90px. Al mostrarla ahora a pantalla completa en el hero
//    (varias veces mas grande) se notaba el escalado. Se subio la
//    resolucion de guardado a 480x480 (RegisterForm.jsx) y aca se agrega
//    una textura de scanlines muy sutil sobre la foto (mismo lenguaje
//    visual que el resto de la app) que disimula el escalado en vez de
//    pelear contra el.
//
// LECCIONES DE HTML2CANVAS QUE NO HAY QUE ROMPER:
// 1. El numero de la nota va en color solido + text-shadow, nunca con la
//    tecnica de texto degradado (-webkit-background-clip: text) — sale
//    cortado/mal ubicado en la imagen final.
// 2. Los <img> tienen que estar cargados antes de capturar (ver
//    waitForImages en shareCard.js).
// 3. Ningun elemento visible usa animation infinita que dependa del
//    momento exacto de captura -- los anillos de degrade quedan con
//    `background-position` fijo, nunca animados.
//
// QUE VERSION SE MUESTRA (Bar / DJ / Home): igual que antes, NO es un
// branching explicito por "mode". Nota Final siempre existe si hubo algun
// dato real, Reacciones se muestra si reactionsCount es un numero (0 real
// incluido), Retroke Score solo aparece si hubo analisis de voz (exclusivo
// de Home). "mode" y "placeName" solo alimentan el chip de lugar.

const LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

const MODE_META = {
  BAR: { icon: '📍', label: 'Retroke Bar' },
  DJ: { icon: '🎧', label: 'Retroke DJ' },
  HOME: { icon: '🏠', label: 'Retroke Home' }
}

function formatCardDate(createdAt) {
  if (!createdAt) return null
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  try {
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch (e) {
    return null
  }
}

const ShareResultCard = forwardRef(function ShareResultCard(
  {
    singerName,
    avatar,
    photoUrl,
    song,
    artistName,
    artworkUrl,
    notaFinal,
    vocalScore,
    confidence,
    levelName,
    mode,
    placeName,
    reactionsCount,
    createdAt
  },
  ref
) {
  useRetrokeFont()

  const notaTxt = notaFinal !== null && notaFinal !== undefined ? Number(notaFinal).toFixed(1) : '-'
  const hasVocalScore = vocalScore !== null && vocalScore !== undefined
  const hasReactions = reactionsCount !== null && reactionsCount !== undefined

  const resultColumns = [
    { key: 'nota', icon: '⭐', label: 'Nota', value: notaTxt, color: '#F4D03F', big: true },
    hasReactions && { key: 'reactions', icon: '🔥', label: 'Reacciones', value: String(reactionsCount), color: '#8B5CF6' },
    hasVocalScore && { key: 'retroke', icon: '🎤', label: 'Retroke Score', value: vocalScore + '/100', color: '#E91E8C' }
  ].filter(Boolean)

  const modeMeta = mode ? MODE_META[mode] : null
  const placeTxt = mode === 'HOME' ? 'En casa' : (placeName || null)
  const dateTxt = formatCardDate(createdAt)
  const hasModeChip = Boolean(modeMeta)

  return (
    <div ref={ref} className="momento-outer">
      <style>{`
        /* 9:16 fijo con aspect-ratio (min-width evita el colapso a 0 si
           algun ancestro futuro vuelve a shrink-to-fit el contenedor -- ver
           nota larga arriba). .momento-inner es un hijo de FLUJO NORMAL
           (no position:absolute) para que la tarjeta siempre tenga un
           ancho intrinseco que ofrecer, no solo "100% de lo que sea que
           el padre decida". */
        .momento-outer {
          position: relative;
          width: 100%;
          min-width: 260px;
          max-width: 400px;
          aspect-ratio: 9 / 16;
          border-radius: 28px;
          overflow: hidden;
          border: 2.5px solid #E91E8C;
          background: #0a0512;
          box-sizing: border-box;
        }
        .momento-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          color: #fff;
          box-sizing: border-box;
        }
        .momento-in {
          animation: momentoIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes momentoIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* HERO: mitad de arriba, foto real a pantalla completa (o fallback
           con emoji + halo si no hay foto). El nombre se superpone abajo
           con degrade, como una story real -- no una tarjeta de datos. */
        .momento-hero {
          position: relative;
          flex: 0 0 50%;
          overflow: hidden;
          background: radial-gradient(circle at 50% 38%, #3a1a4a 0%, #150a20 72%);
        }
        .momento-hero-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: 50% 22%;
          background-repeat: no-repeat;
          filter: saturate(1.08) contrast(1.06);
        }
        .momento-hero-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .momento-hero-avatar-wrap {
          position: relative;
          width: 42%;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .momento-hero-avatar-glow {
          position: absolute;
          inset: -18%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(233,30,140,0.35) 0%, rgba(139,92,246,0.2) 55%, transparent 78%);
        }
        .momento-hero-avatar-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 4px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-position: 32% 50%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .momento-hero-avatar-emoji {
          position: relative;
          font-size: 15vw;
          line-height: 1;
          filter: drop-shadow(0 0 18px rgba(233, 30, 140, 0.7));
        }
        /* Textura muy sutil sobre la foto -- mismo lenguaje visual que el
           resto de la app (scanlines de DisplayCalled.jsx), y de paso
           disimula el escalado si la foto original es chica. */
        .momento-hero-grain {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px);
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        .momento-hero-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 65%;
          background: linear-gradient(to bottom, transparent 0%, rgba(10,5,18,0.55) 45%, #0a0512 100%);
          pointer-events: none;
        }
        .momento-logo {
          position: absolute;
          top: 5%;
          left: 5%;
          height: 8%;
          max-height: 26px;
          width: auto;
          display: block;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.7));
        }
        .momento-kicker {
          position: absolute;
          top: 5.5%;
          right: 5%;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #F4D03F;
          background: rgba(10,6,15,0.55);
          border: 1px solid rgba(244,208,79,0.5);
          border-radius: 999px;
          padding: 4px 10px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.6);
        }
        .momento-name-wrap {
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: 6%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }
        .momento-name {
          font-size: clamp(22px, 8vw, 34px);
          font-weight: 800;
          line-height: 1.08;
          text-shadow: 0 2px 14px rgba(0,0,0,0.75);
        }
        .momento-level {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 12px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.7);
          color: #F4D03F;
          background: rgba(10,6,15,0.55);
          letter-spacing: 0.03em;
        }

        /* FICHA: mitad de abajo, panel de vidrio con la cancion y los
           resultados. margin-top:auto en el pie asegura que siempre quede
           pegado abajo, sin importar cuanto contenido real haya arriba. */
        .momento-sheet {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 4% 6% 5%;
          background: #0a0512;
          min-height: 0;
          overflow: hidden;
        }
        .momento-song {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .momento-artwork-wrap {
          position: relative;
          width: 15vw;
          max-width: 58px;
          min-width: 42px;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
        }
        .momento-artwork-ring {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 2.5px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-position: 68% 50%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .momento-artwork {
          position: absolute;
          inset: 2.5px;
          width: calc(100% - 5px);
          height: calc(100% - 5px);
          border-radius: 13px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .momento-artwork-fallback {
          position: absolute;
          inset: 2.5px;
          width: calc(100% - 5px);
          height: calc(100% - 5px);
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: linear-gradient(135deg, rgba(139,92,246,0.4), rgba(233,30,140,0.4));
        }
        .momento-song-text {
          min-width: 0;
        }
        .momento-song-title {
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .momento-song-artist {
          margin-top: 2px;
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .momento-results {
          margin-top: 4%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5% 3%;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9));
          border: 1.5px solid rgba(244,208,79,0.5);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .momento-result-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .momento-result-col.is-big {
          flex: 1.15;
        }
        .momento-result-divider {
          width: 1px;
          align-self: stretch;
          margin: 0 3px;
          background: rgba(255,255,255,0.16);
        }
        .momento-result-label {
          font-size: 8.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .momento-result-value {
          font-weight: 700;
          line-height: 1.05;
        }
        .momento-result-value.is-big {
          font-size: clamp(28px, 9vw, 38px);
        }
        .momento-result-value.is-small {
          font-size: clamp(15px, 4.6vw, 19px);
        }
        .momento-confidence {
          margin-top: 6px;
          font-size: 9.5px;
          color: rgba(255,255,255,0.5);
          text-align: center;
        }

        .momento-mode-chip {
          margin-top: 4%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 2% 4%;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
          flex-shrink: 0;
        }
        .momento-mode-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }
        .momento-mode-sep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .momento-mode-sub {
          font-size: 10.5px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .momento-footer {
          margin-top: auto;
          padding-top: 4%;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-align: center;
          flex-shrink: 0;
        }
        .momento-footer-sub {
          margin-top: 2px;
          font-size: 9.5px;
          color: rgba(255,255,255,0.42);
        }
      `}</style>

      <div className="momento-inner momento-in">
        <div className="momento-hero">
          {photoUrl ? (
            <div
              className="momento-hero-photo"
              role="img"
              aria-label={singerName || ''}
              data-bg-src={photoUrl}
              style={{ backgroundImage: 'url(' + photoUrl + ')' }}
            />
          ) : (
            <div className="momento-hero-fallback">
              <div className="momento-hero-avatar-wrap">
                <div className="momento-hero-avatar-glow" />
                <div className="momento-hero-avatar-emoji">{avatar || '🎤'}</div>
                <div className="momento-hero-avatar-ring" />
              </div>
            </div>
          )}
          <div className="momento-hero-grain" />
          <div className="momento-hero-fade" />
          <img src={LOGO_SRC} alt="Retroke" className="momento-logo" />
          <span className="momento-kicker">Momento Retroke</span>
          <div className="momento-name-wrap">
            <div className="momento-name">{singerName || 'Cantante Retroke'}</div>
            {levelName && <div className="momento-level">🏅 {levelName}</div>}
          </div>
        </div>

        <div className="momento-sheet">
          <div className="momento-song">
            <div className="momento-artwork-wrap">
              {artworkUrl ? (
                <div
                  className="momento-artwork"
                  role="img"
                  aria-label=""
                  data-bg-src={artworkUrl}
                  style={{ backgroundImage: 'url(' + artworkUrl + ')' }}
                />
              ) : (
                <div className="momento-artwork-fallback">🎵</div>
              )}
              <div className="momento-artwork-ring" />
            </div>
            <div className="momento-song-text">
              <div className="momento-song-title">{song || 'Canción'}</div>
              {artistName && <div className="momento-song-artist">{artistName}</div>}
            </div>
          </div>

          <div className="momento-results">
            {resultColumns.map((col, i) => (
              <div key={col.key} className={'momento-result-col' + (col.big ? ' is-big' : '')} style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', flex: col.big ? 1.15 : 1 }}>
                {i > 0 && <div className="momento-result-divider" />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div className="momento-result-label">{col.icon} {col.label}</div>
                  <div
                    className={'momento-result-value ' + (col.big ? 'is-big' : 'is-small')}
                    style={{ color: col.color, textShadow: '0 0 16px ' + col.color + '80' }}
                  >
                    {col.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {confidence === 'baja' && (
            <div className="momento-confidence">medición con señal limitada</div>
          )}

          {hasModeChip && (
            <div className="momento-mode-chip">
              <span className="momento-mode-label">{modeMeta.icon} {modeMeta.label}</span>
              {placeTxt && (
                <>
                  <span className="momento-mode-sep" />
                  <span className="momento-mode-sub">{placeTxt}</span>
                </>
              )}
              {dateTxt && (
                <>
                  <span className="momento-mode-sep" />
                  <span className="momento-mode-sub">{dateTxt}</span>
                </>
              )}
            </div>
          )}

          <div className="momento-footer">
            El karaoke cambió para siempre.
            <div className="momento-footer-sub">retroke.cl</div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ShareResultCard
