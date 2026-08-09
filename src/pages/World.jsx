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
      <style>{`
        .world-page {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, #0a0512 55%, #05030a 100%);
          color: #fff;
          font-family: system-ui, sans-serif;
          padding: 44px 18px 80px;
        }
        .world-inner { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }

        .world-hero { text-align: center; max-width: 640px; margin: 0 auto; }
        .world-hero-eyebrow {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 0.22em;
          background: linear-gradient(100deg, #fff 10%, #E91E8C 35%, #8B5CF6 60%, #F4D03F 85%, #fff 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: worldShift 7s ease-in-out infinite;
        }
        .world-hero-title {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 5vw, 36px);
          margin-top: 10px;
          line-height: 1.15;
        }
        .world-hero-subtitle { margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.55); }
        @keyframes worldShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .world-live {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          padding: 18px 20px; border-radius: 20px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          max-width: 640px; margin: 0 auto; width: 100%;
        }
        .world-live-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #7ED957;
        }
        .world-live-dot {
          width: 8px; height: 8px; border-radius: 999px; background: #7ED957;
          box-shadow: 0 0 10px 2px rgba(126,217,87,0.8);
          animation: worldPulse 1.6s ease-in-out infinite;
        }
        @keyframes worldPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .world-live-stats { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
        .world-live-stat { text-align: center; }
        .world-live-stat-value { font-size: 24px; font-weight: 800; color: #F4D03F; }
        .world-live-stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        .world-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .world-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .world-grid { grid-template-columns: repeat(3, 1fr); } }

        .world-section {
          border-radius: 22px; padding: 20px;
          background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.1);
          display: flex; flex-direction: column; gap: 14px; min-width: 0;
        }
        .world-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .world-section-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase; }
        .world-section-title { font-size: 16px; font-weight: 700; margin-top: 2px; }
        .world-section-subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        .world-section-action { font-size: 12px; font-weight: 600; color: #8B5CF6; white-space: nowrap; text-decoration: none; }
        .world-section-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

        .world-empty { text-align: center; padding: 18px 8px; color: rgba(255,255,255,0.45); }
        .world-empty-icon { font-size: 26px; margin-bottom: 6px; }
        .world-empty-text { font-size: 13px; line-height: 1.5; }

        .world-skeleton { display: flex; flex-direction: column; gap: 8px; }
        .world-skeleton-line { height: 12px; border-radius: 999px; background: rgba(255,255,255,0.08); animation: worldSkeletonPulse 1.4s ease-in-out infinite; }
        @keyframes worldSkeletonPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

        .world-nowplaying-link { text-decoration: none; color: inherit; }
        .world-nowplaying-card {
          display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        }
        .world-nowplaying-art { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .world-nowplaying-art img { width: 100%; height: 100%; object-fit: cover; }
        .world-nowplaying-info { flex: 1; min-width: 0; }
        .world-nowplaying-name { font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .world-nowplaying-song { font-size: 11.5px; color: rgba(255,255,255,0.55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .world-nowplaying-venue { font-size: 10.5px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .world-nowplaying-badge { font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; color: #7ED957; background: rgba(126,217,87,0.12); border-radius: 999px; padding: 4px 8px; white-space: nowrap; flex-shrink: 0; }

        .world-scenario-row { display: flex; align-items: center; gap: 8px; padding: 8px 4px; text-decoration: none; color: inherit; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .world-scenario-row:last-child { border-bottom: none; }
        .world-scenario-row-link:hover { background: rgba(255,255,255,0.03); border-radius: 10px; }
        .world-scenario-dot { width: 7px; height: 7px; border-radius: 999px; background: #7ED957; flex-shrink: 0; }
        .world-scenario-name { font-size: 13px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .world-scenario-city { font-size: 11px; color: rgba(255,255,255,0.4); }
        .world-scenario-status { font-size: 9.5px; font-weight: 800; color: #7ED957; letter-spacing: 0.06em; }

        .world-rank-row { display: flex; align-items: center; gap: 10px; }
        .world-rank-medal { width: 22px; font-size: 14px; font-weight: 700; text-align: center; flex-shrink: 0; }
        .world-rank-avatar { font-size: 20px; flex-shrink: 0; }
        .world-rank-info { flex: 1; min-width: 0; }
        .world-rank-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .world-rank-level { font-size: 11px; color: rgba(255,255,255,0.45); }
        .world-rank-xp { font-size: 13px; font-weight: 700; color: #F4D03F; flex-shrink: 0; }

        .world-xp-track { width: 100%; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden; }
        .world-xp-fill { height: 100%; background: linear-gradient(90deg, #E91E8C, #8B5CF6); }

        .world-cta-btn {
          display: inline-block; text-align: center; font-size: 13px; font-weight: 700; color: #fff;
          padding: 10px 16px; border-radius: 12px;
          background: linear-gradient(90deg, #E91E8C, #8B5CF6); text-decoration: none;
        }

        .world-footer-link { text-align: center; color: rgba(255,255,255,0.45); font-size: 13px; text-decoration: underline; }
      `}</style>

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
