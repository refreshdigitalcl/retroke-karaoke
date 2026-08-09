// Punto 46 del prompt maestro: nunca inventar datos. Cuando una seccion de
// World todavia no tiene suficiente actividad real para mostrar (comun al
// principio, con pocas salas activas), se usa esto en vez de datos falsos o
// de dejar la seccion vacia sin explicacion.

export default function WorldEmptyState(props) {
  return (
    <div className="world-empty">
      <div className="world-empty-icon">{props.icon || '✨'}</div>
      <p className="world-empty-text">{props.message}</p>
      {props.action}
    </div>
  )
}
