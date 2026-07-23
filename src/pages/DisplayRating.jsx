import { useEffect, useMemo, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FallingParty from '../components/FallingParty'

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
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {particles}
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
      `}</style>
    </div>
  )
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

  return (
    <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col items-center justify-center bg-black">
      <RetroEqualizer />
      <FallingParty />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl w-full items-center">
        <div className="flex flex-col items-center text-center rounded-3xl border-2 border-purple-500 bg-neutral-950/80 px-8 py-10">
          <div
            className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-5xl border-4 border-pink-600 mb-5"
            style={{ boxShadow: '0 0 24px 5px rgba(233, 30, 140, 0.5)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>
          <p className="text-xl font-bold text-white mb-1">{currentSinger.name}</p>
          <p className="text-sm text-purple-300 mb-6">{currentSinger.song}</p>

          <p className="text-lg font-extrabold text-yellow-400 mb-1">
            Esperando calificacion del Jurado
          </p>
          <p className="text-sm text-neutral-400 mb-6">
            Tu opinion define la nota final. Vota ahora.
          </p>

          <div className="rounded-2xl border-2 border-yellow-400 bg-neutral-900/90 px-5 py-5 flex flex-col items-center gap-2">
            <QRCode url={rateUrl} size={140} />
            <p className="text-xs text-purple-300">Escanea para votar</p>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center rounded-3xl border-2 border-yellow-400 bg-neutral-950/80 px-8 py-10">
          {bursting && <ConfettiBurst />}
          <p className="text-sm tracking-widest uppercase text-purple-400 mb-4">
            Calificacion final es:
          </p>
          {average ? (
            <>
              <p className="text-7xl md:text-8xl font-extrabold text-yellow-400 leading-none">
                {average}
              </p>
              <p className="text-sm text-neutral-400 mt-4">
                {songRatings.length} {songRatings.length === 1 ? 'voto emitido' : 'votos emitidos'}
              </p>
            </>
          ) : (
            <p className="text-lg text-neutral-400 mt-6">
              Esperando los primeros votos del publico...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
