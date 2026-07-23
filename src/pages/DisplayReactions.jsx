import { useMemo } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'

var PHRASES = [
  ' esta cantando',
  ' esta rockeando',
  ' esta en el escenario',
  ' se esta luciendo',
  ' esta que arde',
  ' esta dando catedra',
  ' tiene el micro encendido'
]

function pickPhrase(seed) {
  var index = 0
  var i = 0
  while (i < seed.length) {
    index = index + seed.charCodeAt(i)
    i = i + 1
  }
  return PHRASES[index % PHRASES.length]
}

function MiniRow(props) {
  var entry = props.entry
  var position = props.position
  return (
    <div className="flex items-center gap-2.5 rounded-lg py-2 px-3 bg-neutral-900/70 border border-neutral-800">
      <span className="text-xs text-purple-400 w-4">{position}</span>
      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm shrink-0 bg-pink-600">
        {entry.photo ? (
          <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white truncate">{entry.name}</p>
        <p className="text-[11px] text-neutral-400 truncate">{entry.song}</p>
      </div>
    </div>
  )
}

export default function DisplayReactions() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var reactions = session.reactions
  var queue = session.queue

  var phrase = useMemo(function () {
    if (!currentSinger) return ''
    return pickPhrase(String(currentSinger.id))
  }, [currentSinger])

  if (!currentSinger) return null

  var floaters = []
  var i = 0
  while (i < reactions.length) {
    var r = reactions[i]
    floaters.push(
      <span
        key={r.id}
        className="floating-emoji absolute text-3xl"
        style={{ left: (20 + Math.random() * 60) + '%', bottom: '50%' }}
      >
        {r.emoji}
      </span>
    )
    i = i + 1
  }

  var upcoming = []
  var j = 0
  while (j < queue.length && j < 4) {
    upcoming.push(<MiniRow key={queue[j].id} entry={queue[j]} position={j + 1} />)
    j = j + 1
  }

  return (
    <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col items-center bg-black">
      <RetroEqualizer />

      <div className="absolute inset-0 pointer-events-none z-10">{floaters}</div>

      <span className="relative z-10 text-xs px-3 py-1 rounded-full text-white bg-pink-600 mb-6">
        En vivo
      </span>

      <div
        className="relative z-10 w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-purple-500 flex items-center justify-center text-6xl bg-pink-600 spin-vinyl"
        style={{ boxShadow: '0 0 30px 6px rgba(139, 92, 246, 0.55)' }}
      >
        {currentSinger.photo ? (
          <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
        ) : (
          currentSinger.avatar
        )}
      </div>

      <p className="relative z-10 text-2xl md:text-3xl font-extrabold text-white mt-6 text-center">
        {currentSinger.name}
        <span className="text-purple-400">{phrase}</span>
      </p>
      <p className="relative z-10 text-base md:text-lg text-yellow-400 mt-1 mb-8 text-center">
        {currentSinger.song}
      </p>

      <p className="relative z-10 text-xs tracking-widest uppercase text-purple-400 mb-3">
        Reacciona desde tu celular
      </p>

      {upcoming.length > 0 && (
        <div className="relative z-10 w-full max-w-sm mt-6">
          <p className="text-xs tracking-widest uppercase text-yellow-400 mb-2 text-center">
            Siguen en la fila
          </p>
          <div className="flex flex-col gap-2">{upcoming}</div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-260px) scale(1.4); opacity: 0; }
        }
        .floating-emoji {
          animation: floatUp 1.8s ease-out forwards;
        }
        .spin-vinyl {
          animation: spinVinyl 7s linear infinite;
        }
        @keyframes spinVinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
