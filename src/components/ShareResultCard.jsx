import { forwardRef, useEffect } from 'react'

// Tarjeta visual del resultado, retro-neon, pensada para verse bien tanto
// en la pagina publica /r/:id como convertida a imagen para compartir, y
// tambien incrustada en vivo en la pantalla de resultado del celular apenas
// termina de cantar. Reutiliza la misma paleta ya establecida en
// SessionHub.jsx y DisplayCalled.jsx.
//
// DOS LECCIONES DE HTML2CANVAS QUE NO HAY QUE ROMPER:
// 1. El numero de la nota va en color solido + text-shadow, nunca con la
//    tecnica de texto degradado (-webkit-background-clip: text) — sale
//    cortado/mal ubicado en la imagen final.
// 2. La tarjeta tiene una altura FIJA (aspect-ratio 9:16) con overflow
//    hidden para que encaje perfecto en una story. Eso significa que TODO
//    el contenido (logo, avatar, nombre, nivel, nota, retroke score,
//    desglose, cancion, logros, frase) tiene que entrar en ese alto fijo
//    sin que se corte. El layout de abajo esta calculado con harto margen
//    de sobra para que quepa siempre, incluso si una fuente carga un poco
//    mas alta de lo esperado. Si agregas mas contenido a futuro, revisa
//    que la suma de alturas siga entrando en los ~780px disponibles a
//    440px de ancho.
//
// SAFE ZONE para Instagram/TikTok/WhatsApp stories: aunque la imagen que
// generamos calza exacto en proporcion 9:16 con el formato de historia,
// Instagram y TikTok SIEMPRE dibujan su propia interfaz (usuario/hora
// arriba, caja de respuesta/reacciones abajo) ENCIMA de la imagen, sin
// importar que haya ahi dibujado. Si el contenido de la tarjeta llega hasta
// el borde justo, esa interfaz lo tapa (asi se veia el pie de foto y a
// veces la cancion, tapados por la caja de comentarios al ver la historia
// ya publicada). Por eso el padding superior e inferior de .share-card es
// bastante mas grande que lo que el contenido necesita — ese espacio extra
// (vacio, solo con el fondo/glow) es lo que evita que la UI de estas apps
// tape texto real.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'
const LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

function useCardFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-share-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-share-font', 'true')
    document.head.appendChild(link)
  }, [])
}

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
  useCardFont()

  const notaTxt = notaFinal !== null && notaFinal !== undefined ? notaFinal.toFixed(1) : '—'
  const hasVocalScore = vocalScore !== null && vocalScore !== undefined
  const activeSubScores = subScores
    ? SUBSCORE_LABELS.filter((s) => subScores[s.key] !== null && subScores[s.key] !== undefined)
    : []

  return (
    <div ref={ref} className="share-card">
      <style>{`
        .share-card {
          width: 100%;
          max-width: 440px;
          aspect-ratio: 9 / 16;
          border-radius: 30px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 50% 0%, #33174d 0%, #14081f 55%, #05030a 100%);
          border: 2.5px solid #E91E8C;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 11px;
          padding: 42px 24px 78px;
          box-sizing: border-box;
        }
        .share-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px);
          pointer-events: none;
        }
        .share-card::after {
          content: '';
          position: absolute;
          top: -40%;
          left: -20%;
          width: 140%;
          height: 55%;
          background: radial-gradient(ellipse at center, rgba(233,30,140,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .share-card-logo {
          height: 38px;
          width: auto;
          object-fit: contain;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .share-card-avatar-wrap {
          position: relative;
          width: 104px;
          height: 104px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .share-card-avatar-glow {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(233,30,140,0.35) 0%, rgba(139,92,246,0.22) 55%, transparent 78%);
        }
        .share-card-avatar-ring {
          position: absolute;
          inset: 5px;
          border-radius: 9999px;
          border: 2px solid rgba(244,208,79,0.55);
        }
        .share-card-avatar {
          position: relative;
          font-size: 54px;
          line-height: 1;
          filter: drop-shadow(0 0 14px rgba(233, 30, 140, 0.7));
        }
        .share-card-avatar-photo {
          position: relative;
          width: 90px;
          height: 90px;
          border-radius: 9999px;
          object-fit: cover;
          display: block;
        }
        .share-card-name {
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
          flex-shrink: 0;
        }
        .share-card-level {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 15px;
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
          padding: 14px 14px 12px;
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
          font-size: 56px;
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
          font-size: 28px;
          font-weight: 700;
          color: #E91E8C;
          line-height: 1.1;
        }
        .share-card-vocal-value span {
          font-size: 14px;
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
          margin-top: 10px;
          padding-top: 10px;
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
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          text-align: left;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .share-card-artwork {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.18);
        }
        .share-card-artwork-fallback {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.14);
        }
        .share-card-song-text {
          min-width: 0;
        }
        .share-card-song {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .share-card-artist {
          margin-top: 2px;
          font-size: 12px;
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
          font-size: 20px;
          filter: drop-shadow(0 0 6px rgba(244, 208, 79, 0.5));
        }
        .share-card-footer {
          margin-top: auto;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          text-align: center;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .share-card-footer-sub {
          margin-top: 2px;
          font-size: 10.5px;
          color: rgba(255,255,255,0.45);
        }
      `}</style>

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
  )
})

export default ShareResultCard
