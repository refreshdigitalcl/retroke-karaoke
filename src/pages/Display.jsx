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

export default function Display() {
  const { screenMode, hasActiveSession, lastClosedSession, hasFeature } = useKaraokeSession()
  const [showHub] = useState(checkNoParams)
  var musicEnabled = hasFeature('waiting_music')

  var audioRef = useRef(null)
  var wasWaitingRef = useRef(false)
  var firstEffectRunRef = useRef(true)
  var mutedState = useState(false)
  var muted = mutedState[0]
  var setMuted = mutedState[1]

  var isWaiting = musicEnabled && hasActiveSession && WAITING_MODES.indexOf(screenMode) !== -1

  function startNewWaitingTrack() {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    var track = pickRandomTrack()
    var audio = new Audio(track)
    audio.loop = true
    audio.volume = 0.35
    audio.muted = muted
    audio.play().catch(function () {})
    audioRef.current = audio
  }

  // Primer arranque: se dispara en el mismo clic de "activar sonido" (sincrono),
  // asi los navegadores de Smart TV mas estrictos lo permiten igual que al video.
  function handleUnlock() {
    if (isWaiting) {
      startNewWaitingTrack()
    }
  }

  // Transiciones posteriores (volver a la sala de espera despues de una cancion,
  // o pasar de la sala de espera a la presentacion): reaccionan al cambio de estado.
  useEffect(function () {
    if (firstEffectRunRef.current) {
      // El primer arranque ya lo maneja handleUnlock, disparado por el toque real.
      // Aqui solo sincronizamos el estado sin volver a llamar play().
      firstEffectRunRef.current = false
      wasWaitingRef.current = isWaiting
      return
    }
    if (isWaiting && !wasWaitingRef.current) {
      startNewWaitingTrack()
    } else if (!isWaiting && wasWaitingRef.current) {
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

  if (showHub) {
    return <SessionHub />
  }

  return (
    <AudioUnlockGate onUnlock={handleUnlock}>
      {!hasActiveSession && lastClosedSession ? (
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
        <DisplayQueue muted={muted} toggleMute={toggleMute} musicEnabled={musicEnabled} />
      )}
    </AudioUnlockGate>
  )
}
