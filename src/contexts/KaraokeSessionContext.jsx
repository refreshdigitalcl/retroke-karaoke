import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { REACTION_EMOJIS as REACTION_EMOJI_LIST } from '../lib/reactionEmojis'
import { fetchArtistNameForSong } from '../lib/artistLookup'
import { computeLevel, computeNotaFinal, computeXpForPerformance, isGoodPerformance, evaluateNewAchievements } from '../lib/gamification'

export function parseYoutubeId(url) {
  if (!url) return ''
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return ''
}

const KaraokeSessionContext = createContext(null)
const DEFAULT_BAR_SLUG = 'laterraza'

function getBarSlugFromUrl() {
  if (typeof window === 'undefined') return DEFAULT_BAR_SLUG
  const params = new URLSearchParams(window.location.search)
  const bar = params.get('bar')
  return bar ? bar.toLowerCase() : DEFAULT_BAR_SLUG
}

function getWorkspaceParamFromUrl() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('ws')
}

function makeSessionId(code) {
  return code.toUpperCase() + '-' + Date.now()
}

// Fase C: arma la fila de historial permanente para una presentacion que
// recien termino. Junta el promedio del publico (ratings) y el resultado de
// IA (vocal_results, solo Home) en un solo registro por presentacion. Si
// alguna de las dos fuentes no existe, simplemente queda null — no se
// inventa un dato que no se pudo medir.
async function recordPerformance(singer, sessionId, barId, workspaceId) {
  if (!singer || !sessionId) return

  const ratingsResult = await supabase
    .from('ratings')
    .select('score')
    .eq('session_id', sessionId)
    .eq('singer_id', String(singer.id))
  const scores = (ratingsResult.data || []).map((r) => r.score)
  const audienceScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null

  const vocalResult = await supabase
    .from('vocal_results')
    .select('final_score, confidence')
    .eq('session_id', sessionId)
    .eq('queue_entry_id', singer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const vocalScore = vocalResult.data ? vocalResult.data.final_score : null
  const notaFinal = computeNotaFinal(audienceScore, vocalScore)

  const { data: perfRow } = await supabase
    .from('performances')
    .insert({
      participant_id: singer.participantId || null,
      session_id: sessionId,
      queue_entry_id: singer.id,
      bar_id: barId || null,
      workspace_id: barId ? null : (workspaceId || null),
      singer_name: singer.name || null,
      song: singer.song || null,
      artist_name: singer.artistName || null,
      audience_score: audienceScore,
      vocal_score: vocalScore,
      vocal_confidence: vocalResult.data ? vocalResult.data.confidence : null,
      nota_final: notaFinal
    })
    .select('id')
    .single()

  // Fase D: deja la presentacion ubicable desde su fila de la cola, para
  // poder armar la tarjeta compartible (/r/:performanceId) despues.
  if (perfRow) {
    await supabase
      .from('queue_entries')
      .update({ performance_id: perfRow.id })
      .eq('id', singer.id)
  }

  // Fase C.2: XP, nivel y logros. Solo aplica si el cantante tiene perfil de
  // participante (dispositivo identificado, Fase B) — si canto sin eso, su
  // presentacion queda igual en el historial, solo no suma progreso personal.
  // Nunca bloquea ni rompe el registro de la presentacion si falla.
  if (singer.participantId) {
    applyGamification(singer.participantId, notaFinal, vocalScore).catch(() => {})
  }
}

// Fase C.2: lee el progreso actual del participante, calcula el nuevo XP,
// nivel y racha con las funciones puras de gamification.js, guarda el nuevo
// estado y desbloquea los logros que correspondan. Fire-and-forget desde
// recordPerformance — nunca debe interrumpir el show en vivo.
async function applyGamification(participantId, notaFinal, vocalScore) {
  const statsResult = await supabase
    .from('participant_stats')
    .select('*')
    .eq('participant_id', participantId)
    .maybeSingle()
  const prevStats = statsResult.data || {
    xp: 0,
    total_performances: 0,
    best_score: null,
    current_streak: 0,
    best_streak: 0
  }

  const good = isGoodPerformance(notaFinal)
  const newStreak = good ? (prevStats.current_streak || 0) + 1 : 0
  const newXp = (prevStats.xp || 0) + computeXpForPerformance(notaFinal)
  const levelInfo = computeLevel(newXp)

  const updatedStats = {
    participant_id: participantId,
    xp: newXp,
    level: levelInfo.level,
    level_name: levelInfo.name,
    total_performances: (prevStats.total_performances || 0) + 1,
    best_score:
      vocalScore !== null && vocalScore !== undefined
        ? Math.max(prevStats.best_score || 0, vocalScore)
        : prevStats.best_score,
    current_streak: newStreak,
    best_streak: Math.max(prevStats.best_streak || 0, newStreak),
    updated_at: new Date().toISOString()
  }

  await supabase.from('participant_stats').upsert(updatedStats)

  const unlockedResult = await supabase
    .from('participant_achievements')
    .select('achievement_code')
    .eq('participant_id', participantId)
  const alreadyUnlocked = (unlockedResult.data || []).map((r) => r.achievement_code)

  const newlyUnlocked = evaluateNewAchievements(vocalScore, updatedStats, alreadyUnlocked)
  if (newlyUnlocked.length) {
    await supabase.from('participant_achievements').insert(
      newlyUnlocked.map((code) => ({ participant_id: participantId, achievement_code: code }))
    )
  }
}

export function KaraokeSessionProvider({ children }) {
  const [directWorkspaceId, setDirectWorkspaceId] = useState(null)
  const [barSlug, setBarSlug] = useState(null)
  const [urlResolved, setUrlResolved] = useState(false)
  const [urlAttempts, setUrlAttempts] = useState(0)
  const [noParamsGiven, setNoParamsGiven] = useState(false)
  const [barId, setBarId] = useState(null)
  const [barName, setBarName] = useState('')
  const [barIsActive, setBarIsActive] = useState(true)
  const [barLoading, setBarLoading] = useState(true)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const [workspaceId, setWorkspaceId] = useState(null)
  const [workspacePlan, setWorkspacePlan] = useState(null)
  const [workspaceType, setWorkspaceType] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [featureSet, setFeatureSet] = useState(new Set())

  const [activeSession, setActiveSession] = useState(null)
  const [lastClosedSession, setLastClosedSession] = useState(null)
  const [queue, setQueue] = useState([])
  const [reactions, setReactions] = useState([])
  const [ratings, setRatings] = useState([])

  const sessionId = activeSession ? activeSession.id : null
  const currentSinger = activeSession ? activeSession.current_singer : null
  const screenMode = activeSession ? activeSession.screen_mode : 'queue'
  const hasActiveSession = !!activeSession

  const refreshActiveSession = useCallback(async (anchorBarId, anchorWorkspaceId) => {
    if (!anchorBarId && !anchorWorkspaceId) return
    try {
      let activeQuery = supabase
        .from('sessions')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
      activeQuery = anchorBarId
        ? activeQuery.eq('bar_id', anchorBarId)
        : activeQuery.eq('workspace_id', anchorWorkspaceId)
      const { data } = await activeQuery.maybeSingle()
      setActiveSession(data || null)

      if (!data) {
        let closedQuery = supabase
          .from('sessions')
          .select('*')
          .eq('status', 'closed')
          .order('closed_at', { ascending: false })
          .limit(1)
        closedQuery = anchorBarId
          ? closedQuery.eq('bar_id', anchorBarId)
          : closedQuery.eq('workspace_id', anchorWorkspaceId)
        const closedResult = await closedQuery.maybeSingle()
        const closed = closedResult.data
        if (closed && closed.closed_at) {
          const minutesAgo = (Date.now() - new Date(closed.closed_at).getTime()) / 60000
          setLastClosedSession(minutesAgo < 45 ? closed : null)
        } else {
          setLastClosedSession(null)
        }
      } else {
        setLastClosedSession(null)
      }
    } catch (err) {
      console.error('Error cargando sesion activa:', err)
    }
  }, [])

  const loadSessionLeaderboard = useCallback(async (targetSessionId) => {
    if (!targetSessionId) return []
    const ratingsResult = await supabase
      .from('ratings')
      .select('*')
      .eq('session_id', targetSessionId)
    const rows = ratingsResult.data || []

    const grouped = {}
    const order = []
    rows.forEach(function (r) {
      if (!grouped[r.singer_id]) {
        grouped[r.singer_id] = { total: 0, count: 0, name: r.singer_name, song: r.song }
        order.push(r.singer_id)
      }
      grouped[r.singer_id].total += r.score
      grouped[r.singer_id].count += 1
    })

    const singerIds = order.map(function (id) { return isNaN(Number(id)) ? id : Number(id) })
    const entriesResult = singerIds.length
      ? await supabase.from('queue_entries').select('id, photo, avatar').in('id', singerIds)
      : { data: [] }
    const entriesById = {}
    ;(entriesResult.data || []).forEach(function (e) {
      entriesById[String(e.id)] = e
    })

    const list = order.map(function (id) {
      const g = grouped[id]
      const entry = entriesById[String(id)]
      return {
        id: id,
        name: g.name,
        song: g.song,
        average: g.total / g.count,
        photo: entry ? entry.photo : '',
        avatar: entry ? entry.avatar : '🎤'
      }
    })

    list.sort(function (a, b) { return b.average - a.average })
    return list
  }, [])

  // Se resuelve reintentando varias veces en los primeros instantes, en vez de
  // confiar en una sola lectura, para blindarse contra cualquier retraso de
  // algunos navegadores moviles en "asentar" los parametros de la URL.
  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const delays = [0, 60, 150, 350, 700]

    function attempt() {
      if (cancelled) return
      const ws = getWorkspaceParamFromUrl()
      const hasBarParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bar')
      const hasAnyParam = !!ws || hasBarParam

      if (hasAnyParam || attempts >= delays.length - 1) {
        const bar = ws ? null : getBarSlugFromUrl()
        setDirectWorkspaceId(ws)
        setBarSlug(bar)
        setUrlAttempts(attempts)
        setNoParamsGiven(!hasAnyParam)
        setUrlResolved(true)
        return
      }

      attempts += 1
      setTimeout(attempt, delays[attempts])
    }

    attempt()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!urlResolved) return
    let cancelled = false
    let finished = false
    setBarLoading(true)
    setLoadTimedOut(false)

    async function init() {
      try {
        if (noParamsGiven) {
          // Sin parametros: se muestra el selector de salas, no hay bar que cargar
          return
        }

        if (directWorkspaceId) {
          const { data: ws } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', directWorkspaceId)
            .maybeSingle()
          if (cancelled) return
          if (ws) {
            setWorkspaceId(ws.id)
            setBarName(ws.name)
            setBarIsActive(ws.status === 'ACTIVE')
            setWorkspaceType(ws.type)
            setLogoUrl(ws.logo_url || null)
            const plan = (ws.plan || 'FREE').toUpperCase()
            setWorkspacePlan(plan)

            // Features en segundo plano, no bloquea la pantalla
            supabase
              .from('plan_features')
              .select('feature')
              .eq('plan', plan)
              .eq('workspace_type', ws.type)
              .then(({ data: features }) => {
                if (!cancelled) setFeatureSet(new Set((features || []).map((f) => f.feature)))
              })
              .catch(() => {})

            await refreshActiveSession(null, ws.id)
          }
          return
        }

        const { data: bar } = await supabase.from('bars').select('*').ilike('slug', barSlug).maybeSingle()
        if (cancelled) return
        if (bar) {
          setBarId(bar.id)
          setBarName(bar.name)
          setBarIsActive(bar.is_active !== false)
          setLogoUrl(bar.logo_url || null)

          if (bar.workspace_id) {
            setWorkspaceId(bar.workspace_id)
            // Workspace + features en segundo plano, no bloquea la pantalla
            supabase
              .from('workspaces')
              .select('plan, type')
              .eq('id', bar.workspace_id)
              .maybeSingle()
              .then(({ data: ws }) => {
                if (cancelled || !ws) return
                setWorkspaceType(ws.type)
                const plan = (ws.plan || 'FREE').toUpperCase()
                setWorkspacePlan(plan)
                return supabase
                  .from('plan_features')
                  .select('feature')
                  .eq('plan', plan)
                  .eq('workspace_type', ws.type)
                  .then(({ data: features }) => {
                    if (!cancelled) setFeatureSet(new Set((features || []).map((f) => f.feature)))
                  })
              })
              .catch(() => {})
          }

          await refreshActiveSession(bar.id, null)
        }
      } catch (err) {
        console.error('Error cargando espacio:', err)
      } finally {
        finished = true
        if (!cancelled) {
          setBarLoading(false)
          setLoadTimedOut(false)
        }
      }
    }
    init()

    const safetyTimeout = setTimeout(function () {
      if (!cancelled && !finished) {
        setLoadTimedOut(true)
      }
    }, 15000)

    return () => {
      cancelled = true
      clearTimeout(safetyTimeout)
    }
  }, [urlResolved, barSlug, directWorkspaceId, refreshActiveSession, retryCount])

  useEffect(() => {
    if (!barId && !workspaceId) return
    const channelName = barId ? 'bar-sessions-' + barId : 'ws-sessions-' + workspaceId
    const filter = barId ? 'bar_id=eq.' + barId : 'workspace_id=eq.' + workspaceId
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: filter },
        () => refreshActiveSession(barId, barId ? null : workspaceId)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [barId, workspaceId, refreshActiveSession])

  const loadQueue = useCallback(async (sid) => {
    const { data } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('session_id', sid)
      .eq('status', 'waiting')
      .order('position')
    if (data) {
      setQueue(
        data.map((r) => ({
          id: r.id,
          name: r.name,
          avatar: r.avatar,
          song: r.song,
          youtubeUrl: r.youtube_url || '',
          photo: r.photo || '',
          status: r.status || 'waiting',
          videoUrl: r.video_url || '',
          videoId: r.video_id || '',
          lastSeenAt: r.last_seen_at || null,
          micReady: r.mic_ready || false,
          artistName: r.artist_name || '',
          participantId: r.participant_id || null
        }))
      )
    }
  }, [])

  const loadRatings = useCallback(async (sid) => {
    const { data } = await supabase
      .from('ratings')
      .select('*')
      .eq('session_id', sid)
      .order('created_at')
    if (data) {
      setRatings(
        data.map((r) => ({ singerId: r.singer_id, name: r.singer_name, song: r.song, score: r.score, phrase: r.phrase, id: r.id }))
      )
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setQueue([])
      setReactions([])
      setRatings([])
      return
    }

    loadQueue(sessionId)
    loadRatings(sessionId)

    const onReaction = (payload) => {
      const id = payload.new.id
      const emoji = payload.new.emoji
      setReactions((prev) => [...prev, { id, emoji }])
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id))
      }, 2700)
    }

    const channel = supabase
      .channel('karaoke-session-' + sessionId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries', filter: 'session_id=eq.' + sessionId },
        () => loadQueue(sessionId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings', filter: 'session_id=eq.' + sessionId },
        () => loadRatings(sessionId)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: 'session_id=eq.' + sessionId },
        onReaction
      )
      .subscribe()

    // Respaldo para celulares: cuando el navegador bloquea la pantalla o
    // cambias de app, el navegador corta la conexion en tiempo real (websocket)
    // para ahorrar bateria, y no siempre se reconecta sola al volver. Por eso
    // recargamos la cola y las calificaciones a mano apenas la pantalla vuelve
    // a estar visible o el celular recupera el foco — asi nunca queda pegada
    // esperando un recargo manual.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadQueue(sessionId)
        loadRatings(sessionId)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    window.addEventListener('online', onVisible)

    // Respaldo extra: reintenta cada 10s aunque la pantalla nunca se haya
    // bloqueado, por si el wifi del local corta el websocket sin avisar.
    const pollInterval = setInterval(() => {
      loadQueue(sessionId)
    }, 10000)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('online', onVisible)
      clearInterval(pollInterval)
    }
  }, [sessionId, loadQueue, loadRatings])

  const updateLogo = useCallback(
    async (url) => {
      if (barId) {
        const { error } = await supabase.from('bars').update({ logo_url: url }).eq('id', barId)
        if (!error) setLogoUrl(url)
        return { error: error ? error.message : null }
      }
      if (workspaceId) {
        const { error } = await supabase.from('workspaces').update({ logo_url: url }).eq('id', workspaceId)
        if (!error) setLogoUrl(url)
        return { error: error ? error.message : null }
      }
      return { error: 'Espacio no encontrado' }
    },
    [barId, workspaceId]
  )

  const startSession = useCallback(
    async (name, pin) => {
      if (!barId && !workspaceId) return { error: 'Espacio no encontrado' }
      const userResult = await supabase.auth.getUser()
      const userId = userResult.data.user ? userResult.data.user.id : null
      const code = barId ? barSlug : workspaceId.slice(0, 8)
      const newId = makeSessionId(code)
      const finalPin = pin && /^\d{4}$/.test(pin) ? pin : String(Math.floor(1000 + Math.random() * 9000))
      const insertData = {
        id: newId,
        name: name,
        status: 'active',
        started_at: new Date().toISOString(),
        created_by: userId,
        screen_mode: 'queue',
        pin: finalPin
      }
      if (barId) {
        insertData.bar_id = barId
        insertData.bar_name = barName
      } else {
        insertData.workspace_id = workspaceId
      }
      const { error } = await supabase.from('sessions').insert(insertData)
      if (!error) {
        await refreshActiveSession(barId, barId ? null : workspaceId)
      }
      return { error: error ? error.message : null, pin: finalPin }
    },
    [barId, barName, barSlug, workspaceId, refreshActiveSession]
  )

  const closeSession = useCallback(async () => {
    if (!sessionId) return
    await supabase
      .from('sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId)
    setActiveSession(null)
  }, [sessionId])

  const dismissPodium = useCallback(async (targetSessionId) => {
    if (!targetSessionId) return
    await supabase
      .from('sessions')
      .update({ dismiss_podium_at: new Date().toISOString() })
      .eq('id', targetSessionId)
  }, [])

  const sendPresenceHeartbeat = useCallback(async (entryId) => {
    if (!entryId) return
    await supabase
      .from('queue_entries')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', entryId)
  }, [])

  const setMicReady = useCallback(async (entryId, ready) => {
    if (!entryId) return
    await supabase
      .from('queue_entries')
      .update({ mic_ready: ready })
      .eq('id', entryId)
  }, [])

  const loadPastSessions = useCallback(async () => {
    if (!barId) return []
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('bar_id', barId)
      .eq('status', 'closed')
      .order('started_at', { ascending: false })
      .limit(20)
    if (!sessions) return []

    const results = []
    for (const s of sessions) {
      const songsRes = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', s.id)
      const ratingsRes = await supabase.from('ratings').select('score').eq('session_id', s.id)
      const scores = ratingsRes.data || []
      const avg =
        scores.length > 0
          ? (scores.reduce((sum, r) => sum + r.score, 0) / scores.length).toFixed(1)
          : null
      results.push({
        id: s.id,
        name: s.name,
        startedAt: s.started_at,
        closedAt: s.closed_at,
        songCount: songsRes.count || 0,
        ratingCount: scores.length,
        average: avg
      })
    }
    return results
  }, [barId])

  const addToQueue = useCallback(
    async (entry) => {
      if (!sessionId) return null
      const nextPosition = queue.length + 1
      const videoUrl = entry.videoUrl || ''
      const { data } = await supabase
        .from('queue_entries')
        .insert({
          session_id: sessionId,
          name: entry.name,
          avatar: entry.avatar,
          song: entry.song,
          artist_name: entry.artistName || null,
          participant_id: entry.participantId || null,
          youtube_url: entry.youtubeUrl || '',
          photo: entry.photo || null,
          position: nextPosition,
          video_url: videoUrl,
          video_id: parseYoutubeId(videoUrl),
          video_source: videoUrl ? 'youtube' : null
        })
        .select()
        .single()
      return data
    },
    [sessionId, queue.length]
  )

  const removeFromQueue = useCallback(async (id) => {
    const result = await supabase.from('queue_entries').delete().eq('id', id)
    if (result.error) {
      alert('No se pudo quitar de la cola: ' + result.error.message)
      return
    }
    if (sessionId) {
      loadQueue(sessionId)
    }
  }, [sessionId, loadQueue])

  const setQueueEntryVideo = useCallback(async (id, videoUrl) => {
    const videoId = parseYoutubeId(videoUrl)
    await supabase
      .from('queue_entries')
      .update({ video_url: videoUrl, video_id: videoId, video_source: 'youtube' })
      .eq('id', id)
  }, [])

  const reorderQueue = useCallback(() => {}, [])

  const callSinger = useCallback(
    async (entryId) => {
      if (!sessionId) return
      const entry = queue.find((e) => e.id === entryId)
      if (!entry) return
      await supabase
        .from('sessions')
        .update({
          current_singer: {
            id: entry.id,
            name: entry.name,
            avatar: entry.avatar,
            song: entry.song,
            photo: entry.photo,
            videoUrl: entry.videoUrl,
            videoId: entry.videoId,
            artistName: entry.artistName || null,
            participantId: entry.participantId || null
          },
          screen_mode: 'called'
        })
        .eq('id', sessionId)
      await supabase.from('queue_entries').update({ status: 'called' }).eq('id', entryId)

      // Detección automática del artista real (ya no requiere confirmación manual del DJ).
      if (!entry.artistName) {
        fetchArtistNameForSong(entry.song)
          .then(async (autoArtist) => {
            if (!autoArtist) return
            const { data } = await supabase
              .from('sessions')
              .select('current_singer')
              .eq('id', sessionId)
              .maybeSingle()
            const stillCurrent = data && data.current_singer && data.current_singer.id === entry.id
            if (!stillCurrent) return
            await supabase
              .from('sessions')
              .update({ current_singer: { ...data.current_singer, artistName: autoArtist } })
              .eq('id', sessionId)
            await supabase.from('queue_entries').update({ artist_name: autoArtist }).eq('id', entry.id)
          })
          .catch(() => {})
      }
    },
    [sessionId, queue]
  )

  const startCountdown = useCallback(async () => {
    if (!sessionId || !currentSinger) return
    const now = new Date().toISOString()
    await supabase
      .from('sessions')
      .update({
        screen_mode: 'countdown',
        current_singer: { ...currentSinger, playbackStartedAt: now }
      })
      .eq('id', sessionId)
    await supabase
      .from('queue_entries')
      .update({ status: 'countdown', playback_started_at: now })
      .eq('id', currentSinger.id)
  }, [sessionId, currentSinger])

  const startPlaying = useCallback(async () => {
    if (!sessionId || !currentSinger) return
    await supabase.from('sessions').update({ screen_mode: 'reactions' }).eq('id', sessionId)
    await supabase.from('queue_entries').update({ status: 'playing' }).eq('id', currentSinger.id)
  }, [sessionId, currentSinger])

  const finishCurrentSong = useCallback(async () => {
    if (!sessionId) return
    await supabase.from('sessions').update({ screen_mode: 'rating' }).eq('id', sessionId)
    if (currentSinger) {
      await supabase.from('queue_entries').update({ status: 'rating' }).eq('id', currentSinger.id)
    }
  }, [sessionId, currentSinger])

  const submitRating = useCallback(
    async (score, phrase) => {
      if (!sessionId || !currentSinger) return
      await supabase.from('ratings').insert({
        session_id: sessionId,
        singer_id: String(currentSinger.id),
        singer_name: currentSinger.name,
        song: currentSinger.song,
        score,
        phrase: phrase || null
      })
    },
    [sessionId, currentSinger]
  )

  const setCurrentSingerVideo = useCallback(
    async (videoUrl, videoId) => {
      if (!sessionId || !currentSinger) return
      await supabase
        .from('sessions')
        .update({
          current_singer: { ...currentSinger, videoUrl, videoId, videoError: false }
        })
        .eq('id', sessionId)
      await supabase
        .from('queue_entries')
        .update({ video_url: videoUrl, video_id: videoId, video_source: 'youtube' })
        .eq('id', currentSinger.id)
    },
    [sessionId, currentSinger]
  )

  const setCurrentSingerArtist = useCallback(
    async (artistName) => {
      if (!sessionId || !currentSinger) return
      await supabase
        .from('sessions')
        .update({
          current_singer: { ...currentSinger, artistName: artistName }
        })
        .eq('id', sessionId)
      await supabase
        .from('queue_entries')
        .update({ artist_name: artistName })
        .eq('id', currentSinger.id)
    },
    [sessionId, currentSinger]
  )

  const reportVideoError = useCallback(async () => {
    if (!sessionId || !currentSinger) return
    await supabase
      .from('sessions')
      .update({ current_singer: { ...currentSinger, videoError: true } })
      .eq('id', sessionId)
  }, [sessionId, currentSinger])

  const closeVoting = useCallback(async () => {
    if (!sessionId || !currentSinger) return
    await supabase.from('sessions').update({ screen_mode: 'result' }).eq('id', sessionId)
    await supabase.from('queue_entries').update({ status: 'result' }).eq('id', currentSinger.id)
  }, [sessionId, currentSinger])

  const returnToQueue = useCallback(async () => {
    if (!sessionId) return
    if (currentSinger) {
      const completingStates = ['rating', 'result', 'reactions']
      const nextStatus = completingStates.indexOf(screenMode) !== -1 ? 'completed' : 'waiting'
      await supabase.from('queue_entries').update({ status: nextStatus }).eq('id', currentSinger.id)

      // Fase C: registrar la presentacion en el historial permanente
      // (performances). Nunca bloquea ni rompe la transicion de pantalla si
      // esto falla o tarda — es un registro de respaldo, no critico para el
      // flujo en vivo.
      if (nextStatus === 'completed') {
        recordPerformance(currentSinger, sessionId, barId, workspaceId).catch(() => {})
      }
    }
    await supabase
      .from('sessions')
      .update({ current_singer: null, screen_mode: 'queue' })
      .eq('id', sessionId)
  }, [sessionId, currentSinger, screenMode, barId, workspaceId])

  const addReaction = useCallback(
    async (emoji) => {
      if (!sessionId) return
      const result = await supabase.from('reactions').insert({
        session_id: sessionId,
        emoji: emoji,
        queue_entry_id: currentSinger ? currentSinger.id : null
      })
      if (result.error) {
        await supabase.from('reactions').insert({ session_id: sessionId, emoji: emoji })
      }
    },
    [sessionId, currentSinger]
  )

  const value = {
    sessionId,
    barSlug,
    barId,
    barName,
    barIsActive,
    barLoading,
    loadTimedOut,
    urlAttempts,
    noParamsGiven,
    retryLoad: () => setRetryCount((n) => n + 1),
    workspacePlan,
    workspaceId,
    workspaceType,
    logoUrl,
    updateLogo,
    hasFeature: (feature) => featureSet.has(feature),
    sessionCode: barSlug,
    spaceParam: workspaceId && !barId ? 'ws=' + workspaceId : 'bar=' + barSlug,
    hasActiveSession,
    lastClosedSession,
    loadSessionLeaderboard,
    dismissPodium,
    sendPresenceHeartbeat,
    setMicReady,
    activeSessionName: activeSession ? activeSession.name : '',
    activeSessionPin: activeSession ? activeSession.pin : '',
    queue,
    currentSinger,
    screenMode,
    reactions,
    ratings,
    reactionEmojis: REACTION_EMOJI_LIST.map(function (r) { return r.emoji }),
    addToQueue,
    removeFromQueue,
    setQueueEntryVideo,
    reorderQueue,
    callSinger,
    setCurrentSingerVideo,
    setCurrentSingerArtist,
    startCountdown,
    startPlaying,
    finishCurrentSong,
    submitRating,
    closeVoting,
    reportVideoError,
    returnToQueue,
    addReaction,
    startSession,
    closeSession,
    loadPastSessions
  }

  return <KaraokeSessionContext.Provider value={value}>{children}</KaraokeSessionContext.Provider>
}

export function useKaraokeSession() {
  const context = useContext(KaraokeSessionContext)
  if (!context) {
    throw new Error('useKaraokeSession debe usarse dentro de KaraokeSessionProvider')
  }
  return context
}
