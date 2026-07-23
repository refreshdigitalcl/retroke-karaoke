import { createContext, useContext, useState, useCallback, useEffect, createElement } from 'react'
import { supabase } from '../lib/supabase'

const KaraokeSessionContext = createContext(null)
const REACTION_EMOJIS = ['🔥', '👏', '❤️', '🎤', '⭐', '🙌']
const DEFAULT_SESSION_ID = 'LATERRAZA'

function getSessionIdFromUrl() {
  if (typeof window === 'undefined') return DEFAULT_SESSION_ID
  const params = new URLSearchParams(window.location.search)
  const bar = params.get('bar')
  return bar ? bar.toUpperCase() : DEFAULT_SESSION_ID
}

export function KaraokeSessionProvider({ children }) {
  const SESSION_ID = getSessionIdFromUrl()
  const [barName, setBarName] = useState('Bar La Terraza')
  const [sessionCode] = useState(SESSION_ID)
  const [queue, setQueue] = useState([])
  const [currentSinger, setCurrentSinger] = useState(null)
  const [screenMode, setScreenMode] = useState('queue')
  const [reactions, setReactions] = useState([])
  const [ratings, setRatings] = useState([])

  const sync = useCallback(async () => {
    const q = await supabase.from('queue_entries').select('*').eq('session_id', SESSION_ID).order('position')
    if (q.data) setQueue(q.data.map(r => ({ id: r.id, name: r.name, avatar: r.avatar, song: r.song, youtubeUrl: r.youtube_url || '', photo: r.photo || '' })))
    const s = await supabase.from('sessions').select('*').eq('id', SESSION_ID).single()
    if (s.data) { setBarName(s.data.bar_name); setScreenMode(s.data.screen_mode); setCurrentSinger(s.data.current_singer) }
    const r = await supabase.from('ratings').select('*').eq('session_id', SESSION_ID).order('created_at')
    if (r.data) setRatings(r.data.map(x => ({ singerId: x.singer_id, name: x.singer_name, song: x.song, score: x.score })))
  }, [])

  useEffect(() => {
    sync()
    const onReaction = (payload) => {
      const id = payload.new.id
      const emoji = payload.new.emoji
      setReactions(prev => [...prev, { id, emoji }])
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== id)), 2000)
    }
    const channel = supabase.channel('karaoke-' + SESSION_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: 'session_id=eq.' + SESSION_ID }, sync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: 'id=eq.' + SESSION_ID }, sync)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings', filter: 'session_id=eq.' + SESSION_ID }, sync)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions', filter: 'session_id=eq.' + SESSION_ID }, onReaction)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sync])

  const addToQueue = useCallback(async (entry) => {
    const nextPosition = queue.length + 1
    await supabase.from('queue_entries').insert({ session_id: SESSION_ID, name: entry.name, avatar: entry.avatar, song: entry.song, youtube_url: entry.youtubeUrl || '', photo: entry.photo || null, position: nextPosition })
  }, [queue.length])

  const removeFromQueue = useCallback(async (id) => {
    await supabase.from('queue_entries').delete().eq('id', id)
  }, [])

  const reorderQueue = useCallback(() => {}, [])

  const startNextSinger = useCallback(async () => {
    if (queue.length === 0) return
    const next = queue[0]
    await supabase.from('sessions').update({ current_singer: next, screen_mode: 'reactions' }).eq('id', SESSION_ID)
    await supabase.from('queue_entries').delete().eq('id', next.id)
  }, [queue])

  const finishCurrentSong = useCallback(async () => {
    await supabase.from('sessions').update({ screen_mode: 'rating' }).eq('id', SESSION_ID)
  }, [])

  const submitRating = useCallback(async (score) => {
    if (!currentSinger) return
    await supabase.from('ratings').insert({ session_id: SESSION_ID, singer_id: String(currentSinger.id), singer_name: currentSinger.name, song: currentSinger.song, score })
  }, [currentSinger])

  const returnToQueue = useCallback(async () => {
    await supabase.from('sessions').update({ current_singer: null, screen_mode: 'queue' }).eq('id', SESSION_ID)
  }, [])

  const addReaction = useCallback(async (emoji) => {
    await supabase.from('reactions').insert({ session_id: SESSION_ID, emoji })
  }, [])

  const value = {
    barName, sessionCode, queue, currentSinger, screenMode, reactions, ratings,
    reactionEmojis: REACTION_EMOJIS,
    addToQueue, removeFromQueue, reorderQueue, startNextSinger, finishCurrentSong, submitRating, returnToQueue, addReaction
  }

  return createElement(KaraokeSessionContext.Provider, { value: value }, children)
}

export function useKaraokeSession() {
  const context = useContext(KaraokeSessionContext)
  if (!context) throw new Error('useKaraokeSession debe usarse dentro de KaraokeSessionProvider')
  return context
}
