// Loader generico para bloques de World mientras se resuelve la consulta a
// Supabase -- evita el parpadeo de "0 escenarios activos" un instante antes
// de que llegue el numero real.

export default function WorldSkeleton(props) {
  var lines = props.lines || 2
  return (
    <div className="world-skeleton" aria-hidden="true">
      {Array.from({ length: lines }).map(function (_, i) {
        return <div key={i} className="world-skeleton-line" style={{ width: (i === lines - 1 ? 60 : 100 - i * 12) + '%' }} />
      })}
    </div>
  )
}
