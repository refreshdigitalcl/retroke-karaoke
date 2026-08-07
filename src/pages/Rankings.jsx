import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Fase E.1: rankings. Publica (sin login), en linea con el modelo de
// confianza abierto que ya usa toda la app. Dos secciones:
//  1) Ranking Retroke (global, por XP en participant_stats) — la meta-partida
//     entre salas, posible gracias a que la identidad de participante
//     (Fase B) es por dispositivo y no queda encerrada en un solo bar.
//  2) Ranking de esta sala (opcional, si la URL trae ?bar= o ?ws=) — mejor
//     nota final por participante dentro de esa sala/workspace, calculado a
//     partir de performances (Fase C.1/C.2), igual que ya se hace en
//     KaraokeSessionContext.loadSessionLeaderboard pero a traves del
//     historial completo en vez de una sola sesion.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'
const MEDALS = ['🥇', '🥈', '🥉']

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

export default function Rankings() {
  useRankingsFont()

  const [globalTop, setGlobalTop] = useState(null)
  const [venueTop, setVenueTop] = useState(null)
  const [venueName, setVenueName] = useState('')
  const [venueError, setVenueError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadGlobal() {
      const { data } = await supabase
        .from('participant_stats')
        .select('participant_id, xp, level, level_name, total_performances, best_score, participants(display_name, avatar)')
        .order('xp', { ascending: false })
        .limit(10)
      if (cancelled) return
      setGlobalTop(
        (data || []).map((row) => ({
          participantId: row.participant_id,
          name: (row.participants && row.participants.display_name) || 'Cantante Retroke',
          avatar: (row.participants && row.participants.avatar) || '🎤',
          xp: row.xp,
          levelName: row.level_name,
          totalPerformances: row.total_performances,
          bestScore: row.best_score
        }))
      )
    }

    async function loadVenue() {
      const barSlug = getParam('bar')
      const wsId = getParam('ws')
      if (!barSlug && !wsId) return

      let barId = null
      let workspaceId = null

      if (wsId) {
        const { data: ws } = await supabase.from('workspaces').select('id, name').eq('id', wsId).maybeSingle()
        if (cancelled) return
        if (!ws) { setVenueError(true); return }
        workspaceId = ws.id
        setVenueName(ws.name)
      } else {
        const { data: bar } = await supabase.from('bars').select('id, name').ilike('slug', barSlug).maybeSingle()
        if (cancelled) return
        if (!bar) { setVenueError(true); return }
        barId = bar.id
        setVenueName(bar.name)
      }

      let query = supabase
        .from('performances')
        .select('participant_id, singer_name, nota_final')
        .not('participant_id', 'is', null)
        .not('nota_final', 'is', null)
        .order('nota_final', { ascending: false })
        .limit(300)
      query = barId ? query.eq('bar_id', barId) : query.eq('workspace_id', workspaceId)
      const { data: perfRows } = await query
      if (cancelled) return

      const bestByParticipant = {}
      const order = []
      ;(perfRows || []).forEach((row) => {
        const existing = bestByParticipant[row.participant_id]
        if (!existing || row.nota_final > existing.notaFinal) {
          if (!existing) order.push(row.participant_id)
          bestByParticipant[row.participant_id] = {
            participantId: row.participant_id,
            name: row.singer_name,
            notaFinal: row.nota_final
          }
        }
      })
      const topIds = order
        .map((id) => bestByParticipant[id])
        .sort((a, b) => b.notaFinal - a.notaFinal)
        .slice(0, 10)

      if (topIds.length) {
        const { data: participantsData } = await supabase
          .from('participants')
          .select('id, avatar')
          .in('id', topIds.map((r) => r.participantId))
        if (cancelled) return
        const avatarById = {}
        ;(participantsData || []).forEach((p) => { avatarById[p.id] = p.avatar })
        setVenueTop(topIds.map((r) => ({ ...r, avatar: avatarById[r.participantId] || '🎤' })))
      } else {
        setVenueTop([])
      }
    }

    loadGlobal().catch(() => setGlobalTop([]))
    loadVenue().catch(() => setVenueError(true))

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={styles.page}>
      <style>{`
        .rk-title {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 700;
          background: linear-gradient(100deg, #fff 10%, #E91E8C 35%, #8B5CF6 60%, #F4D03F 85%, #fff 100%);
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rkShift 7s ease-in-out infinite;
        }
        @keyframes rkShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div style={styles.header}>
        <div className="rk-title" style={styles.mainTitle}>Rankings Retroke</div>
        <div style={styles.subtitle}>El karaoke cambió para siempre.</div>
      </div>

      <RankingSection title="🌎 Top Retroke" subtitle="Por experiencia acumulada, en todas las salas" rows={globalTop} mode="xp" />

      {(getParam('bar') || getParam('ws')) && (
        <RankingSection
          title={'📍 ' + (venueName || 'Esta sala')}
          subtitle="Mejores notas de esta sala"
          rows={venueError ? [] : venueTop}
          mode="nota"
        />
      )}

      <Link to="/inicio" style={styles.link}>← Volver a Retroke</Link>
    </div>
  )
}

function RankingSection({ title, subtitle, rows, mode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionSubtitle}>{subtitle}</div>

      {rows === null && <div style={styles.loading}>Cargando...</div>}
      {rows !== null && rows.length === 0 && <div style={styles.loading}>Todavía no hay datos suficientes.</div>}

      {rows !== null && rows.length > 0 && (
        <div style={styles.list}>
          {rows.map((row, i) => (
            <div key={row.participantId + i} style={styles.row}>
              <div style={styles.rowRank}>{MEDALS[i] || '#' + (i + 1)}</div>
              <div style={styles.rowAvatar}>{row.avatar}</div>
              <div style={styles.rowInfo}>
                <div style={styles.rowName}>{row.name}</div>
                {mode === 'xp' && row.levelName && <div style={styles.rowMeta}>{row.levelName} · {row.totalPerformances} presentaciones</div>}
              </div>
              <div style={styles.rowValue}>
                {mode === 'xp' ? row.xp + ' XP' : row.notaFinal.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      )}
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
    gap: 36
  },
  header: { textAlign: 'center' },
  mainTitle: { fontSize: 34 },
  subtitle: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  section: { width: '100%', maxWidth: 480 },
  sectionTitle: { fontSize: 18, fontWeight: 700 },
  sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2, marginBottom: 14 },
  loading: { fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '20px 0', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  rowRank: { width: 28, fontSize: 15, fontWeight: 700, textAlign: 'center' },
  rowAvatar: { fontSize: 26 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  rowValue: { fontSize: 15, fontWeight: 700, color: '#F4D03F' },
  link: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'underline' }
}
