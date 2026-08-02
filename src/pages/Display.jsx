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
import { pickTrackForPlan, createProRotation } from '../lib/waitingMusic'
import { supabase } from '../lib/supabase'

function checkNoParams() {
  if (typeof window === 'undefined') return false
  var params = new URLSearchParams(window.location.search)
  return !params.has('ws') && !params.has('bar')
}

function getSavedRoom() {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem('retroke_last_room') } catch (e) { return null }
}

var WAITING_MODES = ['queue', 'called', 'countdown']

export default function Display() {
  const { screenMode, hasActiveSession, lastClosedSession, sessionId, workspaceType, workspacePlan } = useKaraokeSession()
  const [showHub] = useState(checkNoParams)
  const [redirectingToSaved] = useState(function () {
    return checkNoParams() && !!getSavedRoom()
  })

  useEffect(function () {
    if (redirectingToSaved) {
      window.location.href = getSavedRoom()
    }
  }, [redirectingToSaved])

  var audioRef = useRef(null)
  var wasWaitingRef = useRef(false)
  var firstEffectRunRef = useRef(true)
  var rotationRef = useRef(null)
  var mutedState = useState(false)
  var muted = mutedState[0]
  var setMuted = mutedState[1]
  var audioBlockedState = useState(false)
  var audioBlocked = audioBlockedState[0]
  var setAudioBlocked = audioBlockedState[1]

  var isWaiting = hasActiveSession && WAITING_MODES.indexOf(screenMode) !== -1
  var isWaitingRef = useRef(isWaiting)
  isWaitingRef.current = isWaiting

  function playTrack(url, loop, onEnded) {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    var audio = new Audio(url)
    audio.loop = loop
    audio.volume = 0.35
    audio.muted = muted
    if (onEnded) audio.addEventListener('ended', onEnded)
    audio.play().then(function () {
      setAudioBlocked(false)
    }).catch(function () {
      // Esto solo pasa en navegadores muy estrictos que de verdad exigen
      // un toque real antes de reproducir sonido con volumen. Ahi si
      // mostramos un boton chico como respaldo, sin tapar toda la pantalla.
      setAudioBlocked(true)
    })
    audioRef.current = audio
  }

  function playNextProTrack() {
    var next = rotationRef.current.next()
    playTrack(next, false, playNextProTrack)
  }

  function startNewWaitingTrack() {
    if (workspacePlan === 'PRO') {
      // Siempre arranca con la guaracha al entrar a la sala de espera, y
      // despues va rotando el resto sin repetir ninguna hasta pasarlas todas.
      if (!rotationRef.current) rotationRef.current = createProRotation()
      var first = rotationRef.current.first()
      playTrack(first, false, playNextProTrack)
    } else {
      // Plan Free: siempre la misma cancion, en loop.
      playTrack(pickTrackForPlan(workspacePlan), true, null)
    }
  }

  // Primer arranque: se dispara en el mismo clic de "activar sonido" (sincrono),
  // asi los navegadores de Smart TV mas estrictos lo permiten igual que al video.
  // Consultamos isWaitingRef (siempre al dia) en vez de isWaiting directo: si en
  // el instante del toque el dato real ya dice que NO estamos en la sala de
  // espera (por ejemplo, alguien recargo estando en la pantalla de calificacion),
  // no arrancamos musica de espera para nada. Si el dato genuinamente no llego
  // a tiempo, el efecto de abajo la arranca apenas isWaiting pase a true.
  function handleUnlock() {
    if (isWaitingRef.current) {
      startNewWaitingTrack()
    }
  }

  // Transiciones posteriores (volver a la sala de espera despues de una cancion,
  // o pasar de la sala de espera a la presentacion): reaccionan al cambio de estado.
  useEffect(function () {
    if (firstEffectRunRef.current) {
      firstEffectRunRef.current = false
      wasWaitingRef.current = isWaiting
      // Si el desbloqueo ya arranco musica de espera (optimista, por el tema
      // del gesto del usuario) pero resulta que en realidad no correspondia
      // esperar, la paramos apenas tengamos el dato real.
      if (!isWaiting && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
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

  if (redirectingToSaved) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <p style={{ color: '#666' }}>Cargando tu sala...</p>
      </div>
    )
  }

  if (showHub) {
    return <SessionHub />
  }

  return (
    <AudioUnlockGate onUnlock={handleUnlock}>
      {audioBlocked && (
        <button
          onClick={function () {
            setAudioBlocked(false)
            startNewWaitingTrack()
          }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border-2 px-5 py-3"
          style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.92)' }}
        >
          <span className="text-lg">🔊</span>
          <span className="text-sm font-bold text-white">Toca para activar el sonido</span>
        </button>
      )}
      {workspaceType === 'HOME' && <VocalScoreToast sessionId={sessionId} />}
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
        <DisplayQueue muted={muted} toggleMute={toggleMute} musicEnabled={true} />
      )}
    </AudioUnlockGate>
  )
}

function VocalScoreToast(props) {
  var sessionId = props.sessionId
  var lastSeenIdRef = useRef(null)
  var initializedRef = useRef(false)

  var toastState = useState(null)
  var toast = toastState[0]
  var setToast = toastState[1]

  useEffect(function () {
    if (!sessionId) return
    var cancelled = false

    function poll() {
      supabase
        .from('vocal_results')
        .select('id, final_score, feedback, created_at, queue_entries(name, avatar, photo)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(function (result) {
          if (cancelled) return
          var latest = result.data && result.data[0]
          if (!latest) {
            initializedRef.current = true
            return
          }
          if (!initializedRef.current) {
            // Al entrar, no mostramos resultados viejos, solo los que lleguen desde ahora.
            initializedRef.current = true
            lastSeenIdRef.current = latest.id
            return
          }
          if (latest.id !== lastSeenIdRef.current) {
            lastSeenIdRef.current = latest.id
            setToast(latest)
            setTimeout(function () { setToast(null) }, 6000)
          }
        })
    }

    poll()
    var intervalId = setInterval(poll, 5000)
    return function () {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [sessionId])

  if (!toast) return null

  var entry = toast.queue_entries
  var scoreColor = toast.final_score >= 80 ? '#7ED957' : toast.final_score >= 55 ? '#F4D03F' : '#E9544A'

  return (
    <div className="fixed top-6 right-6 z-[70] vocal-toast-in">
      <div
        className="flex items-center gap-4 pl-4 pr-6 py-4 rounded-2xl border-2"
        style={{
          background: 'linear-gradient(135deg, rgba(20,10,30,0.92), rgba(30,15,40,0.92))',
          borderColor: scoreColor,
          boxShadow: '0 0 30px -4px ' + scoreColor
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl overflow-hidden shrink-0"
          style={{ background: 'var(--accent-purple)' }}
        >
          {entry && entry.photo ? (
            <img src={entry.photo} alt="" className="w-full h-full object-cover" />
          ) : entry ? (
            entry.avatar
          ) : (
            '🎤'
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: '#F4D03F' }}>
            🎉 Presentación completada
          </p>
          <p className="text-base font-bold" style={{ color: '#fff' }}>
            {entry ? entry.name : 'Cantante'}
          </p>
          <p className="text-2xl font-extrabold" style={{ color: scoreColor }}>
            ⭐ {toast.final_score}/100
          </p>
        </div>
      </div>

      <style>{`
        .vocal-toast-in { animation: vocalToastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes vocalToastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
