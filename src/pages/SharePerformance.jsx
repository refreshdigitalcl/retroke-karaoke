import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ShareResultCard from '../components/ShareResultCard'
import ShareButton from '../components/share/ShareButton'
import RetroNeonBg from '../components/RetroNeonBg'

// Pagina publica /r/:performanceId — el link que se comparte en redes.
// Muestra la misma tarjeta 9:16 que se ve en vivo en el celular del
// cantante, pero armada con los datos ya guardados en la base (asi que
// funciona aunque el que la abre no tenga sesion ni haya cantado nunca).

export default function SharePerformance() {
  const { performanceId } = useParams()
  const cardRef = useRef(null)
  const [state, setState] = useState({ loading: true, error: '', data: null })

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
          ? supabase.from('bars').select('slug, name').eq('id', perf.bar_id).maybeSingle()
          : Promise.resolve({ data: null }),
        // "modo" del local: si hay bar_id es siempre BAR (cada bar fisico
        // tiene su propio workspace, pero el tipo real de ese workspace no
        // hace falta consultarlo aparte -- ver lib/venue.js). Si no hay
        // bar_id pero si workspace_id, el tipo (DJ/HOME) vive en esa fila.
        !perf.bar_id && perf.workspace_id
          ? supabase.from('workspaces').select('name, type').eq('id', perf.workspace_id).maybeSingle()
          : Promise.resolve({ data: null }),
        // Reacciones reales de esta presentacion puntual -- mismo criterio
        // (session_id + queue_entry_id) que ya usa DisplayResult.jsx en la
        // pantalla de resultado del TV. Un conteo real, nunca inventado; si
        // la presentacion no tiene session_id/queue_entry_id (dato viejo,
        // corrupto o borrado), simplemente no se muestra ese bloque.
        perf.session_id && perf.queue_entry_id
          ? supabase.from('reactions').select('id', { count: 'exact', head: true }).eq('session_id', perf.session_id).eq('queue_entry_id', perf.queue_entry_id)
          : Promise.resolve({ count: null })
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
      const barPlaceName = lookups[5].data ? lookups[5].data.name : null
      const ws = lookups[6].data || null
      const reactionsCount = typeof lookups[7].count === 'number' ? lookups[7].count : null

      const mode = perf.bar_id ? 'BAR' : (ws ? ws.type : null)
      const placeName = perf.bar_id ? barPlaceName : (ws ? ws.name : null)

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
          registerHref,
          mode,
          placeName,
          reactionsCount,
          createdAt: perf.created_at || null
        }
      })
    }

    load()
    return () => { cancelled = true }
  }, [performanceId])

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--rk-bg-gradient, #05030a)', color: '#fff' }}>
        <RetroNeonBg />
        <span className="relative z-10">Cargando resultado...</span>
      </div>
    )
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center relative" style={{ background: 'var(--rk-bg-gradient, #05030a)', color: '#fff' }}>
        <RetroNeonBg />
        <p className="relative z-10">{state.error || 'No encontramos este resultado.'}</p>
        <Link to="/registro" className="underline relative z-10">Ir a Retroke</Link>
      </div>
    )
  }

  const d = state.data

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 gap-5 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <RetroNeonBg />
      <div className="relative z-10">
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
          mode={d.mode}
          placeName={d.placeName}
          reactionsCount={d.reactionsCount}
          createdAt={d.createdAt}
        />
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3 relative z-10">
        <ShareButton
          mode="download"
          cardRef={cardRef}
          filename={'retroke-' + (d.singerName || 'resultado') + '.png'}
          label="Descargar tarjeta"
        />
        <ShareButton
          mode="link"
          performanceId={performanceId}
          song={d.song}
          artistName={d.artistName}
          notaFinal={d.notaFinal}
          label="Compartir link"
          variant="secondary"
        />
        <Link to={d.registerHref || '/registro'} className="text-center text-sm underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Quiero cantar en Retroke
        </Link>
      </div>
    </div>
  )
}
