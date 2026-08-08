import { forwardRef, useEffect } from 'react'

// Tarjeta visual del resultado, retro-neon, pensada para verse bien tanto
// en la pagina publica /r/:id como convertida a imagen para compartir, y
// tambien incrustada en vivo en la pantalla de resultado del celular apenas
// termina de cantar. Reutiliza la misma paleta ya establecida en
// SessionHub.jsx y DisplayCalled.jsx.
//
// OJO con el numero de la nota: NO usar la tecnica de texto con degradado
// (-webkit-background-clip: text) aqui. Se ve genial en pantalla, pero
// html2canvas (la libreria que convierte esta tarjeta en imagen para
// compartir) no la soporta bien y el numero sale cortado/mal ubicado en la
// imagen final. Por eso el numero va en un color solido.

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
  const hasSubScores = subScores && SUBSCORE_LABELS.some((s) => subScores[s.key] !== null && subScores[s.key] !== undefined)

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
          justify-content: space-between;
          padding: 32px 26px 26px;
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
          height: 60%;
          background: radial-gradient(ellipse at center, rgba(233,30,140,0.25) 0%, transparent 70%);
          pointer-events: none;
        }
        .share-card-logo {
          height: 43px;
          width: auto;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }
        .share-card-avatar-wrap {
          position: relative;
          width: 118px;
          height: 118px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0 8px;
        }
        .share-card-avatar-glow {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(233,30,140,0.35) 0%, rgba(139,92,246,0.22) 55%, transparent 78%);
        }
        .share-card-avatar-ring {
          position: absolute;
          inset: 6px;
          border-radius: 9999px;
          border: 2px solid rgba(244,208,79,0.55);
        }
        .share-card-avatar {
          position: relative;
          font-size: 62px;
          line-height: 1;
          filter: drop-shadow(0 0 14px rgba(233, 30, 140, 0.7));
        }
        .share-card-avatar-photo {
          position: relative;
          width: 104px;
          height: 104px;
          border-radius: 9999px;
          object-fit: cover;
          display: block;
        }
        .share-card-name {
          font-size: 25px;
          font-weight: 700;
          text-align: center;
        }
        .share-card-level {
          margin-top: 6px;
          font-size: 12.5px;
          font-weight: 600;
          padding: 5px 16px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.65);
          color: #F4D03F;
          background: rgba(244, 208, 79, 0.1);
          letter-spacing: 0.03em;
        }
        .share-card-score-box {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 18px 0;
          padding: 18px 16px 16px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9));
          border: 1.5px solid rgba(244,208,79,0.55);
          box-sizing: border-box;
        }
        .share-card-nota-label {
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 2px;
        }
        .share-card-nota {
          font-size: 78px;
          font-weight: 700;
          line-height: 1.15;
          color: #F4D03F;
          text-shadow: 0 0 24px rgba(244,208,79,0.5);
        }
        .share-card-confidence {
          margin-top: 2px;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }
        .share-card-vocal-score {
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.02em;
        }
        .share-card-vocal-score b {
          color: #E91E8C;
        }
        .share-card-subscores {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.14);
        }
        .share-card-subscore {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
        }
        .share-card-subscore-label {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
        }
        .share-card-subscore-value {
          font-size: 13px;
          font-weight: 700;
          color: #F4D03F;
        }
        .share-card-song-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          text-align: left;
        }
        .share-card-artwork {
          width: 58px;
          height: 58px;
          border-radius: 11px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.18);
        }
        .share-card-artwork-fallback {
          width: 58px;
          height: 58px;
          border-radius: 11px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.14);
        }
        .share-card-song-text {
          min-width: 0;
        }
        .share-card-song {
          font-size: 17px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .share-card-artist {
          margin-top: 3px;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .share-card-achievements {
          margin-top: 14px;
          display: flex;
          gap: 10px;
        }
        .share-card-achievement-icon {
          font-size: 22px;
          filter: drop-shadow(0 0 6px rgba(244, 208, 79, 0.5));
        }
        .share-card-footer {
          margin-top: 18px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .share-card-footer-sub {
          margin-top: 2px;
          font-size: 11px;
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
        <div className="share-card-nota-label">⭐ Nota Final</div>
        <div className="share-card-nota">{notaTxt}</div>
        {confidence === 'baja' && (
          <div className="share-card-confidence">medición con señal limitada</div>
        )}
        {hasVocalScore && (
          <div className="share-card-vocal-score">Retroke Score <b>{vocalScore}/100</b></div>
        )}
        {hasSubScores && (
          <div className="share-card-subscores">
            {SUBSCORE_LABELS.map((s) => (
              subScores[s.key] !== null && subScores[s.key] !== undefined ? (
                <div key={s.key} className="share-card-subscore">
                  <span className="share-card-subscore-label">{s.label}</span>
                  <span className="share-card-subscore-value">{subScores[s.key]}</span>
                </div>
              ) : null
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
