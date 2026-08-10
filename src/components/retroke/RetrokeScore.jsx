// Retroke Visual System 2.0 (Fase 2). El tratamiento de "numero importante"
// que hoy solo existe en DisplayResult.jsx (glow + color solido, nunca
// degradado -- la misma regla de html2canvas que ya se documento en
// ShareResultCard.jsx aplica aca tambien si algun dia esto se captura),
// reutilizable para XP, Score, nota y posicion de ranking en cualquier
// pantalla de World.
//
// size: 'hero' | 'lg' | 'md' | 'sm'
// color: 'magenta' | 'purple' | 'green' | 'yellow'
export default function RetrokeScore({ value, label, size = 'md', color = 'yellow', animate = false, className }) {
  return (
    <div className={'rk-score' + (animate ? ' rk-score-animate' : '') + (className ? ' ' + className : '')}>
      <div className={'rk-score-value rk-size-' + size + ' rk-glow-' + color}>{value}</div>
      {label && <div className="rk-score-label">{label}</div>}
    </div>
  )
}
