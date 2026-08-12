import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateParticipant } from '../lib/participant'
import { getPeriodKey } from '../lib/gamification'
import { loadReceivedChallenges, loadSentChallenges } from '../lib/challenges'
import { WORLD_STYLES } from '../components/world/worldStyles'
import RetrokeSection from '../components/retroke/RetrokeSection'
import RetrokeEmptyState from '../components/retroke/RetrokeEmptyState'
import RetrokeSkeleton from '../components/retroke/RetrokeSkeleton'
import RetrokeIcon from '../components/retroke/RetrokeIcon'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'
import ShareButton from '../components/share/ShareButton'
import ShareModal from '../components/share/ShareModal'
import ShareChallengeCard from '../components/share/ShareChallengeCard'
import { useRetrokeFont } from '../lib/fonts'

// Fase 6 de Retroke World ("Misiones y Logros", ver
// retroke-world-diagnostico-tecnico.md). Reskin bento de esta pagina --
// misma logica y datos de siempre (Fase E.2 para misiones del sistema,
// Fase 5 para desafios 1 a 1). Fase 3 de "Retroke Visual System 2.0": ahora
// usa RetrokeSection/RetrokeEmptyState/RetrokeSkeleton + RETROKE_STYLES en
// vez de World*, mismo patron que /world y /ranking.

const PERIOD_LABEL = { weekly: 'Esta semana', monthly: 'Este mes', ongoing: 'Permanente' }

export default function Challenges() {
  useRetrokeFont()

  const [challenges, setChallenges] = useState(null)
  const [progressByCode, setProgressByCode] = useState({})
  const [hasParticipant, setHasParticipant] = useState(true)

  // Fase 5: desafios 1 a 1 entre cantantes ("te reto a superar mi nota"),
  // separados del catalogo fijo de arriba -- ver lib/challenges.js.
  const [receivedChallenges, setReceivedChallenges] = useState(null)
  const [sentChallenges, setSentChallenges] = useState(null)
  const [myBestScore, setMyBestScore] = useState(null)
  const [me, setMe] = useState(null) // Fase 14: nombre propio para armar la tarjeta de desafio

  // Fase 14 ("Viralidad"): null | { fromName, toName, targetScore, done }
  const [shareModal, setShareModal] = useState(null)
  const shareCardRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const participant = await getOrCreateParticipant(supabase)
      if (cancelled) return
      if (!participant) {
        setHasParticipant(false)
        setChallenges([])
        setReceivedChallenges([])
        setSentChallenges([])
        return
      }
      setMe(participant)

      const { data: challengeRows } = await supabase
        .from('challenges')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      if (cancelled) return
      const list = challengeRows || []
      setChallenges(list)

      if (list.length) {
        const periodKeys = list.map((c) => getPeriodKey(c.period))
        const { data: progressRows } = await supabase
          .from('participant_challenge_progress')
          .select('challenge_code, period_key, progress, completed_at')
          .eq('participant_id', participant.id)
          .in('period_key', Array.from(new Set(periodKeys)))
        if (cancelled) return

        const map = {}
        list.forEach((c, i) => {
          const key = periodKeys[i]
          const row = (progressRows || []).find((r) => r.challenge_code === c.code && r.period_key === key)
          map[c.code] = row || { progress: 0, completed_at: null }
        })
        setProgressByCode(map)
      }

      const [received, sent, statsResult] = await Promise.all([
        loadReceivedChallenges(supabase, participant.id),
        loadSentChallenges(supabase, participant.id),
        supabase.from('participant_stats').select('best_score').eq('participant_id', participant.id).maybeSingle()
      ])
      if (cancelled) return
      setReceivedChallenges(received)
      setSentChallenges(sent)
      setMyBestScore(statsResult.data && statsResult.data.best_score !== null && statsResult.data.best_score !== undefined ? Number(statsResult.data.best_score) : null)
    }

    load().catch(() => {
      if (!cancelled) {
        setChallenges([])
        setReceivedChallenges([])
        setSentChallenges([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="world-page">
      <style>{WORLD_STYLES}{RETROKE_STYLES}{`
        .world-page { background: var(--rk-bg-gradient); }
        .ms-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .ms-grid { grid-template-columns: repeat(2, 1fr); } }
        .ms-card { padding: 16px 18px; border-radius: var(--rk-radius-lg); background: var(--rk-surface); border: 1px solid var(--rk-border); }
        .ms-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .ms-icon { font-size: 26px; }
        .ms-title { font-size: 14px; font-weight: 700; }
        .ms-period { font-size: 10.5px; color: var(--rk-text-faint); margin-top: 1px; text-transform: uppercase; letter-spacing: 0.05em; }
        .ms-done-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: var(--rk-green); background: rgba(126,217,87,0.12); border-radius: var(--rk-radius-pill); padding: 4px 9px; white-space: nowrap; }
        .ms-desc { font-size: 12px; color: var(--rk-text-soft); margin-bottom: 10px; }
        .ms-track { height: 7px; border-radius: var(--rk-radius-pill); background: rgba(255,255,255,0.08); overflow: hidden; }
        .ms-fill { height: 100%; border-radius: var(--rk-radius-pill); }
        .ms-label { margin-top: 6px; font-size: 10.5px; color: var(--rk-text-soft); }

        .dc-subtitle { font-size: 11.5px; font-weight: 700; color: var(--rk-text-soft); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .dc-empty { font-size: 12.5px; color: var(--rk-text-faint); padding: 2px 0 4px; }
        .dc-link { color: var(--rk-yellow); text-decoration: underline; }
        .dc-list { display: flex; flex-direction: column; gap: 4px; }
        .dc-row { display: flex; align-items: center; gap: 10px; padding: 8px 2px; }
        .dc-avatar { font-size: 20px; flex-shrink: 0; }
        .dc-name { font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dc-meta { font-size: 11px; color: var(--rk-text-soft); margin-top: 1px; }
        .dc-badge-done { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: var(--rk-green); background: rgba(126,217,87,0.12); border-radius: var(--rk-radius-pill); padding: 4px 9px; white-space: nowrap; flex-shrink: 0; }
        .dc-badge-pending { font-size: 10.5px; font-weight: 700; color: var(--rk-text-soft); background: rgba(255,255,255,0.08); border-radius: var(--rk-radius-pill); padding: 4px 9px; white-space: nowrap; flex-shrink: 0; }
        .dc-share-btn { display: inline-flex; align-items: center; background: none; border: none; color: var(--rk-text-soft); cursor: pointer; padding: 2px 4px; flex-shrink: 0; }
      `}</style>

      <div className="world-inner">
        <header className="world-hero">
          <div className="world-hero-eyebrow">MISIONES Y DESAFÍOS</div>
          <h1 className="world-hero-title">Cumple metas, gana XP extra</h1>
          <p className="world-hero-subtitle">Misiones del sistema y desafíos entre cantantes, todo en un lugar.</p>
        </header>

        <RetrokeSection
          size="lg"
          accent="magenta"
          eyebrow="Misiones"
          title={<><RetrokeIcon name="target" size={16} glow /> Misiones Retroke</>}
          subtitle="Objetivos activos — se reinician cada semana o mes"
        >
          {challenges === null && <RetrokeSkeleton lines={3} />}
          {challenges !== null && challenges.length === 0 && (
            <RetrokeEmptyState
              icon={<RetrokeIcon name="target" size={26} />}
              message={hasParticipant ? 'No hay misiones activas por ahora.' : 'No pudimos identificar tu perfil en este dispositivo.'}
            />
          )}
          {challenges !== null && challenges.length > 0 && (
            <div className="ms-grid">
              {challenges.map((c) => {
                const p = progressByCode[c.code] || { progress: 0, completed_at: null }
                const pct = Math.min(100, Math.round((p.progress / c.target_value) * 100))
                const done = !!p.completed_at
                return (
                  <div key={c.code} className="ms-card">
                    <div className="ms-card-header">
                      <span className="ms-icon">{c.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ms-title">{c.title}</div>
                        <div className="ms-period">{PERIOD_LABEL[c.period] || c.period}</div>
                      </div>
                      {done && <span className="ms-done-badge"><RetrokeIcon name="check" size={10} /> Completado</span>}
                    </div>
                    <div className="ms-desc">{c.description}</div>
                    <div className="ms-track">
                      <div
                        className="ms-fill"
                        style={{
                          width: pct + '%',
                          background: done ? 'var(--rk-green)' : 'linear-gradient(90deg, var(--rk-magenta), var(--rk-purple))'
                        }}
                      />
                    </div>
                    <div className="ms-label">
                      {Math.min(p.progress, c.target_value)} / {c.target_value} · +{c.xp_reward} XP
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </RetrokeSection>

        {hasParticipant && (
          <RetrokeSection
            accent="yellow"
            eyebrow="1 a 1"
            title={<><RetrokeIcon name="fire" size={16} glow /> Desafíos entre cantantes</>}
            subtitle="Reta a alguien del Ranking Retroke a superar tu nota"
          >
            <div>
              <div className="dc-subtitle">Te desafiaron</div>
              {receivedChallenges === null && <RetrokeSkeleton lines={2} />}
              {receivedChallenges !== null && receivedChallenges.length === 0 && (
                <div className="dc-empty">Nadie te ha desafiado todavía.</div>
              )}
              {receivedChallenges !== null && receivedChallenges.length > 0 && (
                <div className="dc-list">
                  {receivedChallenges.map((r) => {
                    const done = myBestScore !== null && myBestScore >= Number(r.targetScore)
                    return (
                      <div key={r.id} className="dc-row">
                        <span className="dc-avatar">{r.fromAvatar}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dc-name">{r.fromName} te desafía</div>
                          <div className="dc-meta">Superar su nota: {r.targetScore}</div>
                        </div>
                        <span className={done ? 'dc-badge-done' : 'dc-badge-pending'}>{done ? <><RetrokeIcon name="check" size={10} /> Superado</> : 'Pendiente'}</span>
                        <button
                          type="button"
                          className="dc-share-btn"
                          onClick={() => setShareModal({
                            fromName: r.fromName,
                            toName: me ? (me.display_name || 'Cantante Retroke') : 'Cantante Retroke',
                            targetScore: r.targetScore,
                            done
                          })}
                        >
                          <RetrokeIcon name="share" size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 6 }}>
              <div className="dc-subtitle">Tus desafíos enviados</div>
              {sentChallenges === null && <RetrokeSkeleton lines={2} />}
              {sentChallenges !== null && sentChallenges.length === 0 && (
                <div className="dc-empty">
                  Aún no has desafiado a nadie. Ve al <Link to="/ranking" className="dc-link">Ranking Retroke</Link> y desafía a alguien a superar tu nota.
                </div>
              )}
              {sentChallenges !== null && sentChallenges.length > 0 && (
                <div className="dc-list">
                  {sentChallenges.map((s) => {
                    const done = s.toBestScore !== null && Number(s.toBestScore) >= Number(s.targetScore)
                    return (
                      <div key={s.id} className="dc-row">
                        <span className="dc-avatar">{s.toAvatar}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dc-name">Desafiaste a {s.toName}</div>
                          <div className="dc-meta">Superar tu nota: {s.targetScore}</div>
                        </div>
                        <span className={done ? 'dc-badge-done' : 'dc-badge-pending'}>{done ? <><RetrokeIcon name="check" size={10} /> Superado</> : 'Pendiente'}</span>
                        <button
                          type="button"
                          className="dc-share-btn"
                          onClick={() => setShareModal({
                            fromName: me ? (me.display_name || 'Cantante Retroke') : 'Cantante Retroke',
                            toName: s.toName,
                            targetScore: s.targetScore,
                            done
                          })}
                        >
                          <RetrokeIcon name="share" size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </RetrokeSection>
        )}

        <Link to="/world" className="world-footer-link">← Retroke World</Link>
      </div>

      {shareModal && (
        <ShareModal onClose={() => setShareModal(null)}>
          <ShareChallengeCard
            ref={shareCardRef}
            fromName={shareModal.fromName}
            toName={shareModal.toName}
            targetScore={shareModal.targetScore}
            done={shareModal.done}
          />
          <div className="share-modal-actions">
            <ShareButton
              mode="image"
              cardRef={shareCardRef}
              filename={'retroke-desafio.png'}
              title="Desafío Retroke"
              text={'🥊 ' + shareModal.fromName + ' desafió a ' + shareModal.toName + ' a superar ' + Number(shareModal.targetScore).toFixed(1) + ' en Retroke'}
            />
          </div>
        </ShareModal>
      )}
    </div>
  )
}
