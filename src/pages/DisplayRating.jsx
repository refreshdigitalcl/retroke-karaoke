import { useEffect, useMemo, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import { getSentiment } from '../lib/reactionEmojis'
import { isMemeReaction, getMemeSentiment } from '../lib/memeReactions'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FallingParty from '../components/FallingParty'
import FloatingDecor from '../components/FloatingDecor'

var VOTE_SECONDS = 20
var RING_RADIUS = 132
var RING_CIRC = 2 * Math.PI * RING_RADIUS
var BURST_COLORS = ['#E91E8C', '#F4D03F', '#7ED957', '#8B5CF6']

function ConfettiBurst() {
  var particles = []
  var i = 0
  while (i < 16) {
    var angle = (i * 22.5) * (Math.PI / 180)
    var distance = 70 + Math.random() * 60
    var dx = Math.cos(angle) * distance
    var dy = Math.sin(angle) * distance
    var color = BURST_COLORS[i % BURST_COLORS.length]
    particles.push(
      <span
        key={i}
        className="burst-particle"
        style={{ background: color, '--dx': dx + 'px', '--dy': dy + 'px' }}
      />
    )
    i = i + 1
  }
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">{particles}</div>
}

function useCountdown(seed) {
  var secondsState = useState(VOTE_SECONDS)
  var seconds = secondsState[0]
  var setSeconds = secondsState[1]
  var startedAtRef = useRef(Date.now())

  useEffect(function () {
    startedAtRef.current = Date.now()
    setSeconds(VOTE_SECONDS)
    var interval = setInterval(function () {
      var elapsed = (Date.now() - startedAtRef.current) / 1000
      var remaining = Math.max(0, VOTE_SECONDS - elapsed)
      setSeconds(remaining)
    }, 100)
    return function () { clearInterval(interval) }
  }, [seed])

  return seconds
}

function useArtist(song) {
  var artistState = useState('')
  var artist = artistState[0]
  var setArtist = artistState[1]

  useEffect(function () {
    var cancelled = false
    setArtist('')
    if (!song) return
    fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1')
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) setArtist(data.results[0].artistName)
      })
      .catch(function () {})
    return function () { cancelled = true }
  }, [song])

  return artist
}

function usePerformanceZone(queueEntryId) {
  var zoneState = useState(null)
  var zone = zoneState[0]
  var setZone = zoneState[1]

  useEffect(function () {
    var cancelled = false
    setZone(null)
    if (!queueEntryId) return

    supabase
      .from('reactions')
      .select('emoji')
      .eq('queue_entry_id', queueEntryId)
      .then(function (result) {
        if (cancelled) return
        var rows = result.data || []
        if (rows.length === 0) {
          setZone(null)
          return
        }
        var sum = 0
        rows.forEach(function (r) {
          sum = sum + (isMemeReaction(r.emoji) ? getMemeSentiment(r.emoji) : getSentiment(r.emoji))
        })
        var avg = sum / rows.length
        var color = avg > 0.7 ? '#7ED957' : avg > 0.4 ? '#F4A93F' : '#E9544A'
        var label = avg > 0.7 ? 'Publico muy entusiasta' : avg > 0.4 ? 'Reacciones mixtas' : 'Reacciones tranquilas'
        setZone({ pct: avg * 100, color: color, label: label })
      })

    return function () { cancelled = true }
  }, [queueEntryId])

  return zone
}

export default function DisplayRating() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var ratings = session.ratings
  var spaceParam = session.spaceParam

  var burstingState = useState(false)
  var bursting = burstingState[0]
  var setBursting = burstingState[1]

  var songRatings = useMemo(function () {
    if (!currentSinger) return []
    return ratings.filter(function (r) { return r.singerId === String(currentSinger.id) })
  }, [ratings, currentSinger])

  var latestPhraseRating = useMemo(function () {
    var withPhrase = songRatings.filter(function (r) { return r.phrase })
    return withPhrase.length > 0 ? withPhrase[withPhrase.length - 1] : null
  }, [songRatings])

  var visiblePhraseState = useState(null)
  var visiblePhrase = visiblePhraseState[0]
  var setVisiblePhrase = visiblePhraseState[1]

  useEffect(function () {
    if (!latestPhraseRating) return
    setVisiblePhrase(latestPhraseRating)
    var t = setTimeout(function () {
      setVisiblePhrase(null)
    }, 6000)
    return function () { clearTimeout(t) }
  }, [latestPhraseRating ? latestPhraseRating.id : null])

  var average = useMemo(function () {
    if (songRatings.length === 0) return null
    var sum = 0
    var i = 0
    while (i < songRatings.length) {
      sum = sum + songRatings[i].score
      i = i + 1
    }
    return (sum / songRatings.length).toFixed(1)
  }, [songRatings])

  var secondsLeft = useCountdown(currentSinger ? currentSinger.id : 'none')
  var artist = useArtist(currentSinger ? currentSinger.song : '')
  var zone = usePerformanceZone(currentSinger ? currentSinger.id : null)

  useEffect(function () {
    if (!currentSinger) return
    var audio = new Audio('/sounds/vote-start.mp3')
    audio.play().catch(function () {})
  }, [currentSinger ? currentSinger.id : null])

  useEffect(function () {
    if (average === null) return
    setBursting(true)
    var t = setTimeout(function () {
      setBursting(false)
    }, 1100)
    return function () {
      clearTimeout(t)
    }
  }, [average])

  if (!currentSinger) return null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var rateUrl = origin + '/calificar?' + spaceParam
  var timerColor = secondsLeft <= 5 ? '#E91E8C' : secondsLeft <= 10 ? '#F4D03F' : '#7ED957'
  var ringOffset = RING_CIRC * (1 - secondsLeft / VOTE_SECONDS)

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-black px-6">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="relative z-10 w-full max-w-6xl flex items-center justify-center gap-6 md:gap-14">
        <div className="beam beam-left hidden md:block" />
        <div className="beam beam-right hidden md:block" />

        <div className="hologram-card tilt-left flex-1 max-w-xs rounded-3xl border-2 border-purple-500 bg-neutral-950/80 px-6 py-8 flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl border-4 border-pink-600 mb-4"
            style={{ boxShadow: '0 0 22px 4px rgba(233, 30, 140, 0.5)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>
          <p className="text-lg font-extrabold text-white">{currentSinger.name}</p>
          <p className="text-sm text-yellow-400 mt-1">{currentSinger.song}</p>
          <p className="text-xs text-purple-300 mb-5">{artist || 'Buscando artista...'}</p>

          {zone && (
            <div className="w-full">
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1.5">
                Reaccion del publico
              </p>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full zone-fill"
                  style={{ width: zone.pct + '%', background: zone.color, boxShadow: '0 0 8px 2px ' + zone.color + '80' }}
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: zone.color }}>
                {zone.label}
              </p>
            </div>
          )}
        </div>

        <div className="relative flex flex-col items-center shrink-0">
          <div className="relative" style={{ width: 300, height: 300 }}>
            <svg width="300" height="300" className="absolute inset-0 -rotate-90">
              <circle cx="150" cy="150" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="150" cy="150" r={RING_RADIUS} fill="none"
                stroke={timerColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.4s', filter: 'drop-shadow(0 0 8px ' + timerColor + ')' }}
              />
            </svg>
            <div className="absolute inset-6 rounded-full border-2 border-yellow-400 bg-neutral-950/90 flex flex-col items-center justify-center qr-glow">
              <QRCode url={rateUrl} size={170} />
            </div>
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-lg font-extrabold border-2"
              style={{ background: '#000', borderColor: timerColor, color: timerColor }}
            >
              {Math.ceil(secondsLeft)}
            </div>
          </div>
          <p className="text-sm font-bold text-yellow-400 mt-5 uppercase tracking-widest">
            Escanea para votar
          </p>

          {visiblePhrase && (
            <div key={visiblePhrase.id} className="phrase-toast mt-4 max-w-[380px] rounded-2xl border-2 border-pink-500 bg-neutral-950/90 px-5 py-3.5 text-center">
              <p className="text-xl text-white font-medium leading-snug">{visiblePhrase.phrase}</p>
            </div>
          )}
        </div>

        <div className="hologram-card tilt-right flex-1 max-w-xs rounded-3xl border-2 border-yellow-400 bg-neutral-950/80 px-6 py-8 flex flex-col items-center text-center relative">
          {bursting && <ConfettiBurst />}
          <p className="text-sm tracking-widest uppercase text-purple-400 mb-4 font-bold">
            Calificacion final
          </p>
          {average ? (
            <>
              <p className="text-6xl font-extrabold text-yellow-400 leading-none">
                {average}
              </p>
              <p className="text-sm text-neutral-400 mt-4">
                {songRatings.length} {songRatings.length === 1 ? 'voto emitido' : 'votos emitidos'}
              </p>
            </>
          ) : (
            <p className="text-base text-neutral-400 mt-4">
              Esperando la calificacion del jurado...
            </p>
          )}
        </div>
      </div>

      <style>{`
        .burst-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: burstOut 1s ease-out forwards;
        }
        @keyframes burstOut {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
        }
        .qr-glow {
          box-shadow: 0 0 30px 6px rgba(244, 208, 63, 0.25);
        }
        .zone-fill { transition: width 0.6s ease-out; }
        .phrase-toast {
          animation: phraseToast 6s ease-in-out;
        }
        @keyframes phraseToast {
          0% { opacity: 0; transform: translateY(10px) scale(0.9); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-6px) scale(0.95); }
        }
        .hologram-card {
          animation: cardFloat 4s ease-in-out infinite;
        }
        .tilt-left {
          transform: rotate(-3deg);
          animation-delay: 0s;
        }
        .tilt-right {
          transform: rotate(3deg);
          animation-delay: 0.6s;
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); }
          50% { transform: translateY(-10px) rotate(var(--tilt, 0deg)); }
        }
        .tilt-left { --tilt: -3deg; }
        .tilt-right { --tilt: 3deg; }
        .beam {
          position: absolute;
          top: 50%;
          width: 140px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(233, 30, 140, 0.6), transparent);
          animation: beamPulse 2.4s ease-in-out infinite;
        }
        .beam-left { left: calc(50% - 300px); }
        .beam-right { right: calc(50% - 300px); }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
