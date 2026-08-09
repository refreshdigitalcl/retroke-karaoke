import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveVenue, loadVenueRanking, loadVenueOverview, loadVenueNowPlaying } from '../lib/venue'
import { getOrCreateParticipant } from '../lib/participant'
import { loadMyGoingStatus, setGoingStatus, loadGoingLists } from '../lib/going'
import WorldSection from '../components/world/WorldSection'
import WorldEmptyState from '../components/world/WorldEmptyState'
import WorldSkeleton from '../components/world/WorldSkeleton'
import { WORLD_STYLES } from '../components/world/worldStyles'

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

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'

function useEscenarioFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-escenario-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-escenario-font', 'true')
    document.head.appendChild(link)
  }, [])
}

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

// Fase 11: mismo patron de identidad liviana que loadViewerContext() en
// Rankings.jsx, pero sin necesitar el best_score (aca solo importa si hay
// Google conectado para poder marcar "voy"/"tal vez").
async function loadViewerContext() {
  const participant = await getOrCreateParticipant(supabase)
  if (!participant) return null
  return { participantId: participant.id, hasGoogle: !!participant.user_id }
}

export default function Escenario() {
  useEscenarioFont()

  const barSlug = getParam('bar')
  const wsId = getParam('ws')

  const [venue, setVenue] = useState(undefined) // undefined = cargando, null = no encontrado
  const [overview, setOverview] = useState(null)
  const [nowPlaying, setNowPlaying] = useState(null)
  const [ranking, setRanking] = useState(null)

  // Fase 11 ("Quien va"): viewer = identidad liviana de quien mira esta
  // pagina; goingLists = quienes marcaron voy/tal vez a este escenario;
  // myGoingStatus = el estado propio del viewer (null si no ha marcado nada).
  const [viewer, setViewer] = useState(undefined) // undefined = cargando, null = sin perfil
  const [goingLists, setGoingLists] = useState(null)
  const [myGoingStatus, setMyGoingStatus] = useState(null)
  const [savingGoing, setSavingGoing] = useState(false)

  useEffect(() => {
    let cancelled = false

    resolveVenue(supabase, { barSlug, wsId }).then((resolved) => {
      if (cancelled) return
      setVenue(resolved)
      if (!resolved) return

      loadVenueOverview(supabase, resolved).then((o) => { if (!cancelled) setOverview(o) })
      loadVenueNowPlaying(supabase, resolved).then((np) => { if (!cancelled) setNowPlaying(np) })
      loadVenueRanking(supabase, resolved).then((r) => { if (!cancelled) setRanking(r) })
      loadGoingLists(supabase, resolved).then((g) => { if (!cancelled) setGoingLists(g) })
    }).catch(() => {
      if (!cancelled) setVenue(null)
    })

    return () => { cancelled = true }
  }, [barSlug, wsId])

  useEffect(() => {
    let cancelled = false
    loadViewerContext().then((v) => { if (!cancelled) setViewer(v) }).catch(() => { if (!cancelled) setViewer(null) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!venue || !viewer || !viewer.hasGoogle) return
    let cancelled = false
    loadMyGoingStatus(supabase, viewer.participantId, venue).then((s) => { if (!cancelled) setMyGoingStatus(s) })
    return () => { cancelled = true }
  }, [venue, viewer])

  // Toggle optimista igual que Fase 8 (follow): actualiza el estado propio
  // antes de esperar la red y revierte si el toggle falla; si funciona,
  // vuelve a cargar las listas para que aparezca/desaparezca en Van/Tal vez.
  async function handleToggleGoing(status) {
    if (!viewer || !viewer.hasGoogle || !venue || savingGoing) return
    setSavingGoing(true)
    const prevStatus = myGoingStatus
    setMyGoingStatus(prevStatus === status ? null : status)
    const result = await setGoingStatus(supabase, viewer.participantId, venue, status)
    setSavingGoing(false)
    if (result.error) {
      setMyGoingStatus(prevStatus)
      return
    }
    setMyGoingStatus(result.status)
    loadGoingLists(supabase, venue).then((g) => setGoingLists(g))
  }

  if (venue === null) {
    return (
      <div className="world-page">
        <style>{WORLD_STYLES}</style>
        <div className="world-inner">
          <WorldEmptyState icon="🔍" message="No encontramos este escenario." />
          <Link to="/world" className="world-footer-link">← Retroke World</Link>
        </div>
      </div>
    )
  }

  const rankingHref = barSlug ? '/ranking?bar=' + barSlug : '/ranking?ws=' + wsId

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}{`
        .es-live-btn {
          display: inline-block; text-align: center; font-size: 13px; font-weight: 700; color: #05030a;
          padding: 10px 18px; border-radius: 999px; background: #7ED957; text-decoration: none;
        }
        .es-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .es-stat-box { text-align: center; padding: 12px 6px; border-radius: 14px; background: rgba(255,255,255,0.05); }
        .es-stat-value { font-size: 22px; font-weight: 800; color: #F4D03F; }
        .es-stat-label { font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 3px; }
        .qv-actions { display: flex; gap: 10px; margin-bottom: 14px; }
        .qv-btn {
          flex: 1; text-align: center; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.75);
          padding: 10px 14px; border-radius: 999px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); cursor: pointer;
        }
        .qv-btn.active { background: #7ED957; color: #05030a; border-color: #7ED957; }
        .qv-btn:disabled { opacity: 0.6; cursor: default; }
        .qv-group-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
        .qv-people { display: flex; flex-wrap: wrap; gap: 8px; }
        .qv-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.06); text-decoration: none; color: inherit; font-size: 12.5px; }
        .qv-chip-avatar { font-size: 14px; }
      `}</style>

      <div className="world-inner">
        <header className="world-hero">
          <div className="world-hero-eyebrow">ESCENARIO</div>
          <h1 className="world-hero-title">{venue === undefined ? 'Cargando…' : venue.name}</h1>
          {venue !== undefined && <p className="world-hero-subtitle">{venueTypeLabel(venue)}</p>}
        </header>

        {venue === undefined && <WorldSkeleton lines={4} />}

        {venue !== undefined && (
          <>
            <WorldSection
              size="lg"
              eyebrow={!overview ? 'Estado' : overview.isLiveNow ? 'En vivo' : 'Estado'}
              title={!overview ? 'Revisando el escenario…' : overview.isLiveNow ? '🔴 En vivo ahora' : '🌙 Sin actividad en este momento'}
            >
              {!overview && <WorldSkeleton lines={2} />}
              {overview && !overview.isLiveNow && (
                <WorldEmptyState icon="🕯️" message="Este escenario no tiene una sesión activa ahora mismo." />
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
            </WorldSection>

            <WorldSection eyebrow="Asistencia" title="🙋 Quién va">
              {viewer === undefined && <WorldSkeleton lines={2} />}
              {viewer === null && (
                <WorldEmptyState icon="🔒" message="Conecta tu cuenta de Google en tu perfil para marcar si vas." />
              )}
              {viewer && !viewer.hasGoogle && (
                <WorldEmptyState icon="🔒" message="Conecta tu cuenta de Google en tu perfil para marcar si vas." />
              )}
              {viewer && viewer.hasGoogle && (
                <div className="qv-actions">
                  <button
                    type="button"
                    className={'qv-btn' + (myGoingStatus === 'VOY' ? ' active' : '')}
                    disabled={savingGoing}
                    onClick={() => handleToggleGoing('VOY')}
                  >
                    ✅ Voy
                  </button>
                  <button
                    type="button"
                    className={'qv-btn' + (myGoingStatus === 'TAL_VEZ' ? ' active' : '')}
                    disabled={savingGoing}
                    onClick={() => handleToggleGoing('TAL_VEZ')}
                  >
                    🤔 Tal vez
                  </button>
                </div>
              )}

              {goingLists === null && <WorldSkeleton lines={2} />}
              {goingLists !== null && goingLists.voy.length === 0 && goingLists.talVez.length === 0 && (
                <WorldEmptyState icon="🙋" message="Todavía nadie confirmó asistencia a este escenario." />
              )}
              {goingLists !== null && (goingLists.voy.length > 0 || goingLists.talVez.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goingLists.voy.length > 0 && (
                    <div>
                      <div className="qv-group-label">Van ({goingLists.voy.length})</div>
                      <div className="qv-people">
                        {goingLists.voy.map((p) => (
                          <Link key={p.participantId} to={'/u/' + p.participantId} className="qv-chip">
                            <span className="qv-chip-avatar">{p.avatar}</span>
                            <span>{p.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {goingLists.talVez.length > 0 && (
                    <div>
                      <div className="qv-group-label">Tal vez ({goingLists.talVez.length})</div>
                      <div className="qv-people">
                        {goingLists.talVez.map((p) => (
                          <Link key={p.participantId} to={'/u/' + p.participantId} className="qv-chip">
                            <span className="qv-chip-avatar">{p.avatar}</span>
                            <span>{p.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </WorldSection>

            <WorldSection eyebrow="Números" title="📊 Este escenario en números">
              {!overview && <WorldSkeleton lines={2} />}
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
            </WorldSection>

            <WorldSection
              eyebrow="Meta-partida local"
              title="🏆 Ranking de este escenario"
              action={<Link to={rankingHref} className="world-section-action">Ver todo →</Link>}
            >
              {ranking === null && <WorldSkeleton lines={3} />}
              {ranking !== null && ranking.length === 0 && (
                <WorldEmptyState icon="🏆" message="Este escenario todavía no tiene presentaciones calificadas." />
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
            </WorldSection>
          </>
        )}

        <Link to="/world" className="world-footer-link">← Retroke World</Link>
      </div>
    </div>
  )
}
