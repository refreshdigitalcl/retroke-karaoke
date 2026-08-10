import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateParticipant } from '../lib/participant'
import { LEVELS, computeLevel } from '../lib/gamification'
import { getGlobalXpRank } from '../lib/ranking'
import { createFollow, deleteFollow, loadFollowCounts } from '../lib/follows'
import { loadStatuses, toggleReaction, REACTION_EMOJIS } from '../lib/statuses'
import { subscribeToTableFiltered, subscribeToTables } from '../lib/realtime'
import WorldSection from '../components/world/WorldSection'
import WorldEmptyState from '../components/world/WorldEmptyState'
import WorldSkeleton from '../components/world/WorldSkeleton'
import { WORLD_STYLES } from '../components/world/worldStyles'

// Fase 8 de Retroke World ("Seguir cantantes", ver
// retroke-world-diagnostico-tecnico.md). Perfil publico de lectura de
// CUALQUIER participante -- distinto de /perfil (que es tu propio perfil,
// con controles de edicion). Aca solo se lee: experiencia, logros e
// historial, todo con datos reales y publicos (mismas tablas que ya se
// muestran en /ranking y /world). El boton Seguir solo aparece si tanto
// quien mira como la persona del perfil tienen cuenta Google conectada
// (identidad estable, mismo criterio que los desafios 1 a 1 de Fase 5).

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'

function useProfileFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-publicprofile-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-publicprofile-font', 'true')
    document.head.appendChild(link)
  }, [])
}

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch (e) {
    return ''
  }
}

export default function PublicProfile() {
  useProfileFont()
  const { participantId } = useParams()

  const [target, setTarget] = useState(undefined) // undefined = cargando, null = no encontrado
  const [stats, setStats] = useState(null)
  const [rank, setRank] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [unlockedMap, setUnlockedMap] = useState({})
  const [performances, setPerformances] = useState([])
  const [counts, setCounts] = useState(null)

  const [viewer, setViewer] = useState(null) // { participantId, hasGoogle } | null
  const [isFollowing, setIsFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [followError, setFollowError] = useState(null)

  const [statuses, setStatuses] = useState(null)
  const [reactingId, setReactingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: p } = await supabase
        .from('participants')
        .select('id, display_name, avatar, photo_url, user_id, instagram_handle, show_instagram')
        .eq('id', participantId)
        .maybeSingle()
      if (cancelled) return
      if (!p) {
        setTarget(null)
        return
      }
      setTarget(p)

      const [statsResult, achievementsResult, unlockedResult, performancesResult, countsResult, statusesResult] = await Promise.all([
        supabase.from('participant_stats').select('*').eq('participant_id', p.id).maybeSingle(),
        supabase.from('achievements').select('*').order('sort_order', { ascending: true }),
        supabase.from('participant_achievements').select('achievement_code, unlocked_at').eq('participant_id', p.id),
        supabase.from('performances').select('id, song, artist_name, artwork_url, nota_final, created_at').eq('participant_id', p.id).order('created_at', { ascending: false }).limit(20),
        loadFollowCounts(supabase, p.id),
        loadStatuses(supabase, p.id, null)
      ])
      if (cancelled) return

      setStatuses(statusesResult)
      setStats(statsResult.data || null)
      if (statsResult.data) getGlobalXpRank(supabase, statsResult.data.xp).then((r) => { if (!cancelled) setRank(r) })
      setAchievements(achievementsResult.data || [])
      const map = {}
      ;(unlockedResult.data || []).forEach((row) => { map[row.achievement_code] = row.unlocked_at })
      setUnlockedMap(map)
      setPerformances(performancesResult.data || [])
      setCounts(countsResult)

      const myParticipant = await getOrCreateParticipant(supabase)
      if (cancelled || !myParticipant) return
      const hasGoogle = !!myParticipant.user_id
      setViewer({ participantId: myParticipant.id, hasGoogle })

      if (hasGoogle && myParticipant.id !== p.id) {
        const { data: existing } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_participant_id', myParticipant.id)
          .eq('following_participant_id', p.id)
          .maybeSingle()
        if (!cancelled) setIsFollowing(!!existing)
      }

      // Recarga los estados ahora que sabemos quien mira, para marcar cual
      // reaccion es la propia (myReaction) -- la primera carga de arriba no
      // podia saberlo todavia.
      loadStatuses(supabase, p.id, myParticipant.id).then((s) => { if (!cancelled) setStatuses(s) })
    }

    load().catch(() => { if (!cancelled) setTarget(null) })

    return () => { cancelled = true }
  }, [participantId])

  // Fase 15 ("Tiempo real"): nuevos estados de esta persona y nuevas
  // reacciones (de cualquiera, a cualquiera de sus estados) recargan la
  // lista sola, sin que quien esta mirando tenga que refrescar. Filtrado
  // por participant_id en `statuses` (solo lo que publica ESTA persona);
  // `status_reactions` no tiene esa columna (la reaccion apunta a un
  // status_id, no directo al dueno), asi que ese canal queda sin filtro --
  // volumen bajo, mismo criterio que el resto de World (ver diagnostico).
  useEffect(() => {
    if (!target) return
    const myId = viewer ? viewer.participantId : null

    function refetch() {
      loadStatuses(supabase, target.id, myId).then(setStatuses)
    }

    const unsubStatuses = subscribeToTableFiltered(supabase, 'pp-statuses-' + target.id, 'statuses', 'participant_id=eq.' + target.id, refetch)
    const unsubReactions = subscribeToTables(supabase, 'pp-reactions-' + target.id, ['status_reactions'], refetch)

    return () => {
      unsubStatuses()
      unsubReactions()
    }
  }, [target, viewer])

  async function handleToggleFollow() {
    if (!viewer || !target) return
    setFollowBusy(true)
    setFollowError(null)
    const result = isFollowing
      ? await deleteFollow(supabase, viewer.participantId, target.id)
      : await createFollow(supabase, viewer.participantId, target.id)
    setFollowBusy(false)
    if (result.error) {
      setFollowError('No se pudo actualizar. Intenta de nuevo.')
      return
    }
    setIsFollowing(!isFollowing)
    setCounts((prev) => prev ? { ...prev, followers: prev.followers + (isFollowing ? -1 : 1) } : prev)
  }

  async function handleReact(status, emoji) {
    if (!viewer || !viewer.hasGoogle) return
    setReactingId(status.id)
    const result = await toggleReaction(supabase, status.id, viewer.participantId, emoji, status.myReaction)
    setReactingId(null)
    if (result.error) return
    setStatuses((prev) => prev.map((s) => {
      if (s.id !== status.id) return s
      const counts = { ...s.reactionCounts }
      if (s.myReaction) counts[s.myReaction] = Math.max(0, (counts[s.myReaction] || 1) - 1)
      if (result.myReaction) counts[result.myReaction] = (counts[result.myReaction] || 0) + 1
      const total = Object.values(counts).reduce((a, b) => a + b, 0)
      return { ...s, reactionCounts: counts, totalReactions: total, myReaction: result.myReaction }
    }))
  }

  if (target === null) {
    return (
      <div className="world-page">
        <style>{WORLD_STYLES}</style>
        <div className="world-inner">
          <WorldEmptyState icon="🔍" message="No encontramos este perfil." />
          <Link to="/world" className="world-footer-link">← Retroke World</Link>
        </div>
      </div>
    )
  }

  const xp = stats ? stats.xp || 0 : 0
  const levelInfo = target ? computeLevel(xp) : null
  const levelIndex = levelInfo ? LEVELS.findIndex((l) => l.level === levelInfo.level) : -1
  const nextLevel = levelIndex >= 0 && levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null
  const xpProgressPct = !levelInfo ? 0 : !nextLevel ? 100 : Math.max(0, Math.min(100, Math.round(((xp - levelInfo.minXp) / (nextLevel.minXp - levelInfo.minXp)) * 100)))

  const canFollow = !!(viewer && viewer.hasGoogle && target && target.user_id && viewer.participantId !== target.id)
  const isOwnProfile = !!(viewer && target && viewer.participantId === target.id)

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}{`
        .pp-header { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .pp-avatar-wrap { width: 76px; height: 76px; border-radius: 9999px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 36px; background: rgba(233,30,140,0.15); border: 2px solid rgba(244,208,63,0.5); }
        .pp-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .pp-counts { display: flex; gap: 22px; }
        .pp-count-value { font-size: 17px; font-weight: 800; }
        .pp-count-label { font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 1px; }
        .pp-follow-btn {
          font-size: 13px; font-weight: 700; padding: 9px 22px; border-radius: 999px; border: none; cursor: pointer;
          background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff;
        }
        .pp-follow-btn.following { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.2); }
        .pp-follow-error { font-size: 11.5px; color: #FF6B6B; }
        .pp-achv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
        .pp-achv { border-radius: 14px; padding: 12px 8px; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
        .pp-achv.unlocked { border-color: rgba(244,208,63,0.4); background: linear-gradient(160deg, rgba(244,208,63,0.1), rgba(233,30,140,0.06)); }
        .pp-achv.locked { opacity: 0.4; filter: grayscale(0.6); }
        .pp-achv-icon { font-size: 20px; }
        .pp-achv-name { font-size: 11.5px; font-weight: 700; margin-top: 6px; }
        .pp-hist-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .pp-hist-row:last-child { border-bottom: none; }
        .pp-hist-song { font-weight: 700; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-hist-meta { font-size: 11.5px; color: rgba(255,255,255,0.5); }
        .pp-hist-nota { font-weight: 700; color: #F4D03F; flex-shrink: 0; }
        .pp-status-list { display: flex; flex-direction: column; gap: 10px; }
        .pp-status-card { padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
        .pp-status-text { font-size: 13.5px; line-height: 1.5; word-break: break-word; }
        .pp-status-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
        .pp-status-date { font-size: 10.5px; color: rgba(255,255,255,0.4); }
        .pp-status-reactions { display: flex; gap: 4px; flex-wrap: wrap; }
        .pp-reaction-btn {
          font-size: 12px; padding: 3px 7px; border-radius: 999px; cursor: pointer;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8);
        }
        .pp-reaction-btn.mine { background: rgba(244,208,63,0.15); border-color: rgba(244,208,63,0.5); }
        .pp-reaction-btn:disabled { cursor: default; opacity: 0.6; }
      `}</style>

      <div className="world-inner">
        {target === undefined && <WorldSkeleton lines={4} />}

        {target && (
          <>
            <div className="pp-header">
              <div className="pp-avatar-wrap">
                {target.photo_url ? <img src={target.photo_url} alt="" /> : (target.avatar || '🎤')}
              </div>
              <div>
                <h1 className="world-hero-title" style={{ fontSize: 26 }}>{target.display_name || 'Cantante Retroke'}</h1>
                <p className="world-hero-subtitle" style={{ marginTop: 2 }}>🏅 {levelInfo ? levelInfo.name : 'Novato del Micrófono'}</p>
                {target.show_instagram && target.instagram_handle && (
                  <a
                    href={'https://instagram.com/' + target.instagram_handle}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12.5, color: '#F4D03F', marginTop: 4, display: 'inline-block' }}
                  >
                    📷 @{target.instagram_handle}
                  </a>
                )}
              </div>

              <div className="pp-counts">
                <div>
                  <div className="pp-count-value">{counts ? counts.followers : '—'}</div>
                  <div className="pp-count-label">Seguidores</div>
                </div>
                <div>
                  <div className="pp-count-value">{counts ? counts.following : '—'}</div>
                  <div className="pp-count-label">Siguiendo</div>
                </div>
              </div>

              {isOwnProfile && (
                <Link to="/perfil" className="world-section-action">Ir a tu perfil para editar →</Link>
              )}
              {!isOwnProfile && canFollow && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button type="button" className={'pp-follow-btn' + (isFollowing ? ' following' : '')} onClick={handleToggleFollow} disabled={followBusy}>
                    {followBusy ? '...' : isFollowing ? '✓ Siguiendo' : '➕ Seguir'}
                  </button>
                  {followError && <span className="pp-follow-error">{followError}</span>}
                </div>
              )}
            </div>

            <WorldSection eyebrow="Estados" title="💬 Estados">
              {statuses === null && <WorldSkeleton lines={2} />}
              {statuses !== null && statuses.length === 0 && (
                <WorldEmptyState icon="💬" message="Todavía no ha publicado nada." />
              )}
              {statuses !== null && statuses.length > 0 && (
                <div className="pp-status-list">
                  {statuses.map((s) => (
                    <div key={s.id} className="pp-status-card">
                      <div className="pp-status-text">{s.text}</div>
                      <div className="pp-status-footer">
                        <span className="pp-status-date">{formatDate(s.createdAt)}</span>
                        <div className="pp-status-reactions">
                          {REACTION_EMOJIS.map((emoji) => {
                            const count = s.reactionCounts[emoji] || 0
                            const mine = s.myReaction === emoji
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={'pp-reaction-btn' + (mine ? ' mine' : '')}
                                onClick={() => handleReact(s, emoji)}
                                disabled={!viewer || !viewer.hasGoogle || reactingId === s.id}
                              >
                                {emoji}{count > 0 ? ' ' + count : ''}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorldSection>

            <WorldSection eyebrow="Experiencia" title="⭐ Su experiencia">
              <div className="world-xp-track">
                <div className="world-xp-fill" style={{ width: xpProgressPct + '%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, marginBottom: 14 }}>
                <span>{xp} XP{rank ? ' · #' + rank.rank + ' de ' + rank.total : ''}</span>
                <span>{nextLevel ? nextLevel.minXp + ' XP para ' + nextLevel.name : 'Nivel máximo 🎉'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{stats ? stats.total_performances || 0 : 0}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Presentaciones</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{stats && stats.best_score !== null && stats.best_score !== undefined ? stats.best_score : '—'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Mejor puntaje</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{stats ? stats.current_streak || 0 : 0} 🔥</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Racha actual</div>
                </div>
              </div>
            </WorldSection>

            <WorldSection eyebrow="Logros" title={'🏅 Logros · ' + Object.keys(unlockedMap).length + '/' + achievements.length}>
              {achievements.length === 0 && <WorldEmptyState icon="🏅" message="Aún no hay logros configurados." />}
              {achievements.length > 0 && (
                <div className="pp-achv-grid">
                  {achievements.map((a) => {
                    const unlockedAt = unlockedMap[a.code]
                    return (
                      <div key={a.code} className={'pp-achv' + (unlockedAt ? ' unlocked' : ' locked')} title={a.description || ''}>
                        <div className="pp-achv-icon">{a.icon || '🏅'}</div>
                        <div className="pp-achv-name">{a.name}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </WorldSection>

            <WorldSection eyebrow="Historial" title="🎵 Canciones interpretadas">
              {performances.length === 0 && <WorldEmptyState icon="🎤" message="Todavía no ha cantado." />}
              {performances.length > 0 && (
                <div>
                  {performances.map((p) => (
                    <div key={p.id} className="pp-hist-row">
                      <div className="world-nowplaying-art">
                        {p.artwork_url ? <img src={p.artwork_url} alt="" /> : <span>🎵</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pp-hist-song">{p.song || 'Canción'}</div>
                        <div className="pp-hist-meta">{p.artist_name ? p.artist_name + ' · ' : ''}{formatDate(p.created_at)}</div>
                      </div>
                      <div className="pp-hist-nota">{p.nota_final !== null && p.nota_final !== undefined ? Number(p.nota_final).toFixed(1) : '—'}</div>
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
