import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'

var BURST_COLORS = ['#E91E8C', '#F4D03F', '#7ED957', '#8B5CF6']

function ConfettiBurst() {
  var particles = []
  var i = 0
  while (i < 20) {
    var angle = (i * 18) * (Math.PI / 180)
    var distance = 100 + Math.random() * 90
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
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">{particles}</div>
}

function useArtist(song) {
  var artistState = useState('')
  var artist = artistState[0]
  var setArtist = artistState[1]

  useEffect(function () {
    var cancelled = false
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

function Avatar(props) {
  var entry = props.entry
  var size = props.size
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: '#E91E8C',
        boxShadow: '0 0 28px 6px rgba(233, 30, 140, 0.55)'
      }}
    >
      {entry.photo ? (
        <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
      ) : (
        entry.avatar
      )}
    </div>
  )
}

function PodiumSlot(props) {
  var entry = props.entry
  var place = props.place
  var height = props.height
  var gradient = props.gradient
  var delay = props.delay
  var isFirst = place === 1

  return (
    <div className="podium-pop flex flex-col items-center relative" style={{ animationDelay: delay }}>
      {isFirst && <ConfettiBurst />}
      <div className="mb-3 flex flex-col items-center relative z-10">
        <span className="text-4xl md:text-5xl mb-1">
          {place === 1 ? '👑' : place === 2 ? '🥈' : '🥉'}
        </span>
        <Avatar entry={entry} size={130} />
        <p className="text-xl md:text-2xl font-extrabold text-white mt-3 text-center max-w-[220px] truncate">
          {entry.name}
        </p>
        <p className="text-lg md:text-xl text-yellow-400 font-bold">{entry.average.toFixed(1)}</p>
      </div>
      <div
        className="w-40 md:w-48 rounded-t-2xl flex items-start justify-center pt-3 relative overflow-hidden border-t-4 border-x-4"
        style={{
          height: height,
          background: gradient,
          borderColor: 'rgba(255,255,255,0.35)',
          boxShadow: '0 0 30px 6px rgba(233, 30, 140, 0.35)'
        }}
      >
        <div className="podium-shimmer absolute inset-0" />
        <span className="relative z-10 text-5xl md:text-6xl font-extrabold text-white/90" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {place}
        </span>
      </div>
    </div>
  )
}

function FinalistRow(props) {
  var entry = props.entry
  var place = props.place
  var artist = useArtist(entry.song)

  return (
    <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ background: 'var(--bg-card-alt, #1a1a1a)' }}>
      <span className="text-lg font-bold text-neutral-500 w-6">{place}</span>
      <div
        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-xl shrink-0"
        style={{ background: '#8B5CF6' }}
      >
        {entry.photo ? (
          <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-white truncate">{entry.name}</p>
        <p className="text-sm text-purple-300 truncate">{artist || 'Buscando artista...'}</p>
        <p className="text-sm text-neutral-400 truncate">{entry.song}</p>
      </div>
      <p className="text-xl font-extrabold text-yellow-400 shrink-0">{entry.average.toFixed(1)}</p>
    </div>
  )
}

export default function SessionLeaderboard() {
  var session = useKaraokeSession()
  var lastClosedSession = session.lastClosedSession
  var loadSessionLeaderboard = session.loadSessionLeaderboard

  var listState = useState(null)
  var list = listState[0]
  var setList = listState[1]

  useEffect(function () {
    if (!lastClosedSession) return
    loadSessionLeaderboard(lastClosedSession.id).then(setList)
  }, [lastClosedSession, loadSessionLeaderboard])

  if (!lastClosedSession) return null
  if (list === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-neutral-500">Cargando resultados...</p>
      </div>
    )
  }

  var top3 = list.slice(0, 3)
  var finalists = list.slice(3, 6)
  var first = top3[0]
  var second = top3[1]
  var third = top3[2]

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center px-8 py-10 bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <p className="relative z-10 text-sm tracking-[8px] uppercase text-purple-400 mb-2">
        {lastClosedSession.name}
      </p>
      <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold text-white mb-14 text-center">
        🏆 Mejores del karaoke
      </h1>

      {list.length === 0 ? (
        <p className="relative z-10 text-xl text-neutral-400">No hubo calificaciones esta noche.</p>
      ) : (
        <>
          <div className="relative z-10 flex items-end justify-center gap-8 md:gap-12">
            {second && (
              <PodiumSlot
                entry={second}
                place={2}
                height={190}
                gradient="linear-gradient(180deg, #C7CDD6, #8A93A0)"
                delay="0.15s"
              />
            )}
            {first && (
              <PodiumSlot
                entry={first}
                place={1}
                height={260}
                gradient="linear-gradient(180deg, #F4D03F, #E9A716)"
                delay="0s"
              />
            )}
            {third && (
              <PodiumSlot
                entry={third}
                place={3}
                height={140}
                gradient="linear-gradient(180deg, #D18A52, #9C5B2B)"
                delay="0.3s"
              />
            )}
          </div>

          {finalists.length > 0 && (
            <div className="relative z-10 mt-14 w-full max-w-xl rounded-2xl border-2 border-purple-500/50 bg-neutral-950/70 px-6 py-5">
              <p className="text-sm uppercase tracking-widest text-yellow-400 mb-4 text-center font-bold">
                Finalistas
              </p>
              <div className="flex flex-col gap-2.5">
                {finalists.map(function (entry, i) {
                  return <FinalistRow key={entry.id} entry={entry} place={i + 4} />
                })}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .podium-pop {
          animation: podiumPop 0.6s ease-out both;
        }
        @keyframes podiumPop {
          0% { opacity: 0; transform: translateY(50px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .podium-shimmer {
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: shimmerMove 3s ease-in-out infinite;
        }
        @keyframes shimmerMove {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .burst-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 2px;
          animation: burstOut 1.4s ease-out infinite;
        }
        @keyframes burstOut {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
