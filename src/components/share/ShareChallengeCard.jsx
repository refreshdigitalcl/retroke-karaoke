import { forwardRef } from 'react'
import { ShareCardFrame, WCARD_LOGO_SRC } from './ShareCardFrame'

// Fase 14 -- tarjeta de un desafio 1 a 1 (Fase 5), compartible tanto desde
// "te desafiaron" como desde "tus desafios enviados" en Challenges.jsx. Sin
// avatares de las dos personas para mantenerla simple -- los nombres y la
// nota a superar son el dato real que importa compartir.
const ShareChallengeCard = forwardRef(function ShareChallengeCard(props, ref) {
  const notaTxt = props.targetScore !== null && props.targetScore !== undefined ? Number(props.targetScore).toFixed(1) : '—'
  return (
    <ShareCardFrame ref={ref}>
      <img src={WCARD_LOGO_SRC} alt="Retroke" className="wcard-logo" />

      <div className="wcard-avatar-wrap">
        <div className="wcard-avatar-glow" />
        <div className="wcard-avatar-ring" />
        <div className="wcard-avatar">🥊</div>
      </div>

      <div className="wcard-name">{props.fromName}</div>
      <div className="wcard-vs">desafió a</div>
      <div className="wcard-name" style={{ fontSize: 18 }}>{props.toName}</div>

      <div className="wcard-box">
        <div className="wcard-box-label">🥊 Desafío Retroke</div>
        <div className="wcard-box-value">{notaTxt}</div>
        <div className="wcard-box-sub">nota a superar</div>
        {props.done && <div className="wcard-badge-done" style={{ marginTop: 4 }}>Superado ✓</div>}
      </div>

      <div className="wcard-footer">
        El karaoke cambió para siempre.
        <div className="wcard-footer-sub">retroke.cl</div>
      </div>
    </ShareCardFrame>
  )
})

export default ShareChallengeCard
