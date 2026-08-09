import { forwardRef } from 'react'
import { ShareCardFrame, WCARD_LOGO_SRC } from './ShareCardFrame'

// Fase 14 -- tarjeta "estoy #X en el Ranking Retroke", compartible desde
// Perfil (solo cuando ya existe una posicion real, ver getGlobalXpRank en
// Profile.jsx -- nunca se inventa un numero para alguien sin stats).
const ShareRankCard = forwardRef(function ShareRankCard(props, ref) {
  return (
    <ShareCardFrame ref={ref}>
      <img src={WCARD_LOGO_SRC} alt="Retroke" className="wcard-logo" />

      <div className="wcard-avatar-wrap">
        <div className="wcard-avatar-glow" />
        <div className="wcard-avatar-ring" />
        {props.photoUrl ? (
          <img src={props.photoUrl} alt={props.name || ''} className="wcard-avatar-photo" />
        ) : (
          <div className="wcard-avatar">{props.avatar || '🎤'}</div>
        )}
      </div>

      <div className="wcard-name">{props.name || 'Cantante Retroke'}</div>
      {props.levelName && <div className="wcard-level">🏅 {props.levelName}</div>}

      <div className="wcard-box">
        <div className="wcard-box-label">🌎 Ranking Retroke</div>
        <div className="wcard-box-value">#{props.rank}</div>
        <div className="wcard-box-sub">de {props.total} cantantes · {props.xp} XP</div>
      </div>

      <div className="wcard-footer">
        El karaoke cambió para siempre.
        <div className="wcard-footer-sub">retroke.cl</div>
      </div>
    </ShareCardFrame>
  )
})

export default ShareRankCard
