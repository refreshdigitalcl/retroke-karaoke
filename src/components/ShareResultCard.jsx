import { forwardRef, useEffect } from 'react'

// Fase D: tarjeta visual del resultado, retro-neon, pensada para verse bien
// tanto en la pagina publica /r/:id como convertida a imagen para compartir.
// Reutiliza la misma paleta y tecnicas (scanlines, texto con degradado
// animado) ya establecidas en SessionHub.jsx y DisplayCalled.jsx.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'

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

const ShareResultCard = forwardRef(function ShareResultCard(
  { singerName, avatar, song, artistName, notaFinal, levelName, achievementIcons, confidence },
  ref
) {
  useCardFont()

  const notaTxt = notaFinal !== null && notaFinal !== undefined ? notaFinal.toFixed(1) : '—'

  return (
    <div ref={ref} className="share-card">
      <style>{`
        .share-card {
          width: 100%;
          max-width: 420px;
          aspect-ratio: 9 / 14;
          border-radius: 28px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 50% 0%, #2a1240 0%, #12081f 55%, #05030a 100%);
          border: 2px solid rgba(233, 30, 140, 0.55);
          box-shadow: 0 0 40px rgba(233, 30, 140, 0.35), 0 0 90px rgba(139, 92, 246, 0.25);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 34px 26px 26px;
          box-sizing: border-box;
        }
        .share-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px);
          pointer-events: none;
        }
        .share-card-brand {
          font-size: 13px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          font-weight: 600;
        }
        .share-card-avatar {
          font-size: 76px;
          line-height: 1;
          margin: 18px 0 6px;
          filter: drop-shadow(0 0 18px rgba(233, 30, 140, 0.6));
        }
        .share-card-name {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
        }
        .share-card-level {
          margin-top: 4px;
          font-size: 12px;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.6);
          color: #F4D03F;
          background: rgba(244, 208, 79, 0.08);
          letter-spacing: 0.04em;
        }
        .share-card-nota-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 22px 0;
        }
        .share-card-nota-label {
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 4px;
        }
        .share-card-nota {
          font-size: 84px;
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(100deg, #fff 8%, #E91E8C 34%, #8B5CF6 58%, #F4D03F 82%, #fff 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shareNotaShift 6s ease-in-out infinite;
        }
        @keyframes shareNotaShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .share-card-confidence {
          margin-top: 2px;
          font-size: 11px;
          color: rgba(255,255,255,0.45);
        }
        .share-card-song-card {
          width: 100%;
          text-align: center;
          padding: 16px 14px;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .share-card-song {
          font-size: 18px;
          font-weight: 700;
        }
        .share-card-artist {
          margin-top: 4px;
          font-size: 14px;
          color: rgba(255,255,255,0.6);
        }
        .share-card-achievements {
          margin-top: 16px;
          display: flex;
          gap: 10px;
        }
        .share-card-achievement-icon {
          font-size: 22px;
          filter: drop-shadow(0 0 6px rgba(244, 208, 79, 0.5));
        }
        .share-card-footer {
          margin-top: 22px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-align: center;
        }
        .share-card-footer-sub {
          margin-top: 2px;
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
      `}</style>

      <div className="share-card-brand">RETROKE</div>

      <div className="share-card-avatar">{avatar || '🎤'}</div>
      <div className="share-card-name">{singerName || 'Cantante Retroke'}</div>
      {levelName && <div className="share-card-level">{levelName}</div>}

      <div className="share-card-nota-wrap">
        <div className="share-card-nota-label">Nota Final</div>
        <div className="share-card-nota">{notaTxt}</div>
        {confidence === 'baja' && (
          <div className="share-card-confidence">medición con señal limitada</div>
        )}
      </div>

      <div className="share-card-song-card">
        <div className="share-card-song">{song || 'Canción'}</div>
        {artistName && <div className="share-card-artist">{artistName}</div>}
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
