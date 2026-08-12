import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveVenue, loadVenueRanking, loadVenueOverview, loadVenueNowPlaying } from '../lib/venue'
import { subscribeToTableFiltered } from '../lib/realtime'
import { useRetrokeFont } from '../lib/fonts'
import { WORLD_STYLES } from '../components/world/worldStyles'
import RetrokeSection from '../components/retroke/RetrokeSection'
import RetrokeEmptyState from '../components/retroke/RetrokeEmptyState'
import RetrokeSkeleton from '../components/retroke/RetrokeSkeleton'
import RetrokeIcon from '../components/retroke/RetrokeIcon'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'

// Fase 7 de Retroke World ("Escenarios", ver
// retroke-world-diagnostico-tecnico.md). Pagina dedicada por sala (bar
// fisico via ?bar=slug, o workspace sin local propio via ?ws=id -- mismo
// esquema de deep-link que usa toda la app). Distinto del preview en
// /world (que es una lista de todos los escenarios activos ahora) y de la
// pantalla en vivo en / (que es la pantalla del bar/TV) -- esta es la
// "ficha" publica de un escenario puntual: quien canta ahi, cuanto se ha
// cantado, y su propio ranking.
//
// Hoy la tabla bars tiene 0 filas en produccion (ver diagnostico), asi que
// esta pagina solo es alcanzable de verdad via ?ws= (por ejemplo el
// workspace Home/DJ de alguien) hasta que exista un local fisico cargado.
// La estructura queda lista para ese momento sin inventar datos mientras
// tanto.

function getParam(name) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function venueTypeLabel(venue) {
  if (venue.type === 'BAR') return venue.city || 'Escenario Retroke'
  if (venue.type === 'HOME') return 'Retroke Home'
  if (venue.type === 'DJ') return 'Retroke DJ'
  return 'Escenario Retroke'
}

function liveHref(venue) {
  if (venue.barId) return '/?bar=' + (venue.slug || '')
  if (venue.workspaceId) return '/?ws=' + venue.workspaceId
  return '/'
}

export default function Escenario() {
  useRetrokeFont()

  const barSlug = getParam('bar')
  const wsId = getParam('ws')

  const [venue, setVenue] = useState(undefined) // undefined = cargando, null = no encontrado
  const [overview, setOverview] = useState(null)
  const [nowPlaying, setNowPlaying] = useState(null)
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    let cancelled = false

    resolveVenue(supabase, { barSlug, wsId }).then((resolved) => {
      if (cancelled) return
      setVenue(resolved)
      if (!resolved) return

      loadVenueOverview(supabase, resolved).then((o) => { if (!cancelled) setOverview(o) })
      loadVenueNowPlaying(supabase, resolved).then((np) => { if (!cancelled) setNowPlaying(np) })
      loadVenueRanking(supabase, resolved).then((r) => { if (!cancelled) setRanking(r) })
    }).catch(() => {
      if (!cancelled) setVenue(null)
    })

    return () => { cancelled = true }
  }, [barSlug, wsId])

  // Fase 15 ("Tiempo real"): estado en vivo, quien esta cantando y el
  // ranking de este escenario se recargan solos apenas hay una sesion o
  // presentacion nueva en ESTA sala -- filtrado por bar_id/workspace_id
  // para no refetchear cuando cambia una sala distinta (ver
  // subscribeToTableFiltered en lib/realtime.js).
  useEffect(() => {
    if (!venue) return
    const column = venue.barId ? 'bar_id' : 'workspace_id'
    const value = venue.barId || venue.workspaceId
    const filter = column + '=eq.' + value

    function refetch() {
      loadVenueOverview(supabase, venue).then(setOverview)
      loadVenueNowPlaying(supabase, venue).then(setNowPlaying)
      loadVenueRanking(supabase, venue).then(setRanking)
    }

    const unsubSessions = subscribeToTableFiltered(supabase, 'escenario-sessions-' + value, 'sessions', filter, refetch)
    const unsubPerformances = subscribeToTableFiltered(supabase, 'escenario-performances-' + value, 'performances', filter, refetch)

    return () => {
      unsubSessions()
      unsubPerformances()
    }
  }, [venue])

  if (venue === null) {
    return (
      <div className="world-page">
        <style>{WORLD_STYLES}{RETROKE_STYLES}{`.world-page { background: var(--rk-bg-gradient); }`}</style>
        <div className="world-inner">
          <RetrokeEmptyState icon={<RetrokeIcon name="search" size={26} />} message="No encontramos este escenario." />
          <Link to="/world" className="world-footer-link">← Retroke World</Link>
        </div>
      </div>
    )
  }

  const rankingHref = barSlug ? '/ranking?bar=' + barSlug : '/ranking?ws=' + wsId

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}{RETROKE_STYLES}{`
        .world-page { background: var(--rk-bg-gradient); }
        .es-live-btn {
          display: inline-block; text-align: center; font-size: 13px; font-weight: 700; color: #05030a;
          padding: 10px 18px; border-radius: var(--rk-radius-pill); background: var(--rk-green); text-decoration: none;
        }
        .es-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .es-stat-box { text-align: center; padding: 12px 6px; border-radius: var(--rk-radius-md); background: var(--rk-surface); }
        .es-stat-value { font-family: var(--rk-font-display); font-size: 22px; font-weight: 800; color: var(--rk-yellow); }
        .es-stat-label { font-size: 10.5px; color: var(--rk-text-soft); margin-top: 3px; }
      `}</style>

      <div className="world-inner">
        <header className="world-hero">
          <div className="world-hero-eyebrow">ESCENARIO</div>
          <h1 className="world-hero-title">{venue === undefined ? 'Cargando…' : venue.name}</h1>
          {venue !== undefined && <p className="world-hero-subtitle">{venueTypeLabel(venue)}</p>}
        </header>

        {venue === undefined && <RetrokeSkeleton lines={4} />}

        {venue !== undefined && (
          <>
            <RetrokeSection
              size="lg"
              accent={overview && overview.isLiveNow ? 'green' : null}
              eyebrow={!overview ? 'Estado' : overview.isLiveNow ? 'En vivo' : 'Estado'}
              title={
                !overview ? (
                  'Revisando el escenario…'
                ) : overview.isLiveNow ? (
                  <span className="world-live-badge"><span className="world-live-dot" /> En vivo ahora</span>
                ) : (
                  <><RetrokeIcon name="moon" size={16} /> Sin actividad en este momento</>
                )
              }
            >
              {!overview && <RetrokeSkeleton lines={2} />}
              {overview && !overview.isLiveNow && (
                <RetrokeEmptyState icon={<RetrokeIcon name="moon" size={26} />} message="Este escenario no tiene una sesión activa ahora mismo." />
              )}
              {overview && overview.isLiveNow && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {nowPlaying && nowPlaying.singerName ? (
                    <div className="world-nowplaying-card">
                      <div className="world-nowplaying-art">
                        {nowPlaying.artworkUrl ? <img src={nowPlaying.artworkUrl} alt="" /> : <span>🎤</span>}
                      </div>
                      <div className="world-nowplaying-info">
                        <div className="world-nowplaying-name">{nowPlaying.singerName}</div>
                        <div className="world-nowplaying-song">
                          {nowPlaying.song}{nowPlaying.artistName ? ' · ' + nowPlaying.artistName : ''}
                        </div>
                      </div>
                      <div className="world-nowplaying-badge">EN ESCENA</div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Hay una sesión activa, esperando al próximo cantante.</p>
                  )}
                  <Link to={liveHref(venue)} className="es-live-btn">▶ Entrar en vivo</Link>
                </div>
              )}
            </RetrokeSection>

            <RetrokeSection accent="purple" eyebrow="Números" title={<><RetrokeIcon name="chart" size={16} glow /> Este escenario en números</>}>
              {!overview && <RetrokeSkeleton lines={2} />}
              {overview && (
                <div className="es-stat-grid">
                  <div className="es-stat-box">
                    <div className="es-stat-value">{overview.totalPerformances}</div>
                    <div className="es-stat-label">Presentaciones</div>
                  </div>
                  <div className="es-stat-box">
                    <div className="es-stat-value">{overview.distinctSingers}</div>
                    <div className="es-stat-label">Cantantes distintos</div>
                  </div>
                  <div className="es-stat-box">
                    <div className="es-stat-value">{overview.bestNota !== null ? Number(overview.bestNota).toFixed(1) : '—'}</div>
                    <div className="es-stat-label">Mejor nota</div>
                  </div>
                </div>
              )}
            </RetrokeSection>

            <RetrokeSection
              accent="yellow"
              eyebrow="Meta-partida local"
              title={<><RetrokeIcon name="trophy" size={16} glow /> Ranking de este escenario</>}
              action={<Link to={rankingHref} className="world-section-action">Ver todo →</Link>}
            >
              {ranking === null && <RetrokeSkeleton lines={3} />}
              {ranking !== null && ranking.length === 0 && (
                <RetrokeEmptyState icon={<RetrokeIcon name="trophy" size={26} />} message="Este escenario todavía no tiene presentaciones calificadas." />
              )}
              {ranking !== null && ranking.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ranking.slice(0, 5).map((row, i) => (
                    <div className="world-rank-row" key={row.participantId + i}>
                      <div className="world-rank-medal">{['🥇', '🥈', '🥉'][i] || '#' + (i + 1)}</div>
                      <div className="world-rank-avatar">{row.avatar}</div>
                      <div className="world-rank-info">
                        <div className="world-rank-name">{row.name}</div>
                      </div>
                      <div className="world-rank-xp">{row.primary}</div>
                    </div>
                  ))}
                </div>
              )}
            </RetrokeSection>
          </>
        )}

        <Link to="/world" className="world-footer-link">← Retroke World</Link>
      </div>
    </div>
  )
}
