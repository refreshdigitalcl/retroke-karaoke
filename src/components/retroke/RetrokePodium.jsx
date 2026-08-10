// Retroke Visual System 2.0 (Fase 2). Composicion de podio real para el
// Top 3 (punto 27 del prompt maestro) -- reemplaza la fila plana con
// emoji de medalla que hoy comparte el mismo look que cualquier otra fila
// de lista. entries: [{ rank, avatar, name, score }, ...] (1 a 3 items,
// rank = 1|2|3). El orden visual clasico es 2do-1ro-3ro; si solo hay 1 o 2
// entries se muestran en orden de rank nomas.
export default function RetrokePodium({ entries }) {
  var list = (entries || []).filter(Boolean).slice(0, 3)
  if (list.length === 0) return null

  var ordered = list.length === 3
    ? [list.find(function (e) { return e.rank === 2 }), list.find(function (e) { return e.rank === 1 }), list.find(function (e) { return e.rank === 3 })].filter(Boolean)
    : list

  return (
    <div className="rk-podium">
      {ordered.map(function (entry) {
        return (
          <div className={'rk-podium-slot rk-podium-slot-' + entry.rank} key={entry.rank}>
            <div className="rk-podium-avatar">{entry.avatar}</div>
            <div className="rk-podium-name">{entry.name}</div>
            <div className="rk-podium-score">{entry.score}</div>
            <div className="rk-podium-base">#{entry.rank}</div>
          </div>
        )
      })}
    </div>
  )
}
