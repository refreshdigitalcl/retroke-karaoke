import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession, parseYoutubeId } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'
import { createVocalAnalyzer, getFeedback } from '../lib/vocalAnalysis'
import { containsProfanity } from '../lib/profanityFilter'
import { searchSongMatches } from '../lib/songLookup'
import { getOrCreateParticipant, touchParticipantProfile } from '../lib/participant'
import { buildShareUrl, buildShareText, shareResult } from '../lib/shareCard'

const AVATARS = ['🔥', '🦄', '👽', '🐸', '🎤', '🐙', '⭐', '👑', '🍄', '🌊', '🎸', '🦋']

function resizeToSquareJpeg(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        var size = 240
        var canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        var ctx = canvas.getContext('2d')
        var side = Math.min(img.width, img.height)
        var sx = (img.width - side) / 2
        var sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        // PNG en vez de JPEG: algunos televisores (Smart TV con Chrome
        // embebido) decodifican mal el JPEG que genera el canvas del
        // celular y la foto sale con un tono verde. PNG no tiene ese
        // problema porque no usa compresión por crominancia.
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

var PENDING_RESULTS_KEY = 'retroke_pending_vocal_results'

function getPendingResults() {
  try {
    var raw = localStorage.getItem(PENDING_RESULTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function setPendingResults(list) {
  try {
    localStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(list))
  } catch (e) {}
}

function saveVocalResult(payload) {
  supabase
    .from('vocal_results')
    .insert(payload)
    .then(function (result) {
      if (result.error) {
        var pending = getPendingResults()
        pending.push(payload)
        setPendingResults(pending)
      }
    })
    .catch(function () {
      var pending = getPendingResults()
      pending.push(payload)
      setPendingResults(pending)
    })
}

function flushPendingVocalResults() {
  var pending = getPendingResults()
  if (!pending.length) return
  setPendingResults([])
  pending.forEach(function (payload) {
    saveVocalResult(payload)
  })
}

// Fase D: boton de compartir, reutilizado en las pantallas de "gracias por
// participar" y "ya estas en la cola". Solo aparece una vez que existe una
// tarjeta de resultado real (performance_id ya generado en el servidor).
function ShareResultButton(props) {
  function handleClick() {
    var url = buildShareUrl(props.performanceId)
    var text = buildShareText({ song: props.song, artistName: props.artistName || null, notaFinal: null })
    shareResult({ url: url, text: text, title: 'Mi resultado en Retroke' })
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full h-11 rounded-xl font-bold text-white mt-4"
      style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
    >
      Compartir mi resultado 🔗
    </button>
  )
}

function YourTurnScreen(props) {
  var name = props.name
  var song = props.song
  var sessionId = props.sessionId
  var entryId = props.entryId
  var setMicReady = useKaraokeSession().setMicReady

  var micState = useState('idle')
  var micStatus = micState[0]
  var setMicStatus = micState[1]

  var levelState = useState(0)
  var level = levelState[0]
  var setLevel = levelState[1]

  var errorState = useState('')
  var micError = errorState[0]
  var setMicError = errorState[1]

  var streamRef = useRef(null)
  var audioCtxRef = useRef(null)
  var analyserRef = useRef(null)
  var rafRef = useRef(null)
  var peakSeenRef = useRef(false)
  var vocalAnalyzerRef = useRef(null)
  var finalizedRef = useRef(false)

  var resultsState = useState(null)
  var results = resultsState[0]
  var setResults = resultsState[1]

  useEffect(function () {
    flushPendingVocalResults()
    return function () {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (vocalAnalyzerRef.current && !finalizedRef.current) vocalAnalyzerRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach(function (t) { t.stop() })
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  function handleActivateMic() {
    setMicError('')
    setMicStatus('requesting')

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported')
      return
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        streamRef.current = stream
        setMicStatus('testing')
        peakSeenRef.current = false

        var AudioContextClass = window.AudioContext || window.webkitAudioContext
        var audioCtx = new AudioContextClass()
        audioCtxRef.current = audioCtx
        var source = audioCtx.createMediaStreamSource(stream)
        var analyser = audioCtx.createAnalyser()
        analyser.fftSize = 1024
        source.connect(analyser)
        analyserRef.current = analyser
        var data = new Uint8Array(analyser.frequencyBinCount)

        function tick() {
          analyser.getByteTimeDomainData(data)
          var sum = 0
          for (var i = 0; i < data.length; i++) {
            var v = (data[i] - 128) / 128
            sum += v * v
          }
          var rms = Math.sqrt(sum / data.length)
          var pct = Math.min(100, Math.round(rms * 350))
          setLevel(pct)
          if (pct > 12) peakSeenRef.current = true
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(function (err) {
        if (err && err.name === 'NotAllowedError') {
          setMicStatus('denied')
        } else if (err && err.name === 'NotFoundError') {
          setMicStatus('no-device')
        } else {
          setMicStatus('error')
          setMicError(err ? err.message : '')
        }
      })
  }

  function handleContinue() {
    setMicStatus('ready')
    if (entryId) setMicReady(entryId, true)
  }

  function finalizePerformance() {
    if (finalizedRef.current) return
    finalizedRef.current = true
    var scores = vocalAnalyzerRef.current
      ? vocalAnalyzerRef.current.stop()
      : { pitchScore: 0, stabilityScore: 0, energyScore: 0, rhythmScore: 0, finalScore: 0, confidence: 'baja', confidenceScore: 0, hasEnoughData: false }
    var feedback = getFeedback(scores)
    setResults({ scores: scores, feedback: feedback })

    if (props.sessionId && props.entryId) {
      var payload = {
        session_id: props.sessionId,
        queue_entry_id: props.entryId,
        pitch_score: scores.pitchScore,
        rhythm_score: scores.rhythmScore,
        stability_score: scores.stabilityScore,
        energy_score: scores.energyScore,
        final_score: scores.finalScore,
        confidence: scores.confidence,
        confidence_score: scores.confidenceScore,
        feedback: feedback
      }
      saveVocalResult(payload)
    }
  }

  useEffect(function () {
    var stillCurrentSinger = props.currentSinger && String(props.currentSinger.id) === String(props.entryId)
    var isPerforming = stillCurrentSinger && props.screenMode === 'reactions'

    if (micStatus === 'ready' && isPerforming) {
      // El DJ recien inicio la reproduccion: arrancamos el analisis justo ahora.
      setMicStatus('singing')
      if (analyserRef.current && audioCtxRef.current) {
        vocalAnalyzerRef.current = createVocalAnalyzer(analyserRef.current, audioCtxRef.current)
        vocalAnalyzerRef.current.start()
      }
      return
    }

    if (micStatus === 'singing' && !isPerforming) {
      finalizePerformance()
    }
  }, [props.currentSinger, props.screenMode, micStatus])

  var hasSignal = peakSeenRef.current

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div
        className="max-w-sm w-full rounded-3xl border-2 p-8 text-center your-turn-pulse"
        style={{ background: 'var(--bg-card)', borderColor: '#F4D03F', boxShadow: '0 0 40px -8px rgba(244,208,63,0.6)' }}
      >
        <p className="text-6xl mb-3">🎤</p>
        <p className="text-2xl font-extrabold mb-1" style={{ color: '#F4D03F' }}>
          ¡ES TU TURNO!
        </p>
        <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{song}</p>

        {micStatus === 'idle' && (
          <>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              🎙️ Prepara tu micrófono
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              ACTIVAR MICRÓFONO
            </button>
          </>
        )}

        {micStatus === 'requesting' && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Solicitando permiso del micrófono...
          </p>
        )}

        {micStatus === 'denied' && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-magenta)' }}>
              🎤 Para usar Retroke Home Mic debes permitir el acceso al micrófono.
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Revisa el ícono de candado o el menú del navegador junto a la barra de direcciones, activa el permiso de micrófono para este sitio, y vuelve a intentar.
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: 'var(--accent-purple)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {micStatus === 'no-device' && (
          <p className="text-sm" style={{ color: 'var(--accent-magenta)' }}>
            No encontramos un micrófono en este dispositivo. Prueba con otro celular.
          </p>
        )}

        {micStatus === 'unsupported' && (
          <p className="text-sm" style={{ color: 'var(--accent-magenta)' }}>
            Tu navegador no permite usar el micrófono aquí. Prueba abriendo Retroke en Chrome o Safari actualizado.
          </p>
        )}

        {micStatus === 'error' && (
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--accent-magenta)' }}>
              No pudimos activar el micrófono{micError ? ': ' + micError : '.'}
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: 'var(--accent-purple)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {micStatus === 'testing' && (
          <div>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Di algo para probar tu micrófono
            </p>
            <div className="h-4 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-card-alt)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: level + '%',
                  background: level > 60 ? '#E9544A' : level > 12 ? '#7ED957' : '#F4D03F',
                  transition: 'width 0.08s linear'
                }}
              />
            </div>
            <p className="text-xs mb-4" style={{ color: hasSignal ? '#7ED957' : 'var(--text-muted)' }}>
              {hasSignal ? '🟢 Micrófono funcionando' : '🟡 No detectamos suficiente audio. Acércate y habla.'}
            </p>
            <button
              onClick={handleContinue}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              CONTINUAR
            </button>
          </div>
        )}

        {micStatus === 'ready' && !results && (
          <div>
            <p className="text-4xl mb-3">🎧</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#7ED957' }}>
              Micrófono listo
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Esperando que el DJ inicie tu presentación...
            </p>
          </div>
        )}

        {micStatus === 'singing' && !results && (
          <div>
            <div className="mx-auto mb-4 relative w-24 h-24 flex items-center justify-center listening-orb">
              <svg width="48" height="28" viewBox="0 0 48 28">
                <rect className="listening-bar" x="0" y="10" width="5" rx="2.5" fill="#F4D03F" />
                <rect className="listening-bar" x="8" y="5" width="5" rx="2.5" fill="#E91E8C" style={{ animationDelay: '0.1s' }} />
                <rect className="listening-bar" x="16" y="1" width="5" rx="2.5" fill="#8B5CF6" style={{ animationDelay: '0.2s' }} />
                <rect className="listening-bar" x="24" y="7" width="5" rx="2.5" fill="#F4D03F" style={{ animationDelay: '0.3s' }} />
                <rect className="listening-bar" x="32" y="3" width="5" rx="2.5" fill="#E91E8C" style={{ animationDelay: '0.15s' }} />
                <rect className="listening-bar" x="40" y="9" width="5" rx="2.5" fill="#8B5CF6" style={{ animationDelay: '0.25s' }} />
              </svg>
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: '#E91E8C' }}>
              Midiendo tu presentación
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ¡Canta frente a la pantalla principal! 🎉
            </p>
          </div>
        )}

        {results && (
          <div>
            <p className="text-lg font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
              🎤 TU RESULTADO RETROKE
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4 text-left">
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-card-alt)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>🎯 Afinación</p>
                <p className="text-lg font-bold" style={{ color: '#F4D03F' }}>{results.scores.pitchScore}/100</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-card-alt)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>🥁 Ritmo</p>
                <p className="text-lg font-bold" style={{ color: '#8B5CF6' }}>{results.scores.rhythmScore}/100</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-card-alt)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>🎵 Estabilidad</p>
                <p className="text-lg font-bold" style={{ color: '#E91E8C' }}>{results.scores.stabilityScore}/100</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-card-alt)' }}>
                <p className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>🔥 Energía</p>
                <p className="text-lg font-bold" style={{ color: '#7ED957' }}>{results.scores.energyScore}/100</p>
              </div>
            </div>
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(90deg, rgba(233,30,140,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(244,208,63,0.4)' }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>⭐ Retroke Score</p>
                {results.scores.confidence && (
                  <span
                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: results.scores.confidence === 'alta' ? '#7ED957' : results.scores.confidence === 'media' ? '#F4D03F' : '#E9544A',
                      background: 'rgba(255,255,255,0.08)'
                    }}
                  >
                    Confianza {results.scores.confidence}
                  </span>
                )}
              </div>
              <p className="text-4xl font-extrabold" style={{ color: '#F4D03F' }}>{results.scores.finalScore}/100</p>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-primary)' }}>{results.feedback}</p>
            {props.performanceId && (
              <ShareResultButton performanceId={props.performanceId} song={song} artistName={props.artistName} />
            )}
            <button
              onClick={props.onDone}
              className="w-full h-12 rounded-xl font-bold text-white mt-3"
              style={{ background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
            >
              Listo
            </button>
          </div>
        )}
      </div>

      <style>{`
        .your-turn-pulse { animation: yourTurnPulse 1.6s ease-in-out infinite; }
        .listening-orb {
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(139,92,246,0.25), rgba(233,30,140,0.12) 60%, transparent 75%);
          box-shadow: 0 0 0 2px rgba(244,208,63,0.5), 0 0 30px -4px rgba(139,92,246,0.7), inset 0 0 20px rgba(0,0,0,0.3);
          animation: listeningOrbGlow 1.8s ease-in-out infinite;
        }
        .listening-orb::before, .listening-orb::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          border: 1.5px solid rgba(244,208,63,0.5);
          animation: listeningRing 1.8s ease-out infinite;
        }
        .listening-orb::after {
          animation-delay: 0.6s;
        }
        @keyframes listeningOrbGlow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(244,208,63,0.5), 0 0 30px -4px rgba(139,92,246,0.7), inset 0 0 20px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 0 2px rgba(244,208,63,0.8), 0 0 42px 0px rgba(233,30,140,0.8), inset 0 0 20px rgba(0,0,0,0.3); }
        }
        @keyframes listeningRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .listening-bar {
          transform-origin: center;
          animation: listeningBarBounce 0.9s ease-in-out infinite;
          filter: drop-shadow(0 0 4px currentColor);
        }
        @keyframes listeningBarBounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.7); }
        }
        @keyframes yourTurnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

export default function RegisterForm() {
  var session = useKaraokeSession()
  var barName = session.barName
  var queue = session.queue
  var addToQueue = session.addToQueue
  var hasActiveSession = session.hasActiveSession
  var barLoading = session.barLoading
  var loadTimedOut = session.loadTimedOut
  var retryLoad = session.retryLoad
  var spaceParam = session.spaceParam
  var workspacePlan = session.workspacePlan
  var urlAttempts = session.urlAttempts
  var workspaceType = session.workspaceType
  var sessionId = session.sessionId
  var currentSinger = session.currentSinger
  var sendPresenceHeartbeat = session.sendPresenceHeartbeat
  var setMicReady = session.setMicReady

  var homeLimitReachedState = useState(false)
  var homeLimitReached = homeLimitReachedState[0]
  var setHomeLimitReached = homeLimitReachedState[1]
  var HOME_FREE_PARTICIPANT_LIMIT = 10

  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]

  var avatarState = useState(AVATARS[0])
  var avatar = avatarState[0]
  var setAvatar = avatarState[1]

  // Identidad liviana de participante (Fase B): no bloquea ni retrasa el
  // formulario — si esto falla o tarda, la inscripcion sigue funcionando
  // igual que siempre, solo que sin quedar enlazada a un historial.
  var participantState = useState(null)
  var participant = participantState[0]
  var setParticipant = participantState[1]

  var prefilledFromParticipantRef = useRef(false)

  useEffect(function () {
    var cancelled = false
    getOrCreateParticipant(supabase).then(function (p) {
      if (cancelled || !p) return
      setParticipant(p)
      if (!prefilledFromParticipantRef.current) {
        prefilledFromParticipantRef.current = true
        if (p.display_name) setName(p.display_name)
        if (p.avatar) setAvatar(p.avatar)
      }
    })
    return function () { cancelled = true }
  }, [])

  var songState = useState('')
  var song = songState[0]
  var setSong = songState[1]

  // Sugerencias de cancion/artista: cuando la persona termina de escribir,
  // se busca en iTunes hasta 4 posibles coincidencias reales (util sobre
  // todo con errores de tipeo en ingles) y se muestran como opciones para
  // elegir. Nunca se reemplaza el texto solo — la persona elige una
  // sugerencia o sigue escribiendo la suya tal cual.
  var detectedArtistState = useState('')
  var detectedArtist = detectedArtistState[0]
  var setDetectedArtist = detectedArtistState[1]

  var songSuggestionsState = useState([])
  var songSuggestions = songSuggestionsState[0]
  var setSongSuggestions = songSuggestionsState[1]

  var suggestionsLoadingState = useState(false)
  var suggestionsLoading = suggestionsLoadingState[0]
  var setSuggestionsLoading = suggestionsLoadingState[1]

  var lastResolvedSongRef = useRef('')
  var songLookupSeqRef = useRef(0)

  useEffect(function () {
    var raw = song.trim()
    if (raw.length < 3) {
      setSongSuggestions([])
      setSuggestionsLoading(false)
      return
    }
    if (raw.toLowerCase() === lastResolvedSongRef.current.toLowerCase()) return

    setDetectedArtist('')
    var mySeq = ++songLookupSeqRef.current
    setSuggestionsLoading(true)
    var timeoutId = setTimeout(function () {
      searchSongMatches(raw, 4).then(function (matches) {
        if (songLookupSeqRef.current !== mySeq) return
        setSuggestionsLoading(false)
        setSongSuggestions(matches)
      })
    }, 700)

    return function () { clearTimeout(timeoutId) }
  }, [song])

  function selectSongSuggestion(match) {
    lastResolvedSongRef.current = match.song
    setSong(match.song)
    setDetectedArtist(match.artist)
    setSongSuggestions([])
  }

  function dismissSongSuggestions() {
    lastResolvedSongRef.current = song.trim()
    setSongSuggestions([])
  }

  var youtubeState = useState('')
  var youtubeUrl = youtubeState[0]
  var setYoutubeUrl = youtubeState[1]

  var photoState = useState('')
  var photo = photoState[0]
  var setPhoto = photoState[1]

  var loadingPhotoState = useState(false)
  var loadingPhoto = loadingPhotoState[0]
  var setLoadingPhoto = loadingPhotoState[1]

  var submittedState = useState(false)
  var submitted = submittedState[0]
  var setSubmitted = submittedState[1]

  var myEntryIdState = useState(null)
  var myEntryId = myEntryIdState[0]
  var setMyEntryId = myEntryIdState[1]

  var restoringEntryState = useState(true)
  var restoringEntry = restoringEntryState[0]
  var setRestoringEntry = restoringEntryState[1]

  // Fase D: una vez que el participante termina su ronda, el servidor
  // registra la presentacion (performances) y anota su id en la fila de la
  // cola (queue_entries.performance_id). Lo consultamos con un poll liviano
  // en vez de suscripcion — el dato aparece una sola vez y no vale la pena
  // mantener un canal realtime abierto solo para esto.
  var myPerformanceIdState = useState(null)
  var myPerformanceId = myPerformanceIdState[0]
  var setMyPerformanceId = myPerformanceIdState[1]

  useEffect(function () {
    if (!myEntryId || myPerformanceId) return
    var cancelled = false
    var intervalId = setInterval(function () {
      supabase
        .from('queue_entries')
        .select('performance_id')
        .eq('id', myEntryId)
        .maybeSingle()
        .then(function (result) {
          if (cancelled) return
          if (result.data && result.data.performance_id) {
            setMyPerformanceId(result.data.performance_id)
            clearInterval(intervalId)
          }
        })
        .catch(function () {})
    }, 4000)
    return function () {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [myEntryId, myPerformanceId])

  // Sin esto, si la persona bloquea la pantalla o recarga (muy comun en
  // celulares mientras esperan su turno), myEntryId vive solo en memoria y
  // se pierde: la pagina vuelve a mostrar el formulario en blanco como si
  // nunca se hubiera inscrito, aunque su turno ya este por llegar. Lo
  // guardamos en localStorage, atado a esta sesion especifica de la noche,
  // y lo restauramos apenas carga la pagina.
  //
  // OJO: localStorage solo guarda texto, asi que el id (que en memoria es
  // un numero) vuelve como string despues de restaurarlo. Por eso todas las
  // comparaciones contra myEntryId en este archivo usan String(...) en vez
  // de === directo — si no, "¿es mi turno?" nunca daba true despues de que
  // el celular recargara la pagina o bloqueara la pantalla, y la persona se
  // quedaba esperando sin que le llegara nunca el aviso de "activa tu
  // microfono".
  var storageKey = sessionId ? 'retroke_entry_' + sessionId : null

  useEffect(function () {
    if (!storageKey) {
      setRestoringEntry(false)
      return
    }
    var saved = null
    try { saved = localStorage.getItem(storageKey) } catch (e) {}
    if (!saved) {
      setRestoringEntry(false)
      return
    }
    supabase
      .from('queue_entries')
      .select('id, status')
      .eq('id', saved)
      .eq('session_id', sessionId)
      .maybeSingle()
      .then(function (result) {
        // Solo tiene sentido restaurar "estas en la cola" si de verdad sigue
        // esperando su turno. El status pasa a 'completed' recien cuando el
        // DJ avanza al siguiente cantante — si nadie mas esta en la fila,
        // puede quedarse en 'result' indefinidamente sin que eso signifique
        // que sigue esperando. Por eso restauramos solo en los estados donde
        // "en cola" es realmente cierto.
        var activeStates = ['waiting', 'called']
        var stillActive = result.data && activeStates.indexOf(result.data.status) !== -1
        if (stillActive) {
          setMyEntryId(saved)
          setSubmitted(true)
        } else {
          try { localStorage.removeItem(storageKey) } catch (e) {}
        }
        setRestoringEntry(false)
      })
      .catch(function () {
        setRestoringEntry(false)
      })
  }, [storageKey])

  var optimisticPositionState = useState(null)
  var optimisticPosition = optimisticPositionState[0]
  var setOptimisticPosition = optimisticPositionState[1]

  var fileInputRef = useRef(null)

  function handlePhotoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setLoadingPhoto(true)
    resizeToSquareJpeg(file)
      .then(function (dataUrl) {
        setPhoto(dataUrl)
        setLoadingPhoto(false)
      })
      .catch(function () {
        setLoadingPhoto(false)
      })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !song.trim()) return
    if (containsProfanity(name)) return

    if (workspaceType === 'HOME' && workspacePlan !== 'PRO' && sessionId) {
      supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .then(function (result) {
          var total = result.count || 0
          if (total >= HOME_FREE_PARTICIPANT_LIMIT) {
            setHomeLimitReached(true)
            return
          }
          submitEntry()
        })
      return
    }

    submitEntry()
  }

  function submitEntry() {
    setOptimisticPosition(queue.length + 1)
    if (participant && participant.id) {
      touchParticipantProfile(supabase, participant.id, name.trim(), avatar)
    }
    addToQueue({
      name: name.trim(),
      avatar: avatar,
      song: song.trim(),
      artistName: detectedArtist || '',
      participantId: participant ? participant.id : null,
      youtubeUrl: youtubeUrl.trim(),
      videoUrl: youtubeUrl.trim(),
      photo: photo
    }).then(function (row) {
      if (row) {
        setMyEntryId(row.id)
        if (storageKey) {
          try { localStorage.setItem(storageKey, row.id) } catch (e) {}
        }
      }
    })
    setSubmitted(true)
  }

  var realIndex = myEntryId ? queue.findIndex(function (q) { return String(q.id) === String(myEntryId) }) : -1
  var position = realIndex !== -1 ? realIndex + 1 : (optimisticPosition || queue.length + 1)

  var isHome = workspaceType === 'HOME'
  var itsMyTurn = isHome && myEntryId && currentSinger && String(currentSinger.id) === String(myEntryId)

  useEffect(function () {
    if (!isHome || !myEntryId) return
    sendPresenceHeartbeat(myEntryId)
    var intervalId = setInterval(function () {
      sendPresenceHeartbeat(myEntryId)
    }, 15000)
    return function () { clearInterval(intervalId) }
  }, [isHome, myEntryId, sendPresenceHeartbeat])

  var showPerformanceState = useState(false)
  var showPerformance = showPerformanceState[0]
  var setShowPerformance = showPerformanceState[1]

  var showThanksState = useState(false)
  var showThanks = showThanksState[0]
  var setShowThanks = showThanksState[1]

  useEffect(function () {
    if (itsMyTurn) setShowPerformance(true)
  }, [itsMyTurn])

  if (restoringEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (loadTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Conexion lenta
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Esta tardando mas de lo normal. Revisa tu conexion e intenta de nuevo.
          </p>
          <button
            onClick={retryLoad}
            className="h-11 px-6 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-magenta)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (barLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!hasActiveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {barName || 'Este bar'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No hay una sesion de karaoke activa en este momento. Vuelve a intentarlo cuando empiece la noche.
          </p>
        </div>
      </div>
    )
  }

  if (showPerformance) {
    return (
      <YourTurnScreen
        name={name}
        song={song}
        artistName={detectedArtist}
        entryId={myEntryId}
        performanceId={myPerformanceId}
        sessionId={session.sessionId}
        currentSinger={currentSinger}
        screenMode={session.screenMode}
        onDone={function () {
          setShowPerformance(false)
          setShowThanks(true)
        }}
      />
    )
  }

  if (showThanks) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div
          className="max-w-sm w-full rounded-3xl border-2 p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(233,30,140,0.10))',
            borderColor: '#8B5CF6',
            boxShadow: '0 0 40px -8px rgba(139,92,246,0.6)'
          }}
        >
          <p className="text-6xl mb-3">🎉</p>
          <p className="text-2xl font-extrabold mb-3" style={{ color: '#F4D03F' }}>
            ¡Gracias por participar!
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Recuerda que puedes unirte nuevamente cuando quieras.
          </p>
          {myPerformanceId && (
            <ShareResultButton performanceId={myPerformanceId} song={song} artistName={detectedArtist} />
          )}
        </div>
      </div>
    )
  }

  if (homeLimitReached) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-yellow)' }}>
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Se llegó al límite de {HOME_FREE_PARTICIPANT_LIMIT} participantes
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            El plan Home Free permite hasta {HOME_FREE_PARTICIPANT_LIMIT} personas por sesión. Pídele al anfitrión
            que suba a Home PRO para participantes ilimitados.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl overflow-hidden"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : avatar}
          </div>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Ya estas en la cola, {name}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{song}</p>
          <p className="text-sm mt-4" style={{ color: 'var(--accent-yellow)' }}>
            Posicion {position} en la cola
          </p>
          {myPerformanceId && (
            <ShareResultButton performanceId={myPerformanceId} song={song} artistName={detectedArtist} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg-page)' }}>
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-3xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Anotate para cantar</p>
          </div>
          <ThemeToggle />
        </div>

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tu nombre</label>
        <input
          type="text"
          value={name}
          onChange={function (e) { setName(e.target.value) }}
          placeholder="Como quieres que te vean"
          required
          className="w-full h-11 rounded-lg px-3 border outline-none"
          style={{
            background: 'var(--bg-card-alt)',
            borderColor: containsProfanity(name) ? 'var(--accent-magenta)' : 'var(--border)',
            color: 'var(--text-primary)'
          }}
        />
        {containsProfanity(name) && (
          <p className="text-xs mt-1.5 mb-2.5" style={{ color: 'var(--accent-magenta)' }}>
            Ese nombre no se puede usar. Recuerda que hay público presente — elige otro, por favor 🙏
          </p>
        )}
        <div className="mb-4" />

        <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>
          Toma una selfie (opcional)
        </label>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl shrink-0 border-2"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--accent-magenta)' }}
          >
            {photo ? <img src={photo} alt="Selfie" className="w-full h-full object-cover" /> : avatar}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              onClick={function () { fileInputRef.current && fileInputRef.current.click() }}
              className="h-9 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
            >
              {loadingPhoto ? 'Procesando...' : photo ? 'Cambiar foto' : 'Tomar selfie'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={function () { setPhoto('') }}
                className="h-8 rounded-lg text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Quitar foto y usar avatar
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>
          {photo ? 'Avatar de respaldo' : 'Elige tu avatar'}
        </label>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {AVATARS.map(function (a) {
            return (
              <button
                type="button"
                key={a}
                onClick={function () { setAvatar(a) }}
                className="aspect-square rounded-lg flex items-center justify-center text-xl border-2 transition-colors"
                style={{
                  background: 'var(--bg-card-alt)',
                  borderColor: avatar === a ? 'var(--accent-magenta)' : 'transparent'
                }}
              >
                {a}
              </button>
            )
          })}
        </div>

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Nombre de la cancion
        </label>
        <input
          type="text"
          value={song}
          onChange={function (e) { setSong(e.target.value) }}
          placeholder="Ej: Bohemian Rhapsody"
          required
          className="w-full h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        {suggestionsLoading && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Buscando coincidencias...
          </p>
        )}

        {!suggestionsLoading && songSuggestions.length > 0 && (
          <div className="mt-1.5 mb-4">
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              ¿Es alguna de estas? Toca para elegir, o sigue escribiendo la tuya
            </p>
            <div className="flex flex-col gap-1.5">
              {songSuggestions.map(function (s) {
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={function () { selectSongSuggestion(s) }}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left border"
                    style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)' }}
                  >
                    {s.artwork ? (
                      <img src={s.artwork} alt="" className="w-9 h-9 rounded shrink-0 object-cover" />
                    ) : (
                      <span
                        className="w-9 h-9 rounded shrink-0 flex items-center justify-center text-sm"
                        style={{ background: 'var(--bg-card)' }}
                      >
                        🎵
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.song}
                      </span>
                      <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {s.artist}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={dismissSongSuggestions}
              className="text-xs underline mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Ninguna, dejar lo que escribí
            </button>
          </div>
        )}

        {!suggestionsLoading && songSuggestions.length === 0 && detectedArtist && (
          <p className="text-xs mt-1.5 mb-4" style={{ color: '#7ED957' }}>
            ✓ {detectedArtist}
          </p>
        )}

        {!suggestionsLoading && songSuggestions.length === 0 && !detectedArtist && (
          <div className="mb-4" />
        )}

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Link de tu video karaoke en YouTube (opcional)
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={function (e) { setYoutubeUrl(e.target.value) }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        {youtubeUrl.trim() && parseYoutubeId(youtubeUrl) && (
          <p className="text-xs mt-1.5 mb-5" style={{ color: 'var(--accent-green)' }}>
            ✓ Video reconocido, se usara para tu presentacion
          </p>
        )}
        {youtubeUrl.trim() && !parseYoutubeId(youtubeUrl) && (
          <p className="text-xs mt-1.5 mb-5" style={{ color: 'var(--accent-magenta)' }}>
            No reconocemos ese link, revisa que sea de YouTube
          </p>
        )}
        {!youtubeUrl.trim() && <div className="mb-5" />}

        <button
          type="submit"
          disabled={containsProfanity(name)}
          className="w-full h-11 rounded-lg font-medium text-white disabled:opacity-40"
          style={{ background: 'var(--accent-magenta)' }}
        >
          Sumarme a la cola
        </button>

        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Estas en la posicion {position} de la cola
        </p>
      </form>
    </div>
  )
}
