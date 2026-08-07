import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ShareResultCard from '../components/ShareResultCard'
import { buildShareUrl, buildShareText, shareResult, downloadCardAsImage } from '../lib/shareCard'

// Fase D: pagina publica (sin login) que muestra el resultado de una
// presentacion como tarjeta compartible. Pensada para que el link viaje por
// WhatsApp/Instagram y cualquiera que lo abra vea algo bonito, sin tener que
// entrar a una sala de Retroke. Usa las mismas politicas de lectura publica
// que ya existen para performances/participants/participant_stats.
export default function SharePerformance() {
  const { performanceId } = useParams()
  const [status, setStatus] = useState('loading') // loading | ready | notfound | error
  const [data, setData] = useState(null)
  const [shareState, setShareState] = useState('')
  const [downloadState, setDownloadState] = useState('')
  const cardRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const perfResult = await supabase
        .from('performances')
        .select('*')
        .eq('id', performanceId)
        .maybeSingle()

      if (cancelled) return
      const perf = perfResult.data
      if (!perf) {
        setStatus('notfound')
        return
      }

      let avatar = '🎤'
      let levelName = null
      let achievementIcons = []

      if (perf.participant_id) {
        const [participantResult, statsResult, achievementsResult] = await Promise.all([
          supabase.from('participants').select('avatar').eq('id', perf.participant_id).maybeSingle(),
          supabase.from('participant_stats').select('level_name').eq('participant_id', perf.participant_id).maybeSingle(),
          supabase
            .from('participant_achievements')
            .select('achievement_code, unlocked_at, achievements(icon)')
            .eq('participant_id', perf.participant_id)
            .order('unlocked_at', { ascending: false })
            .limit(4)
        ])
        if (cancelled) return
        if (participantResult.data && participantResult.data.avatar) avatar = participantResult.data.avatar
        if (statsResult.data) levelName = statsResult.data.level_name
        achievementIcons = (achievementsResult.data || [])
          .map((row) => (row.achievements ? row.achievements.icon : null))
          .filter(Boolean)
      }

      setData({
        singerName: perf.singer_name,
        song: perf.song,
        artistName: perf.artist_name,
        notaFinal: perf.nota_final,
        confidence: perf.vocal_confidence,
        avatar,
        levelName,
        achievementIcons
      })
      setStatus('ready')
    }

    load().catch(() => {
      if (!cancelled) setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [performanceId])

  async function handleShare() {
    const url = buildShareUrl(performanceId)
    const text = buildShareText(data)
    const result = await shareResult({ url, text, title: 'Mi resultado en Retroke' })
    if (result.method === 'copy') setShareState('Link copiado ✓')
    if (result.method === 'error') setShareState('No se pudo compartir')
    if (result.method === 'share') setShareState('')
    setTimeout(() => setShareState(''), 2500)
  }

  async function handleDownload() {
    setDownloadState('Generando...')
    const result = await downloadCardAsImage(cardRef.current, 'retroke-' + (data.singerName || 'resultado') + '.png')
    setDownloadState(result.error ? 'No se pudo generar la imagen' : 'Descargada ✓')
    setTimeout(() => setDownloadState(''), 2500)
  }

  return (
    <div style={styles.page}>
      {status === 'loading' && <div style={styles.message}>Cargando resultado...</div>}

      {status === 'notfound' && (
        <div style={styles.message}>
          No encontramos esta presentación.
          <div style={{ marginTop: 12 }}>
            <Link to="/inicio" style={styles.link}>Ir a Retroke</Link>
          </div>
        </div>
      )}

      {status === 'error' && <div style={styles.message}>Ocurrió un error cargando el resultado.</div>}

      {status === 'ready' && data && (
        <>
          <ShareResultCard ref={cardRef} {...data} />

          <div style={styles.actions}>
            <button onClick={handleShare} style={styles.buttonPrimary}>
              Compartir {shareState && '· ' + shareState}
            </button>
            <button onClick={handleDownload} style={styles.buttonSecondary}>
              Descargar tarjeta {downloadState && '· ' + downloadState}
            </button>
          </div>

          <Link to="/inicio" style={styles.link}>¿Qué es Retroke?</Link>
        </>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#05030a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    gap: 20
  },
  message: {
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 16,
    textAlign: 'center'
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  buttonPrimary: {
    padding: '12px 22px',
    borderRadius: 999,
    border: 'none',
    background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '12px 22px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'transparent',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer'
  },
  link: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textDecoration: 'underline'
  }
}
