import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateParticipant } from '../lib/participant'
import { LEVELS, computeLevel } from '../lib/gamification'
import { getGlobalXpRank } from '../lib/ranking'
import WorldHero from '../components/world/WorldHero'
import WorldLive from '../components/world/WorldLive'
import WorldSection from '../components/world/WorldSection'
import WorldEmptyState from '../components/world/WorldEmptyState'
import WorldSkeleton from '../components/world/WorldSkeleton'
import { WORLD_STYLES } from '../components/world/worldStyles'

// RETROKE WORLD -- Fase 1 (Core), ver retroke-world-diagnostico-tecnico.md.
// Punto 46 del prompt maestro: nunca inventar datos. Todo lo que se ve aca
// sale de consultas reales a Supabase (sessions/reactions/participant_stats/
// challenges) -- cuando no hay suficiente actividad, se muestra un estado
// vacio explicito en vez de un numero o nombre falso.
//
// Publica (no requiere login), en linea con el modelo de confianza abierto
// que ya usa el resto de la app (Rankings.jsx, Challenges.jsx).

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&display=swap'
const LIVE_REFRESH_MS = 20000

function useWorldFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-world-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-world-font', 'true')
    document.head.appendChild(link)
  }, [])
}

// Mismo esquema de deep-link que ya usa toda la app (ver spaceParam en
// KaraokeSessionContext y SessionHub.jsx): con workspace_id se va directo a
// esa sala, con el slug del bar se arma /?bar=slug.
function scenarioHref(row) {
  if (row.bar_id && row.bars && row.bars.slug) return '/?bar=' + row.bars.slug
  if (row.workspace_id) return '/?ws=' + row.workspace_id
  return null
}

function venueLabel(row) {
  if (row.bars && row.bars.name) return row.bars.name
  if (row.workspaces && row.workspaces.name) return row.workspaces.name
  return 'Escenario Retroke'
}

function venueSubLabel(row) {
  if (row.bars && row.bars.city) return row.bars.city
  if (row.workspaces && row.workspaces.type === 'HOME') return 'Retroke Home'
  if (row.workspaces && row.workspaces.type === 'DJ') return 'Retroke DJ'
  return null
}

async function loadLiveSnapshot() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const nowPlayingSelect =
    'id,bar_id,workspace_id,' +
    'singerName:current_singer->>name,song:current_singer->>song,' +
    'artistName:current_singer->>artistName,artworkUrl:current_singer->>artworkUrl,' +
    'bars(name,city,slug),workspaces(name,type)'
  const scenariosSelect = 'id,bar_id,workspace_id,bars(name,city,slug),workspaces(name,type)'

  const [stagesRes, artistsRes, reactionsRes, nowPlayingRes, scenariosRes] = await Promise.all([
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'active').not('current_singer', 'is', null),
    supabase.from('reactions').select('id', { count: 'exact', head: true }).gte('created_at', oneHourAgo),
    supabase.from('sessions').select(nowPlayingSelect).eq('status', 'active').not('current_singer', 'is', null).order('started_at', { ascending: false }).limit(9),
    supabase.from('sessions').select(scenariosSelect).eq('status', 'active').order('started_at', { ascending: false }).limit(6)
  ])

  return {
    stats: {
      activeStages: stagesRes.count || 0,
      activeArtists: artistsRes.count || 0,
      recentReactions: reactionsRes.count || 0
    },
    nowPlaying: nowPlayingRes.data || [],
    scenarios: scenariosRes.data || []
  }
}

async function loadRankingTop() {
  const { data } = await supabase
    .from('participant_stats')
    .select('participant_id, xp, level_name, participants(display_name, avatar)')
    .order('xp', { ascending: false })
    .limit(3)
  return (data || []).map((row) => ({
    participantId: row.participant_id,
    name: (row.participants && row.participants.display_name) || 'Cantante Retroke',
    avatar: (row.participants && row.participants.avatar) || '🎤',
    xp: row.xp,
    levelName: row.level_name
  }))
}

async function loadActiveChallengesCount() {
  const { count } = await supabase.from('challenges').select('code', { count: 'exact', head: true }).eq('active', true)
  return count || 0
}

async function loadMyExperience() {
  const participant = await getOrCreateParticipant(supabase)
  if (!participant) return null
  const { data: stats } = await supabase
    .from('participant_stats')
    .select('xp, level_name, total_performances, current_streak, best_score')
    .eq('participant_id', participant.id)
    .maybeSingle()
  // Solo tiene sentido mostrar posicion si ya existe una fila real en
  // participant_stats -- alguien que nunca canto no es parte de la
  // poblacion ranqueada, y calcularle una posicion igual daba numeros
  // absurdos como "#5 de 4" (mas atras que el total de gente rankeada).
  const rank = stats ? await getGlobalXpRank(supabase, stats.xp) : null
  return { participant, stats: stats || null, rank }
}

function NowPlayingCard(props) {
  const row = props.row
  const href = scenarioHref(row)
  const content = (
    <div className="world-nowplaying-card">
      <div className="world-nowplaying-art">
        {row.artworkUrl ? <img src={row.artworkUrl} alt="" /> : <span>🎤</span>}
      </div>
      <div className="world-nowplaying-info">
        <div className="world-nowplaying-name">{row.singerName || 'Cantante Retroke'}</div>
        <div className="world-nowplaying-song">{row.song}{row.artistName ? ' · ' + row.artistName : ''}</div>
        <div className="world-nowplaying-venue">📍 {venueLabel(row)}{venueSubLabel(row) ? ' · ' + venueSubLabel(row) : ''}</div>
      </div>
      <div className="world-nowplaying-badge">EN ESCENA</div>
    </div>
  )
  return href ? <Link to={href} className="world-nowplaying-link">{content}</Link> : content
}

function ScenarioRow(props) {
  const row = props.row
  const href = scenarioHref(row)
  const inner = (
    <>
      <span className="world-scenario-dot" />
      <span className="world-scenario-name">{venueLabel(row)}</span>
      {venueSubLabel(row) && <span className="world-scenario-city">{venueSubLabel(row)}</span>}
      <span className="world-scenario-status">ACTIVO</span>
    </>
  )
  return href ? (
    <Link to={href} className="world-scenario-row world-scenario-row-link">{inner}</Link>
  ) : (
    <div className="world-scenario-row">{inner}</div>
  )
}

export default function World() {
  useWorldFont()

  const [live, setLive] = useState(null) // { stats, nowPlaying, scenarios }
  const [liveLoading, setLiveLoading] = useState(true)
  const [rankingTop, setRankingTop] = useState(null)
  const [challengesCount, setChallengesCount] = useState(null)
  const [experience, setExperience] = useState(undefined) // undefined = cargando, null = sin perfil

  const refreshLive = useRef(null)
  refreshLive.current = () => {
    loadLiveSnapshot()
      .then((snapshot) => {
        setLive(snapshot)
        setLiveLoading(false)
      })
      .catch(() => setLiveLoading(false))
  }

  useEffect(() => {
    refreshLive.current()
    const intervalId = setInterval(() => refreshLive.current(), LIVE_REFRESH_MS)

    const channel = supabase
      .channel('world-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => refreshLive.current())
      .subscribe()

    return () => {
      clearInterval(intervalId)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    loadRankingTop().then(setRankingTop).catch(() => setRankingTop([]))
    loadActiveChallengesCount().then(setChallengesCount).catch(() => setChallengesCount(0))
    loadMyExperience().then(setExperience).catch(() => setExperience(null))
  }, [])

  // OJO: "sin stats todavia" (participante identificado pero nunca canto)
  // NO es lo mismo que "sin participante" -- en el primer caso el nivel es
  // igual el inicial (Novato del Microfono, 0 XP), no "desconocido". Antes
  // esto devolvia null en ambos casos, lo que hacia que nextLevel tambien
  // diera null y la UI mostrara "Nivel maximo" para alguien con 0 XP.
  const levelInfo = experience ? computeLevel(experience.stats ? experience.stats.xp || 0 : 0) : null
  const levelIndex = levelInfo ? LEVELS.findIndex((l) => l.level === levelInfo.level) : -1
  const nextLevel = levelIndex >= 0 && levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null
  const xpProgressPct = !levelInfo
    ? 0
    : !nextLevel
      ? 100
      : Math.max(0, Math.min(100, Math.round((((experience.stats ? experience.stats.xp : 0) - levelInfo.minXp) / (nextLevel.minXp - levelInfo.minXp)) * 100)))

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}</style>

      <div className="world-inner">
        <WorldHero />
        <WorldLive stats={live ? live.stats : null} loading={liveLoading} />

        <div className="world-grid">
          <WorldSection
            size="lg"
            eyebrow="En vivo"
            title="🎤 Ahora en Retroke"
            subtitle="Quién está arriba del escenario en este momento"
          >
            {liveLoading && <WorldSkeleton lines={3} />}
            {!liveLoading && live && live.nowPlaying.length === 0 && (
              <WorldEmptyState
                icon="🌙"
                message="Nadie está cantando en este momento. Vuelve más tarde o revisa los escenarios activos más abajo."
              />
            )}
            {!liveLoading && live && live.nowPlaying.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                {live.nowPlaying.map((row) => (
                  <NowPlayingCard key={row.id} row={row} />
                ))}
              </div>
            )}
          </WorldSection>

          <WorldSection
            size="lg"
            eyebrow="Tu progreso"
            title="⭐ Tu Experiencia"
            action={<Link to="/perfil" className="world-section-action">Ver perfil completo →</Link>}
          >
            {experience === undefined && <WorldSkeleton lines={4} />}
            {experience === null && (
              <WorldEmptyState
                icon="🎤"
                message="Aún no identificamos tu perfil en este dispositivo. Anótate para cantar en cualquier sala y tu experiencia empieza a sumar sola."
              />
            )}
            {experience && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  {experience.participant.photo_url ? (
                    <img
                      src={experience.participant.photo_url}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 9999, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(244,208,63,0.5)' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 26, width: 44, height: 44, borderRadius: 9999, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(233,30,140,0.15)', border: '2px solid rgba(244,208,63,0.5)'
                      }}
                    >
                      {experience.participant.avatar || '🎤'}
                    </span>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {experience.participant.display_name || 'Cantante Retroke'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      🏅 {levelInfo ? levelInfo.name : 'Novato del Micrófono'}
                    </div>
                  </div>
                  {experience.rank && (
                    <span
                      style={{
                        fontSize: 12, fontWeight: 700, color: '#F4D03F',
                        background: 'rgba(244,208,63,0.12)', border: '1px solid rgba(244,208,63,0.4)',
                        borderRadius: 999, padding: '4px 11px', whiteSpace: 'nowrap'
                      }}
                    >
                      #{experience.rank.rank} de {experience.rank.total}
                    </span>
                  )}
                </div>

                <div className="world-xp-track">
                  <div className="world-xp-fill" style={{ width: xpProgressPct + '%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, marginBottom: 14 }}>
                  <span>{experience.stats ? experience.stats.xp || 0 : 0} XP</span>
                  <span>{nextLevel ? nextLevel.minXp + ' XP para ' + nextLevel.name : 'Nivel máximo 🎉'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{experience.stats ? experience.stats.total_performances || 0 : 0}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Presentaciones</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>
                      {experience.stats && experience.stats.best_score !== null && experience.stats.best_score !== undefined ? experience.stats.best_score : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Retroke Score</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{experience.stats ? experience.stats.current_streak || 0 : 0} 🔥</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Racha actual</div>
                  </div>
                </div>
              </div>
            )}
          </WorldSection>

          <WorldSection
            eyebrow="Meta-partida"
            title="🌎 Ranking Retroke"
            action={<Link to="/ranking" className="world-section-action">Ver todo →</Link>}
          >
            {rankingTop === null && <WorldSkeleton lines={3} />}
            {rankingTop !== null && rankingTop.length === 0 && (
              <WorldEmptyState icon="🏆" message="Tu ciudad todavía está comenzando a cantar. Invita a alguien y arranca el ranking." />
            )}
            {rankingTop !== null && rankingTop.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rankingTop.map((row, i) => (
                  <div className="world-rank-row" key={row.participantId + i}>
                    <div className="world-rank-medal">{['🥇', '🥈', '🥉'][i] || '#' + (i + 1)}</div>
                    <div className="world-rank-avatar">{row.avatar}</div>
                    <div className="world-rank-info">
                      <div className="world-rank-name">{row.name}</div>
                      <div className="world-rank-level">{row.levelName}</div>
                    </div>
                    <div className="world-rank-xp">{row.xp} XP</div>
                  </div>
                ))}
              </div>
            )}
          </WorldSection>

          <WorldSection
            eyebrow="Metas"
            title="🔥 Desafíos Retroke"
            size="sm"
            action={<Link to="/desafios" className="world-section-action">Ver →</Link>}
          >
            {challengesCount === null && <WorldSkeleton lines={1} />}
            {challengesCount !== null && (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#F4D03F' }}>{challengesCount}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {challengesCount === 1 ? 'desafío activo' : 'desafíos activos'}
                </div>
              </div>
            )}
          </WorldSection>

          <WorldSection
            eyebrow="Dónde cantar"
            title="🏟️ Escenarios"
            subtitle="Salas activas ahora mismo"
          >
            {liveLoading && <WorldSkeleton lines={3} />}
            {!liveLoading && live && live.scenarios.length === 0 && (
              <WorldEmptyState icon="🕯️" message="No hay escenarios activos en este momento." />
            )}
            {!liveLoading && live && live.scenarios.length > 0 && (
              <div>
                {live.scenarios.map((row) => (
                  <ScenarioRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </WorldSection>
        </div>

        <Link to="/inicio" className="world-footer-link">← Volver a Retroke</Link>
      </div>
    </div>
  )
}
