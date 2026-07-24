import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const KaraokeSessionContext = createContext(null)
const REACTION_EMOJIS = ['🔥', '👏', '❤️', '🎤', '⭐', '🙌']
const DEFAULT_BAR_SLUG = 'laterraza'

function getBarSlugFromUrl() {
  if (typeof window === 'undefined') return DEFAULT_BAR_SLUG
  const params = new URLSearchParams(window.location.search)
  const bar = params.get('bar')
  return bar ? bar.toLowerCase() : DEFAULT_BAR_SLUG
}

function makeSessionId(barSlug) {
  return barSlug.toUpperCase() + '-' + Date.now()
}

export function KaraokeSessionProvider({ children }) {
  const [barSlug] = useState(getBarSlugFromUrl())
  const [barId, setBarId] = useState(null)
  const [barName, setBarName] = useState('')
  const [barIsActive, setBarIsActive] = useState(true)
  const [barLoading, setBarLoading] = useState(true)

  const [activeSession, setActiveSession] = useState(null)
  const [queue, setQueue] = useState([])
  const [reactions, setReactions] = useState([])
  const [ratings, setRatings] = useState([])

  const sessionId = activeSession ? activeSession.id : null
  const currentSinger = activeSession ? activeSession.current_singer : null
  const screenMode = activeSession ? activeSession.screen_mode : 'queue'
  const hasActiveSession = !!activeSession

  const refreshActiveSession = useCallback(async (currentBarId) => {
    if (!currentBarId) return
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('bar_id', currentBarId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveSession(data || null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: bar } = await supabase.from('bars').select('*').eq('slug', barSlug).maybeSingle()
      if (cancelled) return
      if (bar) {
        setBarId(bar.id)
        setBarName(bar.name)
        setBarIsActive(bar.is_active !== false)
        await refreshActiveSession(bar.id)
      }
      setBarLoading(false)
    }
    init()

    return () => {
      cancelled = true
    }
  }, [barSlug, refreshActiveSession])

  useEffect(() => {
    if (!barId) return
    const channel = supabase
      .channel('bar-sessions-' + barId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: 'bar_id=eq.' + barId },
        () => refreshActiveSession(barId)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [barId, refreshActiveSession])

  const loadQueue = useCallback(async (sid) => {
    const { data } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('session_id', sid)
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
          videoId: r.video_id || ''
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
        data.map((r) => ({ singerId: r.singer_id, name: r.singer_name, song: r.song, score: r.score }))
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
      }, 2000)
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, loadQueue, loadRatings])

  const startSession = useCallback(
    async (name) => {
      if (!barId) return { error: 'Bar no encontrado' }
      const userResult = await supabase.auth.getUser()
      const userId = userResult.data.user ? userResult.data.user.id : null
      const newId = makeSessionId(barSlug)
      const { error } = await supabase.from('sessions').insert({
        id: newId,
        bar_id: barId,
        bar_name: barName,
        name: name,
        status: 'active',
        started_at: new Date().toISOString(),
        created_by: userId,
        screen_mode: 'queue'
      })
      if (!error) {
        await refreshActiveSession(barId)
      }
      return { error: error ? error.message : null }
    },
    [barId, barName, barSlug, refreshActiveSession]
  )

  const closeSession = useCallback(async () => {
    if (!sessionId) return
    await supabase
      .from('sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', sessionId)
    setActiveSession(null)
  }, [sessionId])

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
      if (!sessionId) return
      const nextPosition = queue.length + 1
      await supabase.from('queue_entries').insert({
        session_id: sessionId,
        name: entry.name,
        avatar: entry.avatar,
        song: entry.song,
        youtube_url: entry.youtubeUrl || '',
        photo: entry.photo || null,
        position: nextPosition
      })
    },
    [sessionId, queue.length]
  )

  const removeFromQueue = useCallback(async (id) => {
    await supabase.from('queue_entries').delete().eq('id', id)
  }, [])

  function parseYoutubeId(url) {
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

  const setQueueEntryVideo = useCallback(async (id, videoUrl) => {
    const videoId = parseYoutubeId(videoUrl)
    await supabase
      .from('queue_entries')
      .update({ video_url: videoUrl, video_id: videoId, video_source: 'youtube' })
      .eq('id', id)
  }, [])

  const reorderQueue = useCallback(() => {}, [])

  const startNextSinger = useCallback(async () => {
    if (!sessionId || queue.length === 0) return
    const next = queue[0]
    await supabase
      .from('sessions')
      .update({ current_singer: next, screen_mode: 'reactions' })
      .eq('id', sessionId)
    await supabase.from('queue_entries').delete().eq('id', next.id)
  }, [sessionId, queue])

  const finishCurrentSong = useCallback(async () => {
    if (!sessionId) return
    await supabase.from('sessions').update({ screen_mode: 'rating' }).eq('id', sessionId)
  }, [sessionId])

  const submitRating = useCallback(
    async (score) => {
      if (!sessionId || !currentSinger) return
      await supabase.from('ratings').insert({
        session_id: sessionId,
        singer_id: String(currentSinger.id),
        singer_name: currentSinger.name,
        song: currentSinger.song,
        score
      })
    },
    [sessionId, currentSinger]
  )

  const returnToQueue = useCallback(async () => {
    if (!sessionId) return
    await supabase
      .from('sessions')
      .update({ current_singer: null, screen_mode: 'queue' })
      .eq('id', sessionId)
  }, [sessionId])

  const addReaction = useCallback(
    async (emoji) => {
      if (!sessionId) return
      await supabase.from('reactions').insert({ session_id: sessionId, emoji })
    },
    [sessionId]
  )

  const value = {
    barSlug,
    barId,
    barName,
    barIsActive,
    barLoading,
    sessionCode: barSlug,
    hasActiveSession,
    activeSessionName: activeSession ? activeSession.name : '',
    queue,
    currentSinger,
    screenMode,
    reactions,
    ratings,
    reactionEmojis: REACTION_EMOJIS,
    addToQueue,
    removeFromQueue,
    setQueueEntryVideo,
    reorderQueue,
    startNextSinger,
    finishCurrentSong,
    submitRating,
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
