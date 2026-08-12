import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RetrokeSection from '../retroke/RetrokeSection'
import RetrokeEmptyState from '../retroke/RetrokeEmptyState'
import RetrokeIcon from '../retroke/RetrokeIcon'

// Retroke Live -- seccion nueva y aislada para la grilla de World (Fase 4,
// MVP tecnico). Consulta y canal propios (`live_sessions`), no comparte
// estado con el resto de World.jsx. El CTA siempre dice "Ver en vivo",
// nunca "Entrar en vivo": lleva al visor de solo-lectura (/vivo/:id), jamas
// a /registro ni a la cola.
var WATCHABLE = ['starting', 'active', 'reconnecting', 'degraded', 'audio_only']

function venueName(row) {
  if (row.bars && row.bars.name) return row.bars.name
  if (row.workspaces && row.workspaces.name) return row.workspaces.name
  return 'Escenario Retroke'
}

function loadLiveNow() {
  return supabase
    .from('live_sessions')
    .select('id,status,current_singer,bar_id,workspace_id,bars(name,city),workspaces(name,type)')
    .in('status', WATCHABLE)
    .order('started_at', { ascending: false })
    .limit(6)
    .then(function (result) { return result.data || [] })
}

function LiveCard(props) {
  var row = props.row
  return (
    <Link to={'/vivo/' + row.id} className="rk-live-card">
      <span className="rk-live-card-pill"><span className="rk-live-card-dot" /> En vivo</span>
      <div className="rk-live-card-thumb">
        <RetrokeIcon name="camera" size={22} />
      </div>
      <div className="rk-live-card-venue">{venueName(row)}</div>
      {row.bars && row.bars.city && <div className="rk-live-card-city">{row.bars.city}</div>}
      {row.current_singer && (
        <div className="rk-live-card-singer">
          <RetrokeIcon name="mic" size={11} /> cantando: {row.current_singer}
        </div>
      )}
      <span className="rk-live-card-cta">Ver en vivo</span>
    </Link>
  )
}

export default function WorldLiveSection() {
  var liveNowState = useState(null) // null = cargando
  var liveNow = liveNowState[0]
  var setLiveNow = liveNowState[1]

  useEffect(function () {
    loadLiveNow().then(setLiveNow).catch(function () { setLiveNow([]) })

    var channel = supabase
      .channel('world-live-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, function () {
        loadLiveNow().then(setLiveNow).catch(function () {})
      })
      .subscribe()

    return function () { supabase.removeChannel(channel) }
  }, [])

  return (
    <RetrokeSection
      accent="magenta"
      eyebrow="Retroke Live"
      title={<><RetrokeIcon name="camera" size={16} glow /> En vivo ahora</>}
      subtitle="Mira la transmision de un bar o DJ en tiempo real -- solo espectador, no cola"
    >
      <style>{`
        .rk-live-card { display: block; text-decoration: none; color: #fff; position: relative; border-radius: 16px; padding: 14px; background: linear-gradient(180deg, rgba(233,30,140,0.1), rgba(139,92,246,0.05)); border: 1px solid rgba(233,30,140,0.35); }
        .rk-live-card-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #e91e8c; padding: 3px 9px; border-radius: 999px; margin-bottom: 10px; }
        .rk-live-card-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
        .rk-live-card-thumb { aspect-ratio: 16/9; border-radius: 10px; background: #0c0b10; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); margin-bottom: 10px; }
        .rk-live-card-venue { font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; font-size: 14px; }
        .rk-live-card-city { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        .rk-live-card-singer { font-size: 11px; color: #f4d03f; margin-top: 8px; display: flex; align-items: center; gap: 5px; }
        .rk-live-card-cta { display: block; margin-top: 12px; text-align: center; font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; font-size: 12px; padding: 8px; border-radius: 999px; background: #fff; color: #1a0b2e; }
      `}</style>

      {liveNow === null && (
        <RetrokeEmptyState icon={<RetrokeIcon name="camera" size={26} />} message="Cargando transmisiones en vivo..." />
      )}
      {liveNow !== null && liveNow.length === 0 && (
        <RetrokeEmptyState
          icon={<RetrokeIcon name="camera" size={26} />}
          message="Ningun local esta transmitiendo ahora. Cuando un bar o DJ active Retroke Live, va a aparecer aca."
        />
      )}
      {liveNow !== null && liveNow.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {liveNow.map(function (row) { return <LiveCard key={row.id} row={row} /> })}
        </div>
      )}
    </RetrokeSection>
  )
}
