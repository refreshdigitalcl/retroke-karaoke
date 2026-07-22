import { createContext, useContext, useState, useCallback } from 'react'

  const KaraokeSessionContext = createContext(null)

const REACTION_EMOJIS = ['🔥', '👏', '❤️', '🎤', '⭐', '🙌']

  let idCounter = 1
function nextId() {
  return idCounter++
    }

const initialQueue = [
{ id: nextId(), name: 'Matías', avatar: '🦄', song: "Livin' la Vida Loca", youtubeUrl: '', status: 'waiting' },
{ id: nextId(), name: 'Fernanda', avatar: '👽', song: 'Rolling in the Deep', youtubeUrl: '', status: 'waiting' }
]

export function KaraokeSessionProvider({ children }) {
  const [barName] = useState('Bar La Terraza')
  const [sessionCode] = useState('LATERRAZA')
  const [queue, setQueue] = useState(initialQueue)
  const [currentSinger, setCurrentSinger] = useState(null)
  const [screenMode, setScreenMode] = useState('queue')
  const [reactions, setReactions] = useState([])
  const [ratings, setRatings] = useState([])

  const addToQueue = useCallback((entry) => {
    setQueue((prev) => [...prev, { id: nextId(), name: entry.name, avatar: entry.avatar, song: entry.song, youtubeUrl: entry.youtubeUrl || '', status: 'waiting' }])
      }, [])

  const removeFromQueue = useCallback((id) => {
    setQueue((prev) => prev.filter((entry) => entry.id !== id))
}, [])

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    setQueue((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
})
}, [])

  const startNextSinger = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev
      const [next, ...rest] = prev
      setCurrentSinger(next)
      setScreenMode('reactions')
      setReactions([])
      return rest
})
}, [])

  const finishCurrentSong = useCallback(() => {
    setScreenMode('rating')
}, [])

  const submitRating = useCallback((score) => {
    if (!currentSinger) return
    setRatings((prev) => [...prev, { singerId: currentSinger.id, name: currentSinger.name, song: currentSinger.song, score }])
}, [currentSinger])

  const returnToQueue = useCallback(() => {
    setCurrentSinger(null)
    setScreenMode('queue')
}, [])

  const addReaction = useCallback((emoji) => {
    const id = nextId()
    setReactions((prev) => [...prev, { id, emoji }])
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2000)
}, [])

  const value = {
    barName, sessionCode, queue, currentSinger, screenMode, reactions, ratings,
    reactionEmojis: REACTION_EMOJIS,
    addToQueue, removeFromQueue, reorderQueue, startNextSinger, finishCurrentSong, submitRating, returnToQueue, addReaction
}

  return (
    <KaraokeSessionContext.Provider value={value}>
{children}
    </KaraokeSessionContext.Provider>
  )
}

export function useKaraokeSession() {
  const context = useContext(KaraokeSessionContext)
  if (!context) {
    throw new Error('useKaraokeSession debe usarse dentro de KaraokeSessionProvider')
}
  return context
}
