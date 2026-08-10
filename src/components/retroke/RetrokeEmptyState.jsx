// Retroke Visual System 2.0 (Fase 2). Evolucion de WorldEmptyState.jsx --
// mismos props (icon/message/action), pero con el icono con glow en vez de
// texto plano, y espacio explicito para un CTA (punto 41: los estados
// vacios deben invitar a algo, no solo informar). Nunca inventa datos --
// sigue siendo el mismo principio de honestidad de siempre.
export default function RetrokeEmptyState({ icon, message, action }) {
  return (
    <div className="rk-empty">
      <div className="rk-empty-icon">{icon || '✨'}</div>
      <p className="rk-empty-text">{message}</p>
      {action && <div className="rk-empty-action">{action}</div>}
    </div>
  )
}
