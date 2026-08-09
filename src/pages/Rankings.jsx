import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateParticipant } from '../lib/participant'
import { createDirectChallenge } from '../lib/challenges'
import { loadFollowingIds, createFollow, deleteFollow } from '../lib/follows'
import { resolveVenue, loadVenueRanking as loadVenueRankingRows } from '../lib/venue'
import WorldSection from '../components/world/WorldSection'
import WorldEmptyState from '../components/world/WorldEmptyState'
import WorldSkeleton from '../components/world/WorldSkeleton'
import { WORLD_STYLES } from '../components/world/worldStyles'

// Fase 3 de Retroke World ("Rankings", ver retroke-world-diagnostico-tecnico.md).
// Evoluciona la version original (Fase E.1): mismo modelo de confianza
// abierto (publica, sin login) y las mismas dos fuentes de datos de
// siempre --
//   1) Ranking Retroke historico: por XP acumulado en participant_stats
//      (la meta-partida entre salas, de toda la vida del participante).
//   2) Ranking por periodo (nuevo): actividad real dentro de la ultima
//      semana/mes, calculada en vivo desde performances.created_at -- no
//      es un numero inventado, es lo que efectivamente paso en ese rango.
//   3) Ranking de esta sala (igual que antes, si la URL trae ?bar= o ?ws=).
//
// Filtro de ciudad: solo se muestra si existen 2+ ciudades reales con datos
// (bars.city). Hoy la tabla bars esta vacia en produccion, asi que el
// filtro simplemente no aparece -- queda listo para cuando haya locales
// reales con ciudad cargada, sin inventar opciones que no existen.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'
const MEDALS = ['🥇', '🥈', '🥉']

const TABS = [
  { key: 'historico', label: 'Histórico' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mes' }
]

function useRankingsFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-rankings-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-rankings-font', 'true')
    document.head.appendChild(link)
  }, [])
}

function getParam(name) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

async function loadHistoricalRanking() {
  const { data } = await supabase
    .from('participant_stats')
    .select('participant_id, xp, level_name, total_performances, participants(display_name, avatar, user_id)')
    .order('xp', { ascending: false })
    .limit(10)
  return (data || []).map((row) => ({
    participantId: row.participant_id,
    name: (row.participants && row.participants.display_name) || 'Cantante Retroke',
    avatar: (row.participants && row.participants.avatar) || '🎤',
    hasGoogle: !!(row.participants && row.participants.user_id),
    primary: (row.xp || 0) + ' XP',
    meta: row.level_name || null
  }))
}

// Ranking de actividad real en un rango de dias (7 = semana, 30 = mes),
// calculado desde performances -- no depende de participant_stats (que es
// acumulado historico), asi que refleja quien esta activo justo ahora,
// no quien acumulo mas XP hace meses.
async function loadPeriodRanking(days, city) {
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let barIds = null
  if (city) {
    const { data: barsData } = await supabase.from('bars').select('id').eq('city', city)
    barIds = (barsData || []).map((b) => b.id)
    if (!barIds.length) return []
  }

  let query = supabase
    .from('performances')
    .select('participant_id, nota_final, singer_name, bar_id')
    .not('participant_id', 'is', null)
    .gte('created_at', sinceIso)
  if (barIds) query = query.in('bar_id', barIds)

  const { data } = await query
  const rows = data || []
  const byParticipant = {}
  const order = []
  rows.forEach((r) => {
    if (!byParticipant[r.participant_id]) {
      byParticipant[r.participant_id] = { count: 0, bestNota: null, name: r.singer_name }
      order.push(r.participant_id)
    }
    const entry = byParticipant[r.participant_id]
    entry.count += 1
    if (r.nota_final !== null && r.nota_final !== undefined && (entry.bestNota === null || r.nota_final > entry.bestNota)) {
      entry.bestNota = r.nota_final
    }
  })

  if (!order.length) return []

  const { data: participantsData } = await supabase.from('participants').select('id, avatar, user_id').in('id', order)
  const avatarById = {}
  const hasGoogleById = {}
  ;(participantsData || []).forEach((p) => { avatarById[p.id] = p.avatar; hasGoogleById[p.id] = !!p.user_id })

  return order
    .sort((a, b) => {
      const diff = byParticipant[b].count - byParticipant[a].count
      if (diff !== 0) return diff
      return (byParticipant[b].bestNota || 0) - (byParticipant[a].bestNota || 0)
    })
    .slice(0, 10)
    .map((id) => ({
      participantId: id,
      name: byParticipant[id].name || 'Cantante Retroke',
      avatar: avatarById[id] || '🎤',
      hasGoogle: !!hasGoogleById[id],
      primary: byParticipant[id].count + (byParticipant[id].count === 1 ? ' presentación' : ' presentaciones'),
      meta: byParticipant[id].bestNota !== null ? 'Mejor nota: ' + byParticipant[id].bestNota.toFixed(1) : null
    }))
}

async function loadAvailableCities() {
  const { data } = await supabase.from('bars').select('city').not('city', 'is', null)
  const set = new Set((data || []).map((r) => r.city).filter(Boolean))
  return Array.from(set).sort()
}

// Fase 5: contexto de quien esta mirando el ranking, para poder ofrecerle
// el boton "Desafiar". Solo tiene sentido si tiene cuenta Google conectada
// (identidad estable, ver lib/challenges.js) y ya tiene una mejor nota real
// que defender -- si nunca canto, no hay nada que ofrecer de desafio.
async function loadViewerContext() {
  const participant = await getOrCreateParticipant(supabase)
  if (!participant) return null
  const hasGoogle = !!participant.user_id
  let bestScore = null
  if (hasGoogle) {
    const { data: stats } = await supabase
      .from('participant_stats')
      .select('best_score')
      .eq('participant_id', participant.id)
      .maybeSingle()
    bestScore = stats && stats.best_score !== null && stats.best_score !== undefined ? Number(stats.best_score) : null
  }
  return { participantId: participant.id, hasGoogle, bestScore }
}

// Fase 7: resolucion de sala y ranking de sala ahora viven en lib/venue.js
// (compartido con Escenario.jsx) -- esto solo adapta esa forma comun al
// shape que ya usaba esta pagina, sin repetir las consultas.
async function loadVenueRanking(barSlug, wsId) {
  const venue = await resolveVenue(supabase, { barSlug, wsId })
  if (!venue) return { error: true }
  const rows = await loadVenueRankingRows(supabase, venue)
  return { error: false, venue, venueName: venue.name, rows }
}

// Fase 5: boton "Desafiar" por fila -- solo aparece si quien mira (viewer)
// tiene cuenta Google + una mejor nota real, y la persona de la fila
// tambien tiene cuenta Google (si no, el desafio ni se podria ver despues,
// ver lib/challenges.js). Sin aceptar/rechazar: al confirmar se crea el
// desafio y aparece directo en "Desafios recibidos" de esa persona.
//
// Fase 8: boton "Seguir" al lado -- mismo criterio de Google en ambos
// lados. El nombre/avatar de cada fila ademas linkea al perfil publico
// (/u/:id, ver lib/follows.js y PublicProfile.jsx).
function RankingList(props) {
  const rows = props.rows
  const viewer = props.viewer
  const followingIds = props.followingIds
  const onToggleFollow = props.onToggleFollow
  const [confirmingId, setConfirmingId] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [sentIds, setSentIds] = useState({})
  const [errorId, setErrorId] = useState(null)
  const [followBusyId, setFollowBusyId] = useState(null)

  if (rows === null) return <WorldSkeleton lines={4} />
  if (rows.length === 0) return <WorldEmptyState icon="🏆" message={props.emptyMessage} />

  async function handleConfirm(row) {
    setSendingId(row.participantId)
    const result = await createDirectChallenge(supabase, viewer.participantId, row.participantId, viewer.bestScore)
    setSendingId(null)
    setConfirmingId(null)
    if (result.error) {
      setErrorId(row.participantId)
      setTimeout(() => setErrorId(null), 3000)
    } else {
      setSentIds((prev) => ({ ...prev, [row.participantId]: true }))
    }
  }

  async function handleToggleFollow(row) {
    setFollowBusyId(row.participantId)
    await onToggleFollow(row)
    setFollowBusyId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, i) => {
        const canChallenge = !!(
          viewer && viewer.hasGoogle && viewer.bestScore !== null &&
          row.hasGoogle && row.participantId !== viewer.participantId
        )
        const canFollow = !!(
          viewer && viewer.hasGoogle &&
          row.hasGoogle && row.participantId !== viewer.participantId
        )
        const isFollowing = followingIds && followingIds.has(row.participantId)
        return (
          <div key={row.participantId + i}>
            <div className="world-rank-row">
              <div className="world-rank-medal">{MEDALS[i] || '#' + (i + 1)}</div>
              <Link to={'/u/' + row.participantId} style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}>
                <div className="world-rank-avatar">{row.avatar}</div>
                <div className="world-rank-info">
                  <div className="world-rank-name">{row.name}</div>
                  {row.meta && <div className="world-rank-level">{row.meta}</div>}
                </div>
              </Link>
              <div className="world-rank-xp">{row.primary}</div>
            </div>

            {(canChallenge || canFollow) && (
              <div className="rk-challenge-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {canFollow && (
                  <button
                    type="button"
                    className={'rk-follow-btn' + (isFollowing ? ' following' : '')}
                    onClick={() => handleToggleFollow(row)}
                    disabled={followBusyId === row.participantId}
                  >
                    {followBusyId === row.participantId ? '...' : isFollowing ? '✓ Siguiendo' : '➕ Seguir'}
                  </button>
                )}

                {canChallenge && (
                  sentIds[row.participantId] ? (
                    <span className="rk-challenge-sent">Desafío enviado ✓</span>
                  ) : confirmingId === row.participantId ? (
                    <span className="rk-challenge-confirm">
                      ¿Retarlo a superar tu {viewer.bestScore}?
                      <button type="button" className="rk-challenge-yes" onClick={() => handleConfirm(row)} disabled={sendingId === row.participantId}>
                        {sendingId === row.participantId ? 'Enviando…' : 'Sí, desafiar'}
                      </button>
                      <button type="button" className="rk-challenge-no" onClick={() => setConfirmingId(null)}>Cancelar</button>
                    </span>
                  ) : (
                    <button type="button" className="rk-challenge-btn" onClick={() => setConfirmingId(row.participantId)}>
                      🥊 Desafiar a superar tu {viewer.bestScore}
                    </button>
                  )
                )}
                {errorId === row.participantId && <span className="rk-challenge-error">No se pudo enviar, intenta de nuevo.</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Rankings() {
  useRankingsFont()

  const [activeTab, setActiveTab] = useState('historico')
  const [activeCity, setActiveCity] = useState(null)
  const [cities, setCities] = useState([])
  const [rows, setRows] = useState(null)
  const [viewer, setViewer] = useState(null)
  const [followingIds, setFollowingIds] = useState(new Set())

  const barSlug = getParam('bar')
  const wsId = getParam('ws')
  const [venueState, setVenueState] = useState(null) // { error, venueName, rows } | null

  useEffect(() => {
    loadAvailableCities().then(setCities).catch(() => setCities([]))
    loadViewerContext().then((v) => {
      setViewer(v)
      if (v && v.hasGoogle) {
        loadFollowingIds(supabase, v.participantId).then(setFollowingIds)
      }
    }).catch(() => setViewer(null))
  }, [])

  // Fase 8: toggle optimista -- actualiza el set local antes de esperar la
  // red, y revierte si el insert/delete falla (RLS lo rechaza, sin
  // conexion, etc.).
  async function toggleFollow(row) {
    if (!viewer) return
    const already = followingIds.has(row.participantId)
    setFollowingIds((prev) => {
      const next = new Set(prev)
      if (already) next.delete(row.participantId)
      else next.add(row.participantId)
      return next
    })
    const result = already
      ? await deleteFollow(supabase, viewer.participantId, row.participantId)
      : await createFollow(supabase, viewer.participantId, row.participantId)
    if (result.error) {
      setFollowingIds((prev) => {
        const next = new Set(prev)
        if (already) next.add(row.participantId)
        else next.delete(row.participantId)
        return next
      })
    }
  }

  useEffect(() => {
    setRows(null)
    let cancelled = false
    const loader =
      activeTab === 'historico' ? loadHistoricalRanking() :
      loadPeriodRanking(activeTab === 'semana' ? 7 : 30, activeCity)
    loader
      .then((data) => { if (!cancelled) setRows(data) })
      .catch(() => { if (!cancelled) setRows([]) })
    return () => { cancelled = true }
  }, [activeTab, activeCity])

  useEffect(() => {
    if (!barSlug && !wsId) return
    let cancelled = false
    loadVenueRanking(barSlug, wsId)
      .then((result) => { if (!cancelled) setVenueState(result) })
      .catch(() => { if (!cancelled) setVenueState({ error: true }) })
    return () => { cancelled = true }
  }, [barSlug, wsId])

  const emptyMessages = {
    historico: 'Tu ciudad todavía está comenzando a cantar. Invita a alguien y arranca el ranking.',
    semana: 'Nadie ha cantado esta semana todavía.',
    mes: 'Nadie ha cantado este mes todavía.'
  }

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}{`
        .rk-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .rk-tab {
          font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 7px 14px; cursor: pointer;
        }
        .rk-tab-active { color: #fff; background: linear-gradient(90deg, #E91E8C, #8B5CF6); border-color: transparent; }
        .rk-city-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .rk-city-pill {
          font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px; padding: 5px 11px; cursor: pointer;
        }
        .rk-city-pill-active { color: #F4D03F; border-color: rgba(244,208,63,0.5); background: rgba(244,208,63,0.1); }

        .rk-challenge-row { padding: 2px 0 0 32px; margin-top: -2px; }
        .rk-challenge-btn {
          font-size: 11.5px; font-weight: 700; color: #F4D03F;
          background: rgba(244,208,63,0.1); border: 1px solid rgba(244,208,63,0.35);
          border-radius: 999px; padding: 5px 12px; cursor: pointer;
        }
        .rk-challenge-confirm { font-size: 11.5px; color: rgba(255,255,255,0.6); display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rk-challenge-yes {
          font-size: 11px; font-weight: 700; color: #05030a;
          background: #F4D03F; border: none; border-radius: 999px; padding: 4px 10px; cursor: pointer;
        }
        .rk-challenge-no {
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.55);
          background: none; border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; padding: 4px 10px; cursor: pointer;
        }
        .rk-challenge-sent { font-size: 11.5px; font-weight: 700; color: #7ED957; }
        .rk-challenge-error { font-size: 11px; color: #FF6B6B; margin-left: 8px; }

        .rk-follow-btn {
          font-size: 11.5px; font-weight: 700; color: #fff;
          background: linear-gradient(90deg, #E91E8C, #8B5CF6); border: none;
          border-radius: 999px; padding: 5px 12px; cursor: pointer;
        }
        .rk-follow-btn.following {
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="world-inner">
        <header className="world-hero">
          <div className="world-hero-eyebrow">RANKING RETROKE</div>
          <h1 className="world-hero-title">¿Dónde estás parado?</h1>
          <p className="world-hero-subtitle">El karaoke cambió para siempre.</p>
        </header>

        <WorldSection
          size="lg"
          eyebrow="Meta-partida"
          title="🌎 Top Retroke"
          subtitle={activeTab === 'historico' ? 'Por experiencia acumulada, en todas las salas' : 'Por actividad real en el período elegido'}
        >
          <div className="rk-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={'rk-tab' + (activeTab === t.key ? ' rk-tab-active' : '')}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab !== 'historico' && cities.length > 1 && (
            <div className="rk-city-pills">
              <button
                type="button"
                className={'rk-city-pill' + (!activeCity ? ' rk-city-pill-active' : '')}
                onClick={() => setActiveCity(null)}
              >
                Todas las ciudades
              </button>
              {cities.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={'rk-city-pill' + (activeCity === c ? ' rk-city-pill-active' : '')}
                  onClick={() => setActiveCity(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 4 }}>
            <RankingList rows={rows} emptyMessage={emptyMessages[activeTab]} viewer={viewer} followingIds={followingIds} onToggleFollow={toggleFollow} />
          </div>
        </WorldSection>

        {(barSlug || wsId) && (
          <WorldSection
            eyebrow="Esta sala"
            title={'📍 ' + (venueState && venueState.venueName ? venueState.venueName : 'Cargando sala...')}
            subtitle="Mejores notas de esta sala"
            action={
              venueState && !venueState.error ? (
                <Link
                  to={'/escenario' + (barSlug ? '?bar=' + barSlug : '?ws=' + wsId)}
                  className="world-section-action"
                >
                  Ver escenario →
                </Link>
              ) : null
            }
          >
            {!venueState && <WorldSkeleton lines={4} />}
            {venueState && venueState.error && <WorldEmptyState icon="🔍" message="No encontramos esta sala." />}
            {venueState && !venueState.error && (
              <RankingList rows={venueState.rows} emptyMessage="Esta sala todavía no tiene presentaciones calificadas." viewer={viewer} followingIds={followingIds} onToggleFollow={toggleFollow} />
            )}
          </WorldSection>
        )}

        <Link to="/world" className="world-footer-link">← Retroke World</Link>
      </div>
    </div>
  )
}
