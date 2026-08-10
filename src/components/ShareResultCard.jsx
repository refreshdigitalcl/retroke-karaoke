import { forwardRef } from 'react'
import { useRetrokeFont } from '../lib/fonts'

// Tarjeta visual del resultado, retro-neon, pensada para verse bien tanto
// en la pagina publica /r/:id como convertida a imagen para compartir, y
// tambien incrustada en vivo en la pantalla de resultado del celular apenas
// termina de cantar. Reutiliza la misma paleta ya establecida en
// SessionHub.jsx y DisplayCalled.jsx.
//
// LECCIONES DE HTML2CANVAS QUE NO HAY QUE ROMPER:
// 1. El numero de la nota va en color solido + text-shadow, nunca con la
//    tecnica de texto degradado (-webkit-background-clip: text) — sale
//    cortado/mal ubicado en la imagen final.
// 2. Los <img> tienen que estar cargados antes de capturar (ver
//    waitForImages en shareCard.js).
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

const LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

const SUBSCORE_LABELS = [
  { key: 'pitchScore', label: 'Afinación' },
  { key: 'rhythmScore', label: 'Ritmo' },
  { key: 'stabilityScore', label: 'Estabilidad' },
  { key: 'energyScore', label: 'Energía' }
]

const ShareResultCard = forwardRef(function ShareResultCard(
  { singerName, avatar, photoUrl, song, artistName, artworkUrl, notaFinal, vocalScore, subScores, levelName, achievementIcons, confidence },
  ref
) {
  useRetrokeFont()

  const notaTxt = notaFinal !== null && notaFinal !== undefined ? notaFinal.toFixed(1) : '—'
  const hasVocalScore = vocalScore !== null && vocalScore !== undefined
  const activeSubScores = subScores
    ? SUBSCORE_LABELS.filter((s) => subScores[s.key] !== null && subScores[s.key] !== undefined)
    : []

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
          padding: 56px 22px 86px;
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
          gap: 9px;
        }
        .share-card-logo {
          height: 34px;
          width: auto;
          object-fit: contain;
          flex-shrink: 0;
        }
        .share-card-avatar-wrap {
          position: relative;
          width: 92px;
          height: 92px;
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
          inset: 4px;
          border-radius: 9999px;
          border: 2px solid rgba(244,208,79,0.6);
        }
        .share-card-avatar {
          position: relative;
          font-size: 48px;
          line-height: 1;
          filter: drop-shadow(0 0 14px rgba(233, 30, 140, 0.7));
        }
        .share-card-avatar-photo {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 9999px;
          object-fit: cover;
          display: block;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
        }
        .share-card-name {
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          flex-shrink: 0;
        }
        .share-card-level {
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.65);
          color: #F4D03F;
          background: rgba(244, 208, 79, 0.1);
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        .share-card-score-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 13px 14px 11px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9));
          border: 1.5px solid rgba(244,208,79,0.55);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .share-card-nota-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .share-card-nota-main {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .share-card-nota-label {
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: 2px;
        }
        .share-card-nota {
          font-size: 50px;
          font-weight: 700;
          line-height: 1.05;
          color: #F4D03F;
          text-shadow: 0 0 20px rgba(244,208,79,0.5);
        }
        .share-card-nota-divider {
          width: 1px;
          align-self: stretch;
          background: rgba(255,255,255,0.16);
        }
        .share-card-vocal-col {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .share-card-vocal-value {
          font-size: 26px;
          font-weight: 700;
          color: #E91E8C;
          line-height: 1.1;
        }
        .share-card-vocal-value span {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
        }
        .share-card-vocal-label {
          margin-top: 2px;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }
        .share-card-confidence {
          margin-top: 6px;
          font-size: 10.5px;
          color: rgba(255,255,255,0.5);
        }
        .share-card-subscores {
          width: 100%;
          display: flex;
          gap: 6px;
          margin-top: 9px;
          padding-top: 9px;
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
        .share-card-song-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          text-align: left;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .share-card-artwork {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.18);
        }
        .share-card-artwork-fallback {
          width: 46px;
          height: 46px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.14);
        }
        .share-card-song-text {
          min-width: 0;
        }
        .share-card-song {
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .share-card-artist {
          margin-top: 2px;
          font-size: 11.5px;
          color: rgba(255,255,255,0.65);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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

      <div className="share-card">
        <img src={LOGO_SRC} alt="Retroke" className="share-card-logo" />

        <div className="share-card-avatar-wrap">
          <div className="share-card-avatar-glow" />
          <div className="share-card-avatar-ring" />
          {photoUrl ? (
            <img src={photoUrl} alt={singerName || ''} className="share-card-avatar-photo" />
          ) : (
            <div className="share-card-avatar">{avatar || '🎤'}</div>
          )}
        </div>

        <div className="share-card-name">{singerName || 'Cantante Retroke'}</div>
        {levelName && <div className="share-card-level">🏅 {levelName}</div>}

        <div className="share-card-score-box">
          <div className="share-card-nota-row">
            <div className="share-card-nota-main">
              <div className="share-card-nota-label">⭐ Nota Final</div>
              <div className="share-card-nota">{notaTxt}</div>
            </div>
            {hasVocalScore && (
              <>
                <div className="share-card-nota-divider" />
                <div className="share-card-vocal-col">
                  <div className="share-card-vocal-value">{vocalScore}<span>/100</span></div>
                  <div className="share-card-vocal-label">Retroke Score</div>
                </div>
              </>
            )}
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

        <div className="share-card-song-card">
          {artworkUrl ? (
            <img src={artworkUrl} alt="" className="share-card-artwork" />
          ) : (
            <div className="share-card-artwork-fallback">🎵</div>
          )}
          <div className="share-card-song-text">
            <div className="share-card-song">{song || 'Canción'}</div>
            {artistName && <div className="share-card-artist">{artistName}</div>}
          </div>
        </div>

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
