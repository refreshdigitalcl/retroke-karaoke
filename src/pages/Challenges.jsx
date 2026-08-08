import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getOrCreateParticipant } from '../lib/participant'
import { getPeriodKey } from '../lib/gamification'

// Fase E.2: pagina publica de desafios. Usa la identidad liviana de
// participante (Fase B, por dispositivo) para mostrar "mi progreso" sin
// pedir login — el mismo modelo de confianza abierto que ya usa toda la
// app. El progreso real lo calcula y guarda el servidor (recordPerformance
// -> applyChallenges en KaraokeSessionContext); esta pantalla solo lee.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'

const PERIOD_LABEL = { weekly: 'Esta semana', monthly: 'Este mes', ongoing: 'Permanente' }

function useChallengesFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-challenges-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-challenges-font', 'true')
    document.head.appendChild(link)
  }, [])
}

export default function Challenges() {
  useChallengesFont()

  const [challenges, setChallenges] = useState(null)
  const [progressByCode, setProgressByCode] = useState({})
  const [hasParticipant, setHasParticipant] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const participant = await getOrCreateParticipant(supabase)
      if (cancelled) return
      if (!participant) {
        setHasParticipant(false)
        setChallenges([])
        return
      }

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
    }

    load().catch(() => {
      if (!cancelled) setChallenges([])
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={styles.page}>
      <style>{`
        .ch-title {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 700;
          background: linear-gradient(100deg, #fff 10%, #E91E8C 35%, #8B5CF6 60%, #F4D03F 85%, #fff 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: chShift 7s ease-in-out infinite;
        }
        @keyframes chShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div style={styles.header}>
        <div className="ch-title" style={styles.mainTitle}>Desafíos Retroke</div>
        <div style={styles.subtitle}>Cumple metas, gana XP extra.</div>
      </div>

      {challenges === null && <div style={styles.loading}>Cargando desafíos...</div>}

      {challenges !== null && challenges.length === 0 && (
        <div style={styles.loading}>
          {hasParticipant ? 'No hay desafíos activos por ahora.' : 'No pudimos identificar tu perfil en este dispositivo.'}
        </div>
      )}

      {challenges !== null && challenges.length > 0 && (
        <div style={styles.list}>
          {challenges.map((c) => {
            const p = progressByCode[c.code] || { progress: 0, completed_at: null }
            const pct = Math.min(100, Math.round((p.progress / c.target_value) * 100))
            const done = !!p.completed_at
            return (
              <div key={c.code} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardIcon}>{c.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.cardTitle}>{c.title}</div>
                    <div style={styles.cardPeriod}>{PERIOD_LABEL[c.period] || c.period}</div>
                  </div>
                  {done && <span style={styles.doneBadge}>Completado ✓</span>}
                </div>
                <div style={styles.cardDesc}>{c.description}</div>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: pct + '%',
                      background: done ? '#7ED957' : 'linear-gradient(90deg, #E91E8C, #8B5CF6)'
                    }}
                  />
                </div>
                <div style={styles.progressLabel}>
                  {Math.min(p.progress, c.target_value)} / {c.target_value} · +{c.xp_reward} XP
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link to="/inicio" style={styles.link}>← Volver a Retroke</Link>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 0%, #1a0b2e 0%, #0a0512 55%, #05030a 100%)',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    padding: '40px 18px 60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32
  },
  header: { textAlign: 'center' },
  mainTitle: { fontSize: 34 },
  subtitle: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  loading: { fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '20px 0', textAlign: 'center' },
  list: { width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 },
  card: {
    padding: '16px 18px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)'
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardIcon: { fontSize: 26 },
  cardTitle: { fontSize: 15, fontWeight: 700 },
  cardPeriod: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  doneBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#7ED957',
    background: 'rgba(126,217,87,0.12)',
    borderRadius: 999,
    padding: '4px 10px',
    whiteSpace: 'nowrap'
  },
  cardDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  progressTrack: { height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, transition: 'width 0.3s ease' },
  progressLabel: { marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  link: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'underline' }
}
