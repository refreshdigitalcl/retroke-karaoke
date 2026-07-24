import { useEffect, useMemo, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import { getSentiment } from '../lib/reactionEmojis'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FallingParty from '../components/FallingParty'
import FloatingDecor from '../components/FloatingDecor'

var VOTE_SECONDS = 20
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
      var remaining = Math.max(0, Math.ceil(VOTE_SECONDS - elapsed))
      setSeconds(remaining)
    }, 250)
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
          sum = sum + getSentiment(r.emoji)
        })
        var avg = sum / rows.length
        var color = avg > 0.7 ? '#7ED957' : avg > 0.4 ? '#F4A93F' : '#E9544A'
        var label = avg > 0.7 ? 'Publico muy entusiasta' : avg > 0.4 ? 'Reacciones mixtas' : 'Reacciones tranquilas'
        setZone({ pct: avg * 100, color: color, label: label, count: rows.length })
      })

    return function () { cancelled = true }
  }, [queueEntryId])

  return zone
}

export default function DisplayRating() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var ratings = session.ratings
  var sessionCode = session.sessionCode

  var burstingState = useState(false)
  var bursting = burstingState[0]
  var setBursting = burstingState[1]

  var songRatings = useMemo(function () {
    if (!currentSinger) return []
    return ratings.filter(function (r) { return r.singerId === String(currentSinger.id) })
  }, [ratings, currentSinger])

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
  var rateUrl = origin + '/calificar?bar=' + sessionCode
  var timerColor = secondsLeft <= 5 ? '#E91E8C' : secondsLeft <= 10 ? '#F4D03F' : '#7ED957'
  var timerVisible = secondsLeft > 0

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row pt-8">
        <div
          className="relative flex-1 h-full flex flex-col items-center justify-center px-6 border-x"
          style={{ borderColor: 'rgba(139, 92, 246, 0.25)' }}
        >
          <div
            className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden flex items-center justify-center text-4xl border-4 border-pink-600 mb-4"
            style={{ boxShadow: '0 0 26px 5px rgba(233, 30, 140, 0.5)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>
          <p className="text-xl md:text-2xl font-extrabold text-white text-center">{currentSinger.name}</p>
          <p className="text-base md:text-lg text-yellow-400 text-center mt-1">{currentSinger.song}</p>
          <p className="text-sm md:text-base text-purple-300 text-center mb-6">
            {artist || 'Buscando artista...'}
          </p>

          {zone && (
            <div className="w-full max-w-[220px]">
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2 text-center">
                Reaccion del publico
              </p>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full zone-fill"
                  style={{ width: zone.pct + '%', background: zone.color, boxShadow: '0 0 10px 2px ' + zone.color + '80' }}
                />
              </div>
              <p className="text-xs text-center mt-2" style={{ color: zone.color }}>
                {zone.label}
              </p>
            </div>
          )}
        </div>

        <div className="relative flex-1 h-full flex flex-col items-center justify-center px-6">
          <p className="text-sm font-bold text-yellow-400 mb-4 uppercase tracking-widest">
            Escanea para votar
          </p>
          <div className="rounded-3xl border-2 border-yellow-400 bg-neutral-950/85 px-8 py-8 qr-glow">
            <QRCode url={rateUrl} size={230} />
          </div>
        </div>

        <div
          className="relative flex-1 h-full flex flex-col items-center justify-center px-6 border-x"
          style={{ borderColor: 'rgba(139, 92, 246, 0.25)' }}
        >
          {bursting && <ConfettiBurst />}
          <p className="text-lg md:text-xl tracking-widest uppercase text-purple-400 mb-5 font-bold">
            Calificacion final es:
          </p>
          {average ? (
            <>
              <p className="text-7xl md:text-8xl font-extrabold text-yellow-400 leading-none">
                {average}
              </p>
              <p className="text-base text-neutral-400 mt-6">
                {songRatings.length} {songRatings.length === 1 ? 'voto emitido' : 'votos emitidos'}
              </p>
            </>
          ) : (
            <p className="text-xl text-neutral-400 mt-6 text-center max-w-xs">
              Esperando la calificacion del jurado...
            </p>
          )}
        </div>
      </div>

      <div className="relative z-30 mb-8 flex flex-col items-center h-[110px] justify-end">
        {timerVisible && (
          <div key={currentSinger.id} className="timer-in-out flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 timer-pulse"
              style={{ borderColor: timerColor, boxShadow: '0 0 22px 4px ' + timerColor + '80' }}
            >
              <span className="text-3xl font-extrabold" style={{ color: timerColor }}>
                {secondsLeft}
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2">
              Segundos para votar
            </p>
          </div>
        )}
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
        .timer-pulse {
          animation: timerPulse 1s ease-in-out infinite;
        }
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .timer-in-out {
          animation: timerInOut 20s ease-in-out forwards;
        }
        @keyframes timerInOut {
          0% { opacity: 0; transform: translateY(20px) scale(0.7); }
          8% { opacity: 1; transform: translateY(0) scale(1); }
          92% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(0.6); }
        }
        .zone-fill {
          transition: width 0.6s ease-out;
        }
        .qr-glow {
          box-shadow: 0 0 34px 6px rgba(244, 208, 63, 0.25);
        }
      `}</style>
    </div>
  )
}
