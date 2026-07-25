import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import DisplayQueue from './DisplayQueue'
import DisplayCalled from './DisplayCalled'
import DisplayCountdown from './DisplayCountdown'
import DisplayReactions from './DisplayReactions'
import DisplayRating from './DisplayRating'
import DisplayResult from './DisplayResult'
import SessionLeaderboard from './SessionLeaderboard'
import SessionHub from './SessionHub'
import AudioUnlockGate from '../components/AudioUnlockGate'
import { pickRandomTrack } from '../lib/waitingMusic'

function checkNoParams() {
  if (typeof window === 'undefined') return false
  var params = new URLSearchParams(window.location.search)
  return !params.has('ws') && !params.has('bar')
}

var WAITING_MODES = ['queue', 'called', 'countdown']

function useWaitingMusic(screenMode, hasActiveSession) {
  var audioRef = useRef(null)
  var wasWaitingRef = useRef(false)
  var mutedState = useState(false)
  var muted = mutedState[0]
  var setMuted = mutedState[1]

  var isWaiting = hasActiveSession && WAITING_MODES.indexOf(screenMode) !== -1

  useEffect(function () {
    if (isWaiting && !wasWaitingRef.current) {
      // Recien entramos a la sala de espera: elegir una cancion nueva
      var track = pickRandomTrack()
      var audio = new Audio(track)
      audio.loop = true
      audio.volume = 0.35
      audio.muted = muted
      audio.play().catch(function () {})
      audioRef.current = audio
    } else if (!isWaiting && wasWaitingRef.current) {
      // Salimos de la sala de espera (empezo la presentacion): cortar
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
    wasWaitingRef.current = isWaiting
  }, [isWaiting])

  useEffect(function () {
    return function () {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  function toggleMute() {
    setMuted(function (prev) {
      var next = !prev
      if (audioRef.current) audioRef.current.muted = next
      return next
    })
  }

  return { muted: muted, toggleMute: toggleMute }
}

export default function Display() {
  const { screenMode, hasActiveSession, lastClosedSession } = useKaraokeSession()
  const [showHub] = useState(checkNoParams)

  if (showHub) {
    return <SessionHub />
  }

  return (
    <AudioUnlockGate>
      <DisplayInner
        screenMode={screenMode}
        hasActiveSession={hasActiveSession}
        lastClosedSession={lastClosedSession}
      />
    </AudioUnlockGate>
  )
}

function DisplayInner(props) {
  var screenMode = props.screenMode
  var hasActiveSession = props.hasActiveSession
  var lastClosedSession = props.lastClosedSession
  var music = useWaitingMusic(screenMode, hasActiveSession)

  return !hasActiveSession && lastClosedSession ? (
    <SessionLeaderboard />
  ) : screenMode === 'called' ? (
    <DisplayCalled />
  ) : screenMode === 'countdown' ? (
    <DisplayCountdown />
  ) : screenMode === 'reactions' ? (
    <DisplayReactions />
  ) : screenMode === 'rating' ? (
    <DisplayRating />
  ) : screenMode === 'result' ? (
    <DisplayResult />
  ) : (
    <DisplayQueue muted={music.muted} toggleMute={music.toggleMute} />
  )
}
