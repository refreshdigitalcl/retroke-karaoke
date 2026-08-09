import WorldSkeleton from './WorldSkeleton'

// "RETROKE LIVE" (punto 8 del prompt maestro): pulso de actividad real de
// toda la plataforma, no de una sola sala. Los numeros vienen de World.jsx
// (consultas directas a sessions/reactions), este componente solo los
// presenta. Si loading es true muestra skeleton; nunca inventa un numero
// mientras carga.

function LiveStat(props) {
  return (
    <div className="world-live-stat">
      <div className="world-live-stat-value">{props.loading ? '–' : props.value}</div>
      <div className="world-live-stat-label">{props.label}</div>
    </div>
  )
}

export default function WorldLive(props) {
  var loading = !!props.loading
  var stats = props.stats || { activeStages: 0, activeArtists: 0, recentReactions: 0 }

  return (
    <div className="world-live">
      <div className="world-live-badge">
        <span className="world-live-dot" />
        RETROKE LIVE
      </div>
      {loading ? (
        <WorldSkeleton lines={1} />
      ) : (
        <div className="world-live-stats">
          <LiveStat value={stats.activeStages} label={stats.activeStages === 1 ? 'escenario activo' : 'escenarios activos'} loading={loading} />
          <LiveStat value={stats.activeArtists} label={stats.activeArtists === 1 ? 'artista en escena' : 'artistas en escena'} loading={loading} />
          <LiveStat value={stats.recentReactions} label="reacciones (última hora)" loading={loading} />
        </div>
      )}
    </div>
  )
}
