import { forwardRef } from 'react'
import { ShareCardFrame, WCARD_LOGO_SRC } from './ShareCardFrame'

// Fase 14 -- tarjeta de logro desbloqueado, compartible desde la grilla de
// Logros en Perfil (solo aparece el boton en los que ya estan
// desbloqueados, ver unlockedMap en Profile.jsx).
const ShareAchievementCard = forwardRef(function ShareAchievementCard(props, ref) {
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
        <div className="wcard-box-label">🏆 Logro desbloqueado</div>
        <div className="wcard-box-value" style={{ fontSize: 46 }}>{props.icon || '🏅'}</div>
        <div className="wcard-box-sub" style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{props.achievementName}</div>
        {props.description && <div className="wcard-box-sub">{props.description}</div>}
      </div>

      <div className="wcard-footer">
        El karaoke cambió para siempre.
        <div className="wcard-footer-sub">retroke.cl</div>
      </div>
    </ShareCardFrame>
  )
})

export default ShareAchievementCard
