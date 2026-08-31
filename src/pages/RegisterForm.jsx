import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useKaraokeSession, parseYoutubeId } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import { createVocalAnalyzer, getFeedback } from '../lib/vocalAnalysis'
import { containsProfanity } from '../lib/profanityFilter'
import { searchSongMatches } from '../lib/songLookup'
import { getOrCreateParticipant, touchParticipantProfile, signInWithGoogle, signOutParticipant } from '../lib/participant'
import { buildShareText } from '../lib/shareCard'
import { computeNotaFinal, LEVELS } from '../lib/gamification'
import { isMemeReaction } from '../lib/memeReactions'
import { getGlobalXpRank } from '../lib/ranking'
import { loadFollowCounts } from '../lib/follows'
import ShareResultCard from '../components/ShareResultCard'
import ShareButton from '../components/share/ShareButton'
import RetroNeonBg from '../components/RetroNeonBg'

const AVATARS = ['🔥', '🦄', '👽', '🐸', '🎤', '🐙', '⭐', '👑', '🍄', '🌊', '🎸', '🦋']

// Reacciones reales de una presentacion puntual, para la tarjeta "Momento
// Retroke" (ShareResultCard) -- mismo criterio (session_id + queue_entry_id)
// y misma logica de conteo (top 3 emojis mas usados, memes excluidos) que ya
// usa DisplayResult.jsx en la pantalla de resultado del TV (reactionStats).
// Se centraliza aca porque YourTurnScreen y PerformanceShareScreen la
// necesitan por separado. Nunca inventa nada: si falta algun id o no hubo
// reacciones, devuelve top:[] y la tarjeta simplemente no muestra ese bloque.
function fetchTopReactions(sessionId, queueEntryId) {
  if (!sessionId || !queueEntryId) return Promise.resolve({ total: null, top: [] })
  return supabase
    .from('reactions')
    .select('emoji')
    .eq('session_id', sessionId)
    .eq('queue_entry_id', queueEntryId)
    .then(function (result) {
      var rows = result.data || []
      var counts = {}
      rows.forEach(function (r) {
        if (isMemeReaction(r.emoji)) return
        counts[r.emoji] = (counts[r.emoji] || 0) + 1
      })
      var top = Object.keys(counts)
        .map(function (emoji) { return { emoji: emoji, count: counts[emoji] } })
        .sort(function (a, b) { return b.count - a.count })
        .slice(0, 3)
      // total excluye memes -- mismo criterio que el tally de arriba, para
      // que el numero que se muestra junto a los emojis en la tarjeta
      // cuadre con esos mismos emojis.
      var total = rows.filter(function (r) { return !isMemeReaction(r.emoji) }).length
      return { total: total, top: top }
    })
    .catch(function () { return { total: null, top: [] } })
}

// Nivel, puesto en el ranking global (XP) y seguidores/seguidos reales del
// cantante, para el bloque de perfil de la tarjeta "Momento Retroke".
// Mismo criterio que el resto de la app (ranking.js/follows.js): nunca se
// inventa un numero -- si participant_stats todavia no tiene fila, rank
// queda null y la tarjeta simplemente no muestra ese chip.
function fetchProfileStats(participantId) {
  if (!participantId) return Promise.resolve({ levelName: '', rank: null, followCounts: null })
  return supabase
    .from('participant_stats')
    .select('level_name, xp')
    .eq('participant_id', participantId)
    .maybeSingle()
    .then(function (result) {
      var levelName = result.data && result.data.level_name ? result.data.level_name : LEVELS[0].name
      var xp = result.data ? result.data.xp : 0
      return Promise.all([
        getGlobalXpRank(supabase, xp),
        loadFollowCounts(supabase, participantId)
      ]).then(function (r) {
        return { levelName: levelName, rank: r[0], followCounts: r[1] }
      })
    })
    .catch(function () { return { levelName: '', rank: null, followCounts: null } })
}

function resizeToSquareJpeg(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        var size = 480
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
// Fase 14: delega en ShareButton (mode="link") en vez de tener su propia
// logica -- ver components/share/ShareButton.jsx.
function ShareResultButton(props) {
  return (
    <ShareButton
      mode="link"
      performanceId={props.performanceId}
      song={props.song}
      artistName={props.artistName || null}
      notaFinal={null}
      label="Compartir mi resultado 🔗"
      heightClass="h-11"
      className="mt-4"
    />
  )
}

function YourTurnScreen(props) {
  var name = props.name
  var song = props.song
  var sessionId = props.sessionId
  var entryId = props.entryId
  var workspaceType = props.workspaceType
  var placeName = props.placeName
  var performanceId = props.performanceId
  var setMicReady = useKaraokeSession().setMicReady
  // El bar/workspace activo viaja en el query string -- lo propagamos al
  // link de "Ver mi perfil" para que, al volver, no se pierda el contexto
  // de la sesion (sin esto, volver mandaba siempre al bar por defecto).
  var perfilHref = '/perfil' + (useLocation().search || '')

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

  // Tarjeta compartible en vivo: se muestra apenas hay resultado, para que
  // se pueda repostear como imagen a una historia de Instagram/WhatsApp/
  // TikTok sin tener que esperar a que termine toda la ronda (calificacion
  // del publico, XP, logros — eso llega despues via el link de /r/:id).
  var shareCardRef = useRef(null)

  // La tarjeta vive en su propia pantalla (no mezclada con el detalle de
  // puntajes) para que se vea grande y limpia, lista para capturarse como
  // imagen 9:16 igual a una story.
  var showShareCardStateHook = useState(false)
  var showShareCard = showShareCardStateHook[0]
  var setShowShareCard = showShareCardStateHook[1]

  // Nivel actual del participante, para mostrarlo en la tarjeta. Es el
  // nivel de ANTES de esta ronda (el XP de esta presentacion recien se
  // calcula despues, cuando el DJ avanza al siguiente cantante) — igual
  // sirve para mostrar algo real en vez de nada. Puesto en el ranking y
  // seguidores/seguidos viajan juntos (fetchProfileStats).
  var levelNameStateHook = useState('')
  var levelName = levelNameStateHook[0]
  var setLevelName = levelNameStateHook[1]

  var profileStatsHook = useState({ rank: null, followCounts: null })
  var profileStats = profileStatsHook[0]
  var setProfileStats = profileStatsHook[1]

  // Reacciones reales para la tarjeta "Momento Retroke" -- se piden apenas
  // hay resultado (mismo momento en que se muestra la tarjeta), no antes.
  var topReactionsStateHook = useState({ total: null, top: [] })
  var topReactionsData = topReactionsStateHook[0]
  var setTopReactionsData = topReactionsStateHook[1]

  useEffect(function () {
    if (!results) return
    var cancelled = false
    fetchTopReactions(sessionId, entryId).then(function (r) {
      if (!cancelled) setTopReactionsData(r)
    })
    return function () { cancelled = true }
  }, [results, sessionId, entryId])

  useEffect(function () {
    if (!props.participantId) return
    var cancelled = false
    fetchProfileStats(props.participantId).then(function (r) {
      if (cancelled) return
      setLevelName(r.levelName || LEVELS[0].name)
      setProfileStats({ rank: r.rank, followCounts: r.followCounts })
    })
    return function () { cancelled = true }
  }, [props.participantId])

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

  // Pantalla dedicada a la tarjeta compartible — separada del detalle de
  // puntajes para que la tarjeta se vea grande, limpia y en formato 9:16
  // (igual a una story), lista para capturarse como imagen.
  if (showShareCard && results) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 gap-5 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
        <RetroNeonBg />
        <div className="relative z-10 w-full max-w-sm">
          <ShareResultCard
            ref={shareCardRef}
            singerName={name}
            avatar={props.avatar}
            photoUrl={props.photo || null}
            song={song}
            artistName={props.artistName}
            artworkUrl={props.artworkUrl}
            notaFinal={computeNotaFinal(null, results.scores.finalScore)}
            vocalScore={results.scores.finalScore}
            subScores={{
              pitchScore: results.scores.pitchScore,
              rhythmScore: results.scores.rhythmScore,
              stabilityScore: results.scores.stabilityScore,
              energyScore: results.scores.energyScore
            }}
            confidence={results.scores.confidence}
            levelName={levelName}
            rank={profileStats.rank}
            followCounts={profileStats.followCounts}
            mode={workspaceType}
            placeName={placeName}
            topReactions={topReactionsData.top}
            totalReactions={topReactionsData.total}
            createdAt={new Date().toISOString()}
          />
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3 relative z-10">
          <ShareButton
            mode="image"
            performanceId={performanceId}
            cardRef={shareCardRef}
            filename={'retroke-' + (name || 'resultado') + '.png'}
            title="Mi resultado en Retroke"
            text={buildShareText({ song: song, artistName: props.artistName || null, notaFinal: results ? computeNotaFinal(null, results.scores.finalScore) : null })}
          />
          <button
            type="button"
            onClick={function () { setShowShareCard(false) }}
            className="w-full h-11 rounded-xl font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Volver a mi resultado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <RetroNeonBg />
      <div
        className="max-w-sm w-full rounded-3xl border-2 p-8 text-center your-turn-pulse relative z-10"
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

            <button
              type="button"
              onClick={function () { setShowShareCard(true) }}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Compartir Tarjeta 📲
            </button>

            <button
              onClick={props.onDone}
              className="w-full h-12 rounded-xl font-bold text-white mt-3"
              style={{ background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
            >
              Listo
            </button>

            <Link
              to={perfilHref}
              className="block text-center text-xs mt-3 underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Ver mi perfil →
            </Link>
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

// Tarjeta compartible accesible DESPUES de cantar, para cualquier modalidad
// (Home, DJ, Bar) -- no solo Retroke Home. Antes, una vez que la persona
// pasaba a la pantalla de "ya estas en la cola" / "gracias por participar",
// solo se ofrecia compartir un LINK (ShareResultButton), nunca la imagen con
// el puntaje. En Home eso pasaba porque la tarjeta con imagen solo vivia
// dentro de YourTurnScreen, antes de tocar "Listo". En DJ/Bar pasaba porque
// nunca hubo tarjeta con imagen en absoluto: no hay analisis de voz por
// microfono ahi (eso es exclusivo de Home), asi que solo existia el puntaje
// del publico (nota_final en la tabla performances).
//
// Esta pantalla busca esos datos directamente desde la base (performances +
// vocal_results si existen) apenas se abre, y arma la misma ShareResultCard
// que ya se usa en Home y en /r/:id. Si no hay puntaje de voz (DJ/Bar), la
// tarjeta simplemente no muestra esa fila -- ShareResultCard ya esta hecha
// para eso (ver hasVocalScore / activeSubScores ahi).
function PerformanceShareScreen(props) {
  var performanceId = props.performanceId
  var participantId = props.participantId
  var fallbackName = props.name
  var fallbackAvatar = props.avatar
  var fallbackPhoto = props.photo
  var fallbackSong = props.song
  var workspaceType = props.workspaceType
  var placeName = props.placeName
  var onBack = props.onBack
  var onRestart = props.onRestart

  var dataState = useState(null)
  var data = dataState[0]
  var setData = dataState[1]

  var levelNameState = useState('')
  var levelName = levelNameState[0]
  var setLevelName = levelNameState[1]

  var profileStatsState = useState({ rank: null, followCounts: null })
  var profileStats = profileStatsState[0]
  var setProfileStats = profileStatsState[1]

  var shareCardRef = useRef(null)

  useEffect(function () {
    var cancelled = false
    supabase
      .from('performances')
      .select('nota_final, vocal_score, vocal_confidence, artist_name, artwork_url, queue_entry_id, session_id, created_at')
      .eq('id', performanceId)
      .maybeSingle()
      .then(function (result) {
        if (cancelled || !result.data) return
        var perf = result.data

        function finish(subScores, reactionsData) {
          if (cancelled) return
          setData({
            notaFinal: perf.nota_final,
            vocalScore: perf.vocal_score,
            confidence: perf.vocal_confidence,
            artistName: perf.artist_name || '',
            artworkUrl: perf.artwork_url || '',
            subScores: subScores || null,
            topReactions: (reactionsData && reactionsData.top) || [],
            totalReactions: reactionsData ? reactionsData.total : null,
            createdAt: perf.created_at || null
          })
        }

        var reactionsPromise = fetchTopReactions(perf.session_id, perf.queue_entry_id)

        if (!perf.queue_entry_id) {
          reactionsPromise.then(function (r) { finish(null, r) })
          return
        }

        Promise.all([
          supabase
            .from('vocal_results')
            .select('pitch_score, rhythm_score, stability_score, energy_score')
            .eq('queue_entry_id', perf.queue_entry_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          reactionsPromise
        ])
          .then(function (results) {
            var vr = results[0]
            var reactionsData = results[1]
            var subScores = vr.data
              ? {
                  pitchScore: vr.data.pitch_score,
                  rhythmScore: vr.data.rhythm_score,
                  stabilityScore: vr.data.stability_score,
                  energyScore: vr.data.energy_score
                }
              : null
            finish(subScores, reactionsData)
          })
          .catch(function () { finish(null, null) })
      })
      .catch(function () {})
    return function () { cancelled = true }
  }, [performanceId])

  useEffect(function () {
    if (!participantId) return
    var cancelled = false
    fetchProfileStats(participantId).then(function (r) {
      if (cancelled) return
      setLevelName(r.levelName || LEVELS[0].name)
      setProfileStats({ rank: r.rank, followCounts: r.followCounts })
    })
    return function () { cancelled = true }
  }, [participantId])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 gap-5 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <RetroNeonBg />
      <div className="relative z-10 w-full max-w-sm">
        <ShareResultCard
          ref={shareCardRef}
          singerName={fallbackName}
          avatar={fallbackAvatar}
          photoUrl={fallbackPhoto || null}
          song={fallbackSong}
          artistName={data.artistName}
          artworkUrl={data.artworkUrl}
          notaFinal={data.notaFinal}
          vocalScore={data.vocalScore}
          subScores={data.subScores}
          confidence={data.confidence}
          levelName={levelName}
          rank={profileStats.rank}
          followCounts={profileStats.followCounts}
          mode={workspaceType}
          placeName={placeName}
          topReactions={data.topReactions}
          totalReactions={data.totalReactions}
          createdAt={data.createdAt}
        />
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3 relative z-10">
        <ShareButton
          mode="image"
          performanceId={performanceId}
          cardRef={shareCardRef}
          filename={'retroke-' + (fallbackName || 'resultado') + '.png'}
          title="Mi resultado en Retroke"
          text={buildShareText({ song: fallbackSong, artistName: data ? data.artistName : '', notaFinal: data ? data.notaFinal : null })}
        />
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="w-full h-11 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
          >
            Cantar de nuevo
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="w-full h-11 rounded-xl font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}

export default function RegisterForm() {
  // Igual que en YourTurnScreen: se propaga el query string actual
  // (?bar=... / ?ws=...) al link de "Mi perfil" para no perder el
  // contexto del local al volver.
  var perfilHref = '/perfil' + (useLocation().search || '')

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

  // Pantalla previa "Iniciar sesion con Google / Cantar como invitado":
  // solo se muestra la PRIMERA vez que este celular usa Retroke. Si ya
  // existe un id de dispositivo guardado (ya canto antes aca) o ya hay una
  // sesion de Google activa, se salta directo al formulario — no tiene
  // sentido volver a preguntar cada vez que alguien escanea el QR.
  var entryChoiceState = useState(function () {
    try {
      if (localStorage.getItem('retroke_device_id')) return 'skip'
    } catch (e) {}
    return 'pending'
  })
  var entryChoice = entryChoiceState[0]
  var setEntryChoice = entryChoiceState[1]

  var googleConnectingState = useState(false)
  var googleConnecting = googleConnectingState[0]
  var setGoogleConnecting = googleConnectingState[1]

  useEffect(function () {
    if (entryChoice !== 'pending') return
    var cancelled = false
    supabase.auth.getUser().then(function (result) {
      if (cancelled) return
      if (result.data && result.data.user) setEntryChoice('skip')
    })
    var subscription = supabase.auth.onAuthStateChange(function (_event, session) {
      if (session) setEntryChoice('skip')
    })
    return function () {
      cancelled = true
      if (subscription && subscription.data && subscription.data.subscription) {
        subscription.data.subscription.unsubscribe()
      }
    }
  }, [entryChoice])

  function handleGoogleFromEntry() {
    setGoogleConnecting(true)
    signInWithGoogle(supabase, window.location.href).then(function (result) {
      if (result.error) setGoogleConnecting(false)
    })
  }

  // Estado de sesion para el boton del header del formulario: si ya esta
  // conectado con Google se ofrece "Cerrar sesion", si no, "Ingresar". Se
  // mantiene al dia con un listener ademas de la lectura inicial, para que
  // el boton cambie solo apenas vuelve el redirect de Google.
  var authUserState = useState(null)
  var authUser = authUserState[0]
  var setAuthUser = authUserState[1]

  var headerGoogleConnectingState = useState(false)
  var headerGoogleConnecting = headerGoogleConnectingState[0]
  var setHeaderGoogleConnecting = headerGoogleConnectingState[1]

  useEffect(function () {
    var cancelled = false
    supabase.auth.getUser().then(function (result) {
      if (cancelled) return
      setAuthUser(result.data && result.data.user ? result.data.user : null)
    })
    var subscription = supabase.auth.onAuthStateChange(function (_event, authSession) {
      setAuthUser(authSession ? authSession.user : null)
      setHeaderGoogleConnecting(false)
    })
    return function () {
      cancelled = true
      if (subscription && subscription.data && subscription.data.subscription) {
        subscription.data.subscription.unsubscribe()
      }
    }
  }, [])

  function handleHeaderGoogle() {
    setHeaderGoogleConnecting(true)
    signInWithGoogle(supabase, window.location.href).then(function (result) {
      if (result.error) setHeaderGoogleConnecting(false)
    })
  }

  function handleHeaderSignOut() {
    signOutParticipant(supabase).then(function () {
      setAuthUser(null)
    })
  }

  useEffect(function () {
    if (entryChoice === 'pending') return
    var cancelled = false
    getOrCreateParticipant(supabase).then(function (p) {
      if (cancelled || !p) return
      setParticipant(p)
      if (!prefilledFromParticipantRef.current) {
        prefilledFromParticipantRef.current = true
        if (p.display_name) setName(p.display_name)
        if (p.avatar) setAvatar(p.avatar)
        // Si ya subio una foto de perfil desde /perfil, se usa como selfie
        // por defecto -- asi no tiene que volver a tomarsela cada vez que
        // se anota para cantar. Igual puede cambiarla o quitarla en el
        // formulario como antes.
        if (p.photo_url) setPhoto(p.photo_url)
      }
    })
    return function () { cancelled = true }
  }, [entryChoice])

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

  // Portada de album, para la tarjeta compartible — viene de la misma
  // sugerencia de iTunes que ya trae el artista.
  var detectedArtworkState = useState('')
  var detectedArtwork = detectedArtworkState[0]
  var setDetectedArtwork = detectedArtworkState[1]

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
    setDetectedArtwork('')
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
    setDetectedArtwork(match.artwork || '')
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
        // Restauramos mientras la ronda no haya terminado ('completed' es el
        // unico estado final). Antes solo se restauraba en 'waiting'/'called',
        // lo que perdia el vinculo con la ronda si el celular se reconectaba
        // ya en 'reactions'/'playing'/'rating'/'result' (por ejemplo, si la
        // pantalla se bloqueo justo cuando el DJ lo llamo) — y sin ese
        // vinculo, itsMyTurn nunca podia volver a calcularse, asi que el
        // aviso de "activa tu microfono" no le llegaba nunca a esa persona.
        var stillActive = result.data && result.data.status !== 'completed'
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
      artworkUrl: detectedArtwork || '',
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

  // Si el participante ya paso por "es tu turno" y llego a "gracias por
  // participar", pero el DJ todavia no llama al siguiente cantante,
  // currentSinger.id sigue siendo el mismo myEntryId. Antes, si el celular
  // recargaba la pagina en ese punto (se bloqueo la pantalla, se cerro el
  // navegador sin querer, etc.), itsMyTurn volvia a dar true y la persona
  // caia de nuevo en "ES TU TURNO!" con el microfono para activar, como si
  // nunca hubiera cantado. Guardamos en localStorage que esta ronda
  // especifica (este entryId) ya se canto, para que un reload se quede en
  // "gracias por participar" hasta que el DJ efectivamente avance.
  function markEntryFinished(entryId) {
    if (!entryId) return
    try { localStorage.setItem('retroke_finished_' + entryId, '1') } catch (e) {}
  }

  function isEntryFinished(entryId) {
    if (!entryId) return false
    try { return localStorage.getItem('retroke_finished_' + entryId) === '1' } catch (e) { return false }
  }

  // Bug reportado: si alguien termina de cantar (queue_entries.status sigue
  // sin llegar a 'completed' hasta que el DJ avanza a la siguiente persona)
  // y escanea el QR de nuevo, retroke_entry_<sessionId> en localStorage
  // sigue apuntando a esa entrada, asi que la pagina lo devolvia siempre a
  // "Ya estas en la cola" -- aunque myPerformanceId ya probaba que esa
  // ronda estaba terminada. Este reset limpia todo el rastro de la
  // inscripcion anterior (localStorage + estado en memoria) para volver al
  // formulario en blanco y poder anotarse de nuevo, sin esperar a que el
  // DJ cierre la ronda.
  function handleRestart() {
    if (storageKey) {
      try { localStorage.removeItem(storageKey) } catch (e) {}
    }
    if (myEntryId) {
      try { localStorage.removeItem('retroke_finished_' + myEntryId) } catch (e) {}
    }
    setMyEntryId(null)
    setMyPerformanceId(null)
    setSubmitted(false)
    setShowThanks(false)
    setShowShareCardScreen(false)
    setShowPerformance(false)
    setOptimisticPosition(null)
  }

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

  // Tarjeta compartible accesible desde "ya estas en la cola" / "gracias
  // por participar", para cualquier modalidad (antes solo existia el link).
  var showShareCardScreenState = useState(false)
  var showShareCardScreen = showShareCardScreenState[0]
  var setShowShareCardScreen = showShareCardScreenState[1]

  useEffect(function () {
    if (!itsMyTurn) return
    if (isEntryFinished(myEntryId)) {
      setShowThanks(true)
      return
    }
    setShowPerformance(true)
  }, [itsMyTurn, myEntryId])

  if (entryChoice === 'pending') {
    return (
      <div className="entry-choice-page min-h-screen flex items-center justify-center px-5 py-10" style={{ background: 'var(--bg-page)' }}>
        <style>{`
          .entry-choice-page { position: relative; overflow: hidden; }
          .entry-choice-card {
            position: relative;
            width: 100%;
            max-width: 26rem;
            border-radius: 28px;
            overflow: hidden;
            background: radial-gradient(circle at 50% 0%, #2c1440 0%, #14081f 55%, #05030a 100%);
            border: 2px solid rgba(233, 30, 140, 0.55);
            box-shadow: 0 0 0 1px rgba(139,92,246,0.2), 0 0 60px -10px rgba(233,30,140,0.45);
            padding: clamp(28px, 6vw, 44px) clamp(22px, 6vw, 36px) clamp(26px, 6vw, 34px);
            text-align: center;
          }
          .entry-choice-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px);
            pointer-events: none;
          }
          .entry-choice-card::after {
            content: '';
            position: absolute;
            top: -35%;
            left: -15%;
            width: 130%;
            height: 55%;
            background: radial-gradient(ellipse at center, rgba(139,92,246,0.28) 0%, transparent 70%);
            pointer-events: none;
          }
          .entry-choice-mic {
            position: relative;
            font-size: clamp(40px, 10vw, 52px);
            line-height: 1;
            filter: drop-shadow(0 0 18px rgba(233, 30, 140, 0.65));
            animation: entryMicFloat 3.2s ease-in-out infinite;
          }
          @keyframes entryMicFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .entry-choice-title {
            position: relative;
            font-size: clamp(22px, 5.5vw, 28px);
            font-weight: 800;
            margin-top: 10px;
            background: linear-gradient(90deg, #F4D03F, #E91E8C 55%, #8B5CF6);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 0.01em;
          }
          .entry-choice-sub {
            position: relative;
            font-size: clamp(13px, 3.6vw, 14.5px);
            color: rgba(255,255,255,0.68);
            margin-top: 8px;
            margin-bottom: clamp(22px, 6vw, 30px);
            line-height: 1.5;
          }
          .entry-choice-google-btn {
            position: relative;
            width: 100%;
            height: 52px;
            border-radius: 14px;
            background: #fff;
            color: #1f1f1f;
            font-weight: 700;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -8px rgba(0,0,0,0.5);
            transition: transform 0.15s ease;
          }
          .entry-choice-google-btn:active { transform: scale(0.98); }
          .entry-choice-guest-btn {
            position: relative;
            width: 100%;
            height: 52px;
            border-radius: 14px;
            margin-top: 12px;
            font-weight: 800;
            font-size: 15px;
            color: #fff;
            background: linear-gradient(90deg, #E91E8C, #8B5CF6);
            box-shadow: 0 0 24px -6px rgba(233,30,140,0.6);
            transition: transform 0.15s ease;
          }
          .entry-choice-guest-btn:active { transform: scale(0.98); }
          .entry-choice-divider {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 16px 0;
            color: rgba(255,255,255,0.35);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .entry-choice-divider::before, .entry-choice-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,0.12);
          }
          .entry-choice-footnote {
            position: relative;
            font-size: 11.5px;
            color: rgba(255,255,255,0.4);
            margin-top: 18px;
            line-height: 1.5;
          }
        `}</style>

        <div className="entry-choice-card">
          <p className="entry-choice-mic">🎤</p>
          <p className="entry-choice-title">¡Bienvenido a Retroke!</p>
          <p className="entry-choice-sub">
            Conecta tu cuenta para guardar tu nivel, tus logros y tu historial aunque cambies de celular. O si prefieres, entra directo a cantar.
          </p>

          <button
            type="button"
            onClick={handleGoogleFromEntry}
            disabled={googleConnecting}
            className="entry-choice-google-btn"
          >
            {!googleConnecting && (
              <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 2.9l6-6C34.9 5.1 29.7 3 24 3c-7.6 0-14.1 4.3-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 45c5.6 0 10.7-1.9 14.7-5.2l-6.8-5.7C29.7 35.6 27 36.5 24 36.5c-5.3 0-9.7-3.3-11.3-7.9l-6.7 5.2C9.8 40.6 16.4 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.8 5.7C40.2 37 44 31.4 44 24c0-1.4-.1-2.7-.4-3.5z" />
              </svg>
            )}
            {googleConnecting ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div className="entry-choice-divider">o</div>

          <button
            type="button"
            onClick={function () { setEntryChoice('skip') }}
            className="entry-choice-guest-btn"
          >
            Cantar como invitado 🎤
          </button>

          <p className="entry-choice-footnote">
            Sin cuenta igual puedes cantar y compartir tu tarjeta — solo que si cambias de celular, empiezas de nuevo. Puedes conectar tu cuenta más tarde desde tu perfil.
          </p>
        </div>
      </div>
    )
  }

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
        avatar={avatar}
        photo={photo}
        song={song}
        artistName={detectedArtist}
        artworkUrl={detectedArtwork}
        participantId={participant ? participant.id : null}
        entryId={myEntryId}
        performanceId={myPerformanceId}
        sessionId={session.sessionId}
        currentSinger={currentSinger}
        screenMode={session.screenMode}
        workspaceType={session.workspaceType}
        placeName={barName}
        onDone={function () {
          markEntryFinished(myEntryId)
          setShowPerformance(false)
          setShowThanks(true)
        }}
      />
    )
  }

  if (showShareCardScreen && myPerformanceId) {
    return (
      <PerformanceShareScreen
        performanceId={myPerformanceId}
        name={name}
        avatar={avatar}
        photo={photo}
        song={song}
        participantId={participant ? participant.id : null}
        workspaceType={session.workspaceType}
        placeName={barName}
        onBack={function () { setShowShareCardScreen(false) }}
        onRestart={handleRestart}
      />
    )
  }

  if (showThanks) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
        <RetroNeonBg />
        <div
          className="max-w-sm w-full rounded-3xl border-2 p-8 text-center relative z-10"
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
            <>
              <button
                type="button"
                onClick={function () { setShowShareCardScreen(true) }}
                className="w-full h-11 rounded-xl font-bold text-white mt-4"
                style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
              >
                Ver mi tarjeta 📲
              </button>
              <ShareResultButton performanceId={myPerformanceId} song={song} artistName={detectedArtist} />
              <button
                type="button"
                onClick={handleRestart}
                className="w-full h-11 rounded-xl font-medium mt-3"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cantar de nuevo
              </button>
            </>
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
      <div className="min-h-screen flex items-center justify-center px-6 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
        <RetroNeonBg />
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center relative z-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl overflow-hidden"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : avatar}
          </div>
          {myPerformanceId ? (
            <>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Ya cantaste, {name}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{song}</p>
              <button
                type="button"
                onClick={function () { setShowShareCardScreen(true) }}
                className="w-full h-11 rounded-xl font-bold text-white mt-4"
                style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
              >
                Ver mi tarjeta 📲
              </button>
              <ShareResultButton performanceId={myPerformanceId} song={song} artistName={detectedArtist} />
              <button
                type="button"
                onClick={handleRestart}
                className="w-full h-11 rounded-xl font-medium mt-3"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cantar de nuevo
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Ya estas en la cola, {name}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{song}</p>
              <p className="text-sm mt-4" style={{ color: 'var(--accent-yellow)' }}>
                Posicion {position} en la cola
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 relative" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <RetroNeonBg />
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-3xl border p-6 relative z-10"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <style>{`
          .form-header-auth-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 34px;
            padding: 0 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            transition: transform 0.15s ease;
          }
          .form-header-auth-btn:active { transform: scale(0.96); }
          .form-header-auth-btn-google {
            background: #fff;
            color: #1f1f1f;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 0 16px -4px rgba(233,30,140,0.5);
          }
          .form-header-auth-btn-logout {
            background: rgba(233,30,140,0.1);
            color: #E91E8C;
            border: 1px solid rgba(233,30,140,0.5);
          }
          .form-header-profile-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            flex-shrink: 0;
            overflow: hidden;
            background: rgba(139,92,246,0.14);
            border: 1.5px solid rgba(139,92,246,0.55);
            color: #8B5CF6;
            box-shadow: 0 0 14px -4px rgba(139,92,246,0.7);
            transition: transform 0.15s ease;
          }
          .form-header-profile-btn:active { transform: scale(0.92); }
          .form-header-profile-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 999px;
          }
          .form-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
          }
          .form-header-bar {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            min-width: 0;
          }
          .form-header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }
          .form-header-title {
            font-size: 23px;
            font-weight: 800;
            letter-spacing: -0.01em;
            line-height: 1.15;
          }
        `}</style>

        <div className="mb-5">
          <div className="form-header-top">
            <p className="form-header-bar" style={{ color: 'var(--text-muted)' }}>{barName}</p>
            <div className="form-header-actions">
              {authUser ? (
                <button type="button" onClick={handleHeaderSignOut} className="form-header-auth-btn form-header-auth-btn-logout">
                  Cerrar sesión
                </button>
              ) : (
                <button type="button" onClick={handleHeaderGoogle} disabled={headerGoogleConnecting} className="form-header-auth-btn form-header-auth-btn-google">
                  {!headerGoogleConnecting && (
                    <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 2.9l6-6C34.9 5.1 29.7 3 24 3c-7.6 0-14.1 4.3-17.7 10.7z" />
                      <path fill="#4CAF50" d="M24 45c5.6 0 10.7-1.9 14.7-5.2l-6.8-5.7C29.7 35.6 27 36.5 24 36.5c-5.3 0-9.7-3.3-11.3-7.9l-6.7 5.2C9.8 40.6 16.4 45 24 45z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.8 5.7C40.2 37 44 31.4 44 24c0-1.4-.1-2.7-.4-3.5z" />
                    </svg>
                  )}
                  {headerGoogleConnecting ? 'Conectando...' : 'Ingresar'}
                </button>
              )}
              <Link to={perfilHref} className="form-header-profile-btn" title="Mi perfil" aria-label="Mi perfil">
                {participant && participant.photo_url ? (
                  <img src={participant.photo_url} alt="" className="form-header-profile-photo" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                )}
              </Link>
            </div>
          </div>
          <p className="form-header-title" style={{ color: 'var(--text-primary)' }}>Regístrate para Cantar</p>
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
