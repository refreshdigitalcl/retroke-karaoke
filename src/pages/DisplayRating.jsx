import { useEffect, useMemo, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
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

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="relative z-30 mt-6 flex flex-col items-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center border-4 timer-pulse"
          style={{ borderColor: timerColor, boxShadow: '0 0 24px 4px ' + timerColor + '80' }}
        >
          <span className="text-4xl font-extrabold" style={{ color: timerColor }}>
            {secondsLeft}
          </span>
        </div>
        <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2">
          Segundos para votar
        </p>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row mt-4">
        <div
          className="relative flex-1 h-full flex flex-col items-center justify-center px-6 border-x"
          style={{ borderColor: 'rgba(244, 208, 63, 0.25)' }}
        >
          <div
            className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden flex items-center justify-center text-5xl border-4 border-pink-600 mb-5"
            style={{ boxShadow: '0 0 30px 6px rgba(233, 30, 140, 0.5)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">{currentSinger.name}</p>
          <p className="text-base md:text-lg text-purple-300 mb-8">{currentSinger.song}</p>

          <div className="rounded-3xl border-2 border-yellow-400 bg-neutral-950/85 px-7 py-7 flex flex-col items-center gap-3 qr-glow">
            <QRCode url={rateUrl} size={190} />
            <p className="text-base font-bold text-yellow-400">Escanea para votar</p>
          </div>
        </div>

        <div
          className="relative flex-1 h-full flex flex-col items-center justify-center px-6"
        >
          {bursting && <ConfettiBurst />}
          <p className="text-lg md:text-xl tracking-widest uppercase text-purple-400 mb-5 font-bold">
            Calificacion final es:
          </p>
          {average ? (
            <>
              <p className="text-8xl md:text-9xl font-extrabold text-yellow-400 leading-none">
                {average}
              </p>
              <p className="text-lg text-neutral-400 mt-6">
                {songRatings.length} {songRatings.length === 1 ? 'voto emitido' : 'votos emitidos'}
              </p>
            </>
          ) : (
            <p className="text-2xl text-neutral-400 mt-6 text-center max-w-xs">
              Esperando los primeros votos del publico...
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
        .timer-pulse {
          animation: timerPulse 1s ease-in-out infinite;
        }
        @keyframes timerPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .qr-glow {
          box-shadow: 0 0 34px 6px rgba(244, 208, 63, 0.25);
        }
      `}</style>
    </div>
  )
}
