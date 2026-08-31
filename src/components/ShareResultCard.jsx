import { forwardRef } from 'react'
import { useRetrokeFont } from '../lib/fonts'

// Tarjeta visual del resultado, retro-neon, pensada para verse bien tanto
// en la pagina publica /r/:id como convertida a imagen para compartir, y
// tambien incrustada en vivo en la pantalla de resultado del celular apenas
// termina de cantar. Reutiliza la misma paleta ya establecida en
// SessionHub.jsx y DisplayCalled.jsx.
//
// REDISEÑO "MOMENTO RETROKE" (brief /design-taste-frontend): la tarjeta dejo
// de ser una tarjeta de estadisticas (nota + subpuntajes) para ser una
// pieza pensada para Instagram Stories/TikTok/WhatsApp: jerarquia
// RETROKE -> MOMENTO -> ARTISTA -> CANCION -> PORTADA -> RESULTADOS ->
// MODO/LUGAR -> IDENTIDAD. El anillo de degrade en movimiento que ya se usa
// en DisplayCalled.jsx (avatar y "ahora suena") se reutiliza aca en el
// avatar Y en la portada del album para que la tarjeta se sienta parte de
// la misma familia visual, no una pieza aislada -- con una diferencia
// importante: aca el degrade queda FIJO (sin @keyframes), nunca animado,
// porque esta tarjeta se puede capturar como imagen en cualquier instante
// (ver lib/shareCard.js) y un anillo a mitad de una animacion infinita se
// veria distinto cada vez que alguien la descarga.
//
// LECCIONES DE HTML2CANVAS QUE NO HAY QUE ROMPER:
// 1. El numero de la nota va en color solido + text-shadow, nunca con la
//    tecnica de texto degradado (-webkit-background-clip: text) — sale
//    cortado/mal ubicado en la imagen final.
// 2. Los <img> tienen que estar cargados antes de capturar (ver
//    waitForImages en shareCard.js).
// 3. Ningun elemento visible usa animation infinita que dependa del
//    momento exacto de captura (ver nota del anillo, arriba) — la unica
//    animacion es la entrada (.share-card-in), que es finita y termina
//    mucho antes de que alguien alcance a tocar "Descargar".
//
// ARQUITECTURA "FRAME + TARJETA" (importante, no volver a la version vieja):
// Antes ".share-card" era un solo div con aspect-ratio 9:16 fijo Y
// overflow:hidden Y todo el contenido adentro. El problema: el contenido es
// de largo VARIABLE (nombres de cancion largos que ocupan 2 lineas,
// subpuntajes que aparecen o no, insignia de nivel opcional, etc). Cuando el
// contenido superaba el alto fijo disponible, "overflow:hidden" simplemente
// BORRABA lo que sobraba de la imagen final -- así fue como el pie de foto
// "retroke.cl" desaparecio por completo al compartir a Instagram con una
// cancion de titulo largo, aunque en la vista previa en vivo (antes de
// capturar) se viera perfecto.
//
// La solucion: separar en DOS capas.
//   .share-card-frame  -> el que se captura (la "ref"). Tiene el
//                          aspect-ratio 9:16 fijo, el fondo, el borde, y
//                          overflow:hidden SOLO para las decoraciones
//                          (scanlines/glow). Centra su contenido con flex.
//   .share-card         -> la tarjeta real, de ALTO AUTOMATICO (sin
//                          aspect-ratio ni overflow:hidden). Si el
//                          contenido es corto, queda centrada con espacio
//                          de sobra arriba/abajo (se ve bien, como
//                          respiro). Si por algun titulo larguisimo el
//                          contenido creciera mas de la cuenta, el recorte
//                          del frame quita un poco parejo arriba Y abajo
//                          (por el centrado), nunca borra el pie de foto
//                          completo como pasaba antes.
//
// SAFE ZONE para Instagram/TikTok/WhatsApp stories: Instagram y TikTok
// SIEMPRE dibujan su propia interfaz (usuario/hora arriba, caja de
// respuesta/reacciones abajo) ENCIMA de la imagen que se comparte, sin
// importar que haya dibujado ahi. El padding del frame (mas grande abajo
// que arriba) es justamente ese colchon para que esa interfaz nunca tape
// texto real de la tarjeta.
//
// QUE VERSION SE MUESTRA (Bar / DJ / Home) -- NO es un branching explicito
// por "mode": los tres bloques de resultado (Nota, Reacciones, Retroke
// Score) se muestran cada uno segun si SU DATO llego o no (mismo patron ya
// probado que usaba hasVocalScore). Nota final siempre existe si hubo algun
// dato real. Reacciones se muestra si reactionsCount es un numero (0 real
// incluido -- no se oculta un 0 real). Retroke Score solo existe cuando
// hubo analisis de voz por microfono, que solo pasa en Home -- por eso ese
// bloque aparece solo ahi, sin necesitar un "if (mode === 'HOME')" aparte.
// "mode" y "placeName" solo se usan para el chip de lugar (RETROKE BAR /
// DJ / HOME), que es puramente informativo.

const LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

const SUBSCORE_LABELS = [
  { key: 'pitchScore', label: 'Afinación' },
  { key: 'rhythmScore', label: 'Ritmo' },
  { key: 'stabilityScore', label: 'Estabilidad' },
  { key: 'energyScore', label: 'Energía' }
]

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
    subScores,
    levelName,
    achievementIcons,
    confidence,
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
  const activeSubScores = subScores
    ? SUBSCORE_LABELS.filter((s) => subScores[s.key] !== null && subScores[s.key] !== undefined)
    : []

  const resultColumns = [
    { key: 'nota', icon: '⭐', label: 'Nota Final', value: notaTxt, color: '#F4D03F', big: true },
    hasReactions && { key: 'reactions', icon: '🔥', label: 'Reacciones', value: String(reactionsCount), color: '#8B5CF6' },
    hasVocalScore && { key: 'retroke', icon: '🎤', label: 'Retroke Score', value: vocalScore + '/100', color: '#E91E8C' }
  ].filter(Boolean)

  const modeMeta = mode ? MODE_META[mode] : null
  const placeTxt = mode === 'HOME' ? 'En casa' : (placeName || null)
  const dateTxt = formatCardDate(createdAt)
  const hasModeChip = Boolean(modeMeta)

  return (
    <div ref={ref} className="share-card-frame">
      <style>{`
        .share-card-frame {
          width: 100%;
          max-width: 440px;
          aspect-ratio: 9 / 16;
          border-radius: 30px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 50% 0%, #33174d 0%, #14081f 55%, #05030a 100%);
          border: 2.5px solid #E91E8C;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 52px 22px 84px;
        }
        .share-card-frame::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px);
          pointer-events: none;
        }
        .share-card-frame::after {
          content: '';
          position: absolute;
          top: -40%;
          left: -20%;
          width: 140%;
          height: 55%;
          background: radial-gradient(ellipse at center, rgba(233,30,140,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .share-card {
          position: relative;
          z-index: 1;
          width: 100%;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .share-card-in {
          animation: shareCardIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes shareCardIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Cabecera: logo + kicker "Momento Retroke". El kicker es texto
           real (no decoracion), es el paso 2 de la jerarquia del brief
           (RETROKE -> MOMENTO/RESULTADO -> ...). */
        .share-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .share-card-logo {
          height: 30px;
          width: auto;
          object-fit: contain;
          flex-shrink: 0;
        }
        .share-card-kicker {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(244,208,79,0.85);
        }

        /* Identidad: avatar con el mismo anillo de degrade que el resto de
           la app, fijo (sin animacion) por la razon explicada arriba. */
        .share-card-avatar-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .share-card-avatar-glow {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(233,30,140,0.4) 0%, rgba(139,92,246,0.25) 55%, transparent 78%);
        }
        .share-card-avatar-ring {
          position: absolute;
          inset: 3px;
          border-radius: 9999px;
          padding: 3px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-position: 32% 50%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .share-card-avatar {
          position: relative;
          font-size: 44px;
          line-height: 1;
          filter: drop-shadow(0 0 14px rgba(233, 30, 140, 0.7));
        }
        .share-card-avatar-photo {
          position: relative;
          width: 76px;
          height: 76px;
          border-radius: 9999px;
          object-fit: cover;
          display: block;
        }
        .share-card-name {
          font-size: 21px;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          flex-shrink: 0;
        }
        .share-card-level {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.65);
          color: #F4D03F;
          background: rgba(244, 208, 79, 0.1);
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        /* Cancion + portada: la pieza que antes era una fila chica (46px)
           ahora es el segundo protagonista de la tarjeta, con el mismo
           anillo de degrade que el avatar (esquina redondeada en vez de
           circulo, igual tecnica que .called-track-art-ring en
           DisplayCalled.jsx). */
        .share-card-song-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          text-align: left;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .share-card-artwork-wrap {
          position: relative;
          width: 84px;
          height: 84px;
          flex-shrink: 0;
        }
        .share-card-artwork-ring {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 3px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-position: 68% 50%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .share-card-artwork {
          position: absolute;
          inset: 3px;
          width: calc(100% - 6px);
          height: calc(100% - 6px);
          border-radius: 15px;
          object-fit: cover;
          display: block;
        }
        .share-card-artwork-fallback {
          position: absolute;
          inset: 3px;
          width: calc(100% - 6px);
          height: calc(100% - 6px);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          background: linear-gradient(135deg, rgba(139,92,246,0.35), rgba(233,30,140,0.35));
        }
        .share-card-song-text {
          min-width: 0;
        }
        .share-card-song {
          font-size: 16.5px;
          font-weight: 700;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .share-card-artist {
          margin-top: 4px;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Resultados: columnas dinamicas (Nota siempre, Reacciones si hay
           dato, Retroke Score si hubo analisis de voz). La Nota es siempre
           la mas grande -- es EL resultado, lo demas es secundario. */
        .share-card-score-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 14px 13px;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9));
          border: 1.5px solid rgba(244,208,79,0.5);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .share-card-results-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .share-card-result-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .share-card-result-divider {
          width: 1px;
          align-self: stretch;
          margin: 0 4px;
          background: rgba(255,255,255,0.16);
        }
        .share-card-result-label {
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 3px;
          white-space: nowrap;
        }
        .share-card-result-value {
          font-weight: 700;
          line-height: 1.05;
        }
        .share-card-result-value.is-big {
          font-size: 46px;
        }
        .share-card-result-value.is-small {
          font-size: 22px;
        }
        .share-card-confidence {
          margin-top: 8px;
          font-size: 10.5px;
          color: rgba(255,255,255,0.5);
        }
        .share-card-subscores {
          width: 100%;
          display: flex;
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.14);
        }
        .share-card-subscore {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5px 2px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
        }
        .share-card-subscore-label {
          font-size: 8.5px;
          letter-spacing: 0.01em;
          color: rgba(255,255,255,0.6);
          white-space: nowrap;
        }
        .share-card-subscore-value {
          margin-top: 2px;
          font-size: 15px;
          font-weight: 700;
          color: #F4D03F;
        }

        /* Chip de modo/lugar + fecha. Puramente informativo, nunca decide
           que resultados mostrar (ver nota arriba). */
        .share-card-mode-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
          flex-shrink: 0;
        }
        .share-card-mode-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }
        .share-card-mode-sep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .share-card-mode-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .share-card-achievements {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }
        .share-card-achievement-icon {
          font-size: 19px;
          filter: drop-shadow(0 0 6px rgba(244, 208, 79, 0.5));
        }
        .share-card-footer {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          text-align: center;
          flex-shrink: 0;
        }
        .share-card-footer-sub {
          margin-top: 2px;
          font-size: 10px;
          color: rgba(255,255,255,0.45);
        }
      `}</style>

      <div className="share-card share-card-in">
        <div className="share-card-header">
          <img src={LOGO_SRC} alt="Retroke" className="share-card-logo" />
          <span className="share-card-kicker">Momento Retroke</span>
        </div>

        <div className="share-card-avatar-wrap">
          <div className="share-card-avatar-glow" />
          {photoUrl ? (
            <img src={photoUrl} alt={singerName || ''} className="share-card-avatar-photo" />
          ) : (
            <div className="share-card-avatar">{avatar || '🎤'}</div>
          )}
          <div className="share-card-avatar-ring" />
        </div>

        <div className="share-card-name">{singerName || 'Cantante Retroke'}</div>
        {levelName && <div className="share-card-level">🏅 {levelName}</div>}

        <div className="share-card-song-card">
          <div className="share-card-artwork-wrap">
            {artworkUrl ? (
              <img src={artworkUrl} alt="" className="share-card-artwork" />
            ) : (
              <div className="share-card-artwork-fallback">🎵</div>
            )}
            <div className="share-card-artwork-ring" />
          </div>
          <div className="share-card-song-text">
            <div className="share-card-song">{song || 'Canción'}</div>
            {artistName && <div className="share-card-artist">{artistName}</div>}
          </div>
        </div>

        <div className="share-card-score-box">
          <div className="share-card-results-row">
            {resultColumns.map((col, i) => (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', flex: col.big ? 1.15 : 1 }}>
                {i > 0 && <div className="share-card-result-divider" />}
                <div className="share-card-result-col">
                  <div className="share-card-result-label">{col.icon} {col.label}</div>
                  <div
                    className={'share-card-result-value ' + (col.big ? 'is-big' : 'is-small')}
                    style={{ color: col.color, textShadow: '0 0 18px ' + col.color + '80' }}
                  >
                    {col.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {confidence === 'baja' && (
            <div className="share-card-confidence">medición con señal limitada</div>
          )}
          {activeSubScores.length > 0 && (
            <div className="share-card-subscores">
              {activeSubScores.map((s) => (
                <div key={s.key} className="share-card-subscore">
                  <span className="share-card-subscore-label">{s.label}</span>
                  <span className="share-card-subscore-value">{subScores[s.key]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasModeChip && (
          <div className="share-card-mode-chip">
            <span className="share-card-mode-label">{modeMeta.icon} {modeMeta.label}</span>
            {placeTxt && (
              <>
                <span className="share-card-mode-sep" />
                <span className="share-card-mode-sub">{placeTxt}</span>
              </>
            )}
            {dateTxt && (
              <>
                <span className="share-card-mode-sep" />
                <span className="share-card-mode-sub">{dateTxt}</span>
              </>
            )}
          </div>
        )}

        {achievementIcons && achievementIcons.length > 0 && (
          <div className="share-card-achievements">
            {achievementIcons.map((icon, i) => (
              <span key={i} className="share-card-achievement-icon">{icon}</span>
            ))}
          </div>
        )}

        <div className="share-card-footer">
          El karaoke cambió para siempre.
          <div className="share-card-footer-sub">retroke.cl</div>
        </div>
      </div>
    </div>
  )
})

export default ShareResultCard
