import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ShareResultCard from '../components/ShareResultCard'
import { buildShareUrl, buildShareText, shareResult, downloadCardAsImage } from '../lib/shareCard'

// Pagina publica /r/:performanceId — el link que se comparte en redes.
// Muestra la misma tarjeta 9:16 que se ve en vivo en el celular del
// cantante, pero armada con los datos ya guardados en la base (asi que
// funciona aunque el que la abre no tenga sesion ni haya cantado nunca).

export default function SharePerformance() {
  const { performanceId } = useParams()
  const cardRef = useRef(null)
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [downloadState, setDownloadState] = useState('')

  useEffect(() => {
    if (!performanceId) return
    let cancelled = false

    async function load() {
      const { data: perf, error: perfError } = await supabase
        .from('performances')
        .select('*')
        .eq('id', performanceId)
        .maybeSingle()

      if (cancelled) return
      if (perfError || !perf) {
        setState({ loading: false, error: 'No encontramos este resultado.', data: null })
        return
      }

      let avatar = null
      let photoUrl = null
      let levelName = null
      let achievementIcons = []
      let subScores = null

      const lookups = await Promise.all([
        perf.participant_id
          ? supabase.from('participants').select('avatar').eq('id', perf.participant_id).maybeSingle()
          : Promise.resolve({ data: null }),
        perf.participant_id
          ? supabase.from('participant_stats').select('level_name').eq('participant_id', perf.participant_id).maybeSingle()
          : Promise.resolve({ data: null }),
        perf.participant_id
          ? supabase
              .from('participant_achievements')
              .select('achievements(icon)')
              .eq('participant_id', perf.participant_id)
              .order('unlocked_at', { ascending: false })
              .limit(4)
          : Promise.resolve({ data: [] }),
        perf.queue_entry_id
          ? supabase.from('queue_entries').select('photo').eq('id', perf.queue_entry_id).maybeSingle()
          : Promise.resolve({ data: null }),
        perf.queue_entry_id
          ? supabase
              .from('vocal_results')
              .select('pitch_score, rhythm_score, stability_score, energy_score')
              .eq('queue_entry_id', perf.queue_entry_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        perf.bar_id
          ? supabase.from('bars').select('slug').eq('id', perf.bar_id).maybeSingle()
          : Promise.resolve({ data: null })
      ])

      if (cancelled) return

      avatar = lookups[0].data ? lookups[0].data.avatar : null
      levelName = lookups[1].data ? lookups[1].data.level_name : null
      achievementIcons = (lookups[2].data || [])
        .map((row) => row.achievements && row.achievements.icon)
        .filter(Boolean)
      photoUrl = lookups[3].data ? lookups[3].data.photo : null
      subScores = lookups[4].data || null
      const barSlug = lookups[5].data ? lookups[5].data.slug : null

      // Mismo esquema de deep-link que usa el resto de la app (ver
      // spaceParam en KaraokeSessionContext): con workspace_id vamos directo
      // al formulario de ese workspace (?ws=...), con bar_id resolvemos el
      // slug del bar (?bar=...). Si no hay ninguno, cae al /registro
      // generico (bar por defecto).
      let registerHref = '/registro'
      if (perf.workspace_id) {
        registerHref = '/registro?ws=' + perf.workspace_id
      } else if (barSlug) {
        registerHref = '/registro?bar=' + barSlug
      }

      setState({
        loading: false,
        error: '',
        data: {
          singerName: perf.singer_name,
          song: perf.song,
          artistName: perf.artist_name,
          artworkUrl: perf.artwork_url,
          notaFinal: perf.nota_final !== null && perf.nota_final !== undefined ? Number(perf.nota_final) : null,
          vocalScore: perf.vocal_score,
          confidence: perf.vocal_confidence,
          avatar,
          photoUrl,
          levelName,
          achievementIcons,
          subScores,
          registerHref
        }
      })
    }

    load()
    return () => { cancelled = true }
  }, [performanceId])

  function handleDownload() {
    setDownloadState('Generando...')
    downloadCardAsImage(cardRef.current, 'retroke-' + (state.data ? state.data.singerName || 'resultado' : 'resultado') + '.png')
      .then((result) => {
        setDownloadState(result && result.error ? 'No se pudo descargar' : 'Descargada ✓')
        setTimeout(() => setDownloadState(''), 2500)
      })
  }

  function handleShareLink() {
    if (!state.data) return
    shareResult({
      performanceId,
      song: state.data.song,
      artistName: state.data.artistName,
      notaFinal: state.data.notaFinal
    })
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)', color: '#fff' }}>
        Cargando resultado...
      </div>
    )
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'var(--bg-page)', color: '#fff' }}>
        <p>{state.error || 'No encontramos este resultado.'}</p>
        <Link to="/registro" className="underline">Ir a Retroke</Link>
      </div>
    )
  }

  const d = state.data

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 gap-5" style={{ background: 'var(--bg-page)' }}>
      <ShareResultCard
        ref={cardRef}
        singerName={d.singerName}
        avatar={d.avatar}
        photoUrl={d.photoUrl}
        song={d.song}
        artistName={d.artistName}
        artworkUrl={d.artworkUrl}
        notaFinal={d.notaFinal}
        vocalScore={d.vocalScore}
        subScores={d.subScores ? {
          pitchScore: d.subScores.pitch_score,
          rhythmScore: d.subScores.rhythm_score,
          stabilityScore: d.subScores.stability_score,
          energyScore: d.subScores.energy_score
        } : null}
        confidence={d.confidence}
        levelName={d.levelName}
        achievementIcons={d.achievementIcons}
      />
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full h-12 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
        >
          Descargar tarjeta {downloadState && '· ' + downloadState}
        </button>
        <button
          type="button"
          onClick={handleShareLink}
          className="w-full h-12 rounded-xl font-bold"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Compartir link
        </button>
        <Link to={d.registerHref || '/registro'} className="text-center text-sm underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Quiero cantar en Retroke
        </Link>
      </div>
    </div>
  )
}
