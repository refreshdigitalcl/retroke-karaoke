import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'

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
        background: 'var(--accent-magenta, #E91E8C)',
        boxShadow: '0 0 20px 4px rgba(233, 30, 140, 0.5)'
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
  var color = props.color
  var delay = props.delay

  return (
    <div
      className="podium-pop flex flex-col items-center"
      style={{ animationDelay: delay }}
    >
      <div className="mb-2 flex flex-col items-center">
        <span className="text-2xl">{place === 1 ? '👑' : place === 2 ? '🥈' : '🥉'}</span>
        <Avatar entry={entry} size={place === 1 ? 88 : 68} />
        <p className="text-sm md:text-base font-bold text-white mt-2 text-center max-w-[140px] truncate">
          {entry.name}
        </p>
        <p className="text-xs text-yellow-400 font-semibold">{entry.average.toFixed(1)}</p>
      </div>
      <div
        className="w-24 md:w-28 rounded-t-xl flex items-start justify-center pt-2"
        style={{ height: height, background: color, boxShadow: '0 0 18px 2px ' + color + '80' }}
      >
        <span className="text-3xl font-extrabold text-black/70">{place}</span>
      </div>
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
  var finalists = list.slice(3, 5)
  var first = top3[0]
  var second = top3[1]
  var third = top3[2]

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center px-8 py-10 bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <p className="relative z-10 text-xs tracking-[6px] uppercase text-purple-400 mb-2">
        {lastClosedSession.name}
      </p>
      <h1 className="relative z-10 text-3xl md:text-5xl font-extrabold text-white mb-10 text-center">
        🏆 Mejores del karaoke
      </h1>

      {list.length === 0 ? (
        <p className="relative z-10 text-neutral-400">No hubo calificaciones esta noche.</p>
      ) : (
        <>
          <div className="relative z-10 flex items-end justify-center gap-4 md:gap-6">
            {second && (
              <PodiumSlot entry={second} place={2} height={120} color="#C0C0C0" delay="0.15s" />
            )}
            {first && (
              <PodiumSlot entry={first} place={1} height={165} color="#F4D03F" delay="0s" />
            )}
            {third && (
              <PodiumSlot entry={third} place={3} height={90} color="#CD7F32" delay="0.3s" />
            )}
          </div>

          {finalists.length > 0 && (
            <div className="relative z-10 mt-10 w-full max-w-md rounded-2xl border border-purple-500/50 bg-neutral-950/70 px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-yellow-400 mb-3 text-center">
                Finalistas
              </p>
              <div className="flex flex-col gap-2">
                {finalists.map(function (entry, i) {
                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-4">{i + 4}</span>
                      <Avatar entry={entry} size={32} />
                      <p className="text-sm text-white flex-1 truncate">{entry.name}</p>
                      <p className="text-sm text-yellow-400 font-semibold">{entry.average.toFixed(1)}</p>
                    </div>
                  )
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
          0% { opacity: 0; transform: translateY(40px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
