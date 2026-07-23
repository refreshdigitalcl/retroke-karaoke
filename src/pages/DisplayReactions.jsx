import { useMemo } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'
import QRCode from '../components/QRCode'

var PHRASES = [
  'está cantando con todo.',
  'está rompiendo el escenario.',
  'está rockeando como nunca.',
  'está en su prime.',
  'está dando cátedra.',
  'está dejando todo en el escenario.',
  'está encendiendo la noche.',
  'está haciendo vibrar el lugar.',
  'está simplemente increíble.',
  'está en modo estrella.',
  'está demostrando por qué es uno de los grandes.',
  'está entregando un show de otro nivel.',
  'está haciendo historia esta noche.',
  'está conquistando al público.',
  'está haciendo cantar a todos.',
  'está prendiendo el ambiente.',
  'está dejando la energía arriba.',
  'está demostrando todo su talento.',
  'está brillando sobre el escenario.',
  'está en su mejor momento.',
  'está entregando pura energía.',
  'está haciendo vibrar cada rincón.',
  'está desatando la fiesta.',
  'está dominando el escenario.',
  'está haciendo lo que mejor sabe hacer.',
  'está cantando como los grandes.',
  'está prendiendo la noche como corresponde.',
  'está regalando un show inolvidable.',
  'está llevando el show a otro nivel.',
  'está haciendo explotar el ambiente.',
  'está demostrando que sigue más vigente que nunca.',
  'está entregando una presentación espectacular.',
  'está haciendo vibrar a todo el público.',
  'está cantando con el alma.',
  'está en modo leyenda.',
  'está demostrando por qué el público le quiere tanto.',
  'está regalando uno de esos momentos inolvidables.',
  'está haciendo que esta noche sea especial.',
  'está llevando toda su energía al escenario.',
  'está completamente encendido.',
  'está brillando con luz propia.',
  'está haciendo vibrar la noche.',
  'está demostrando todo lo que tiene.',
  'está haciendo disfrutar a todos.',
  'está entregando una noche para recordar.',
  'está en llamas.',
  'está haciendo cantar, bailar y disfrutar a todos.',
  'está demostrando que el talento nunca pasa de moda.',
  'está convirtiendo esta noche en un verdadero espectáculo.',
  'está simplemente en otro nivel.'
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
  var sessionCode = session.sessionCode

  var phrase = useMemo(function () {
    if (!currentSinger) return ''
    return pickPhrase(String(currentSinger.id))
  }, [currentSinger])

  if (!currentSinger) return null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var reactUrl = origin + '/reaccionar?bar=' + sessionCode

  var floaters = []
  var i = 0
  while (i < reactions.length) {
    var r = reactions[i]
    floaters.push(
      <span
        key={r.id}
        className="floating-emoji absolute text-6xl"
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
      <FloatingDecor />
      <FallingParty />

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

      <div className="relative z-10 mt-5 flex flex-col items-center gap-1.5">
        <QRCode url={reactUrl} size={110} />
        <p className="text-[11px] text-purple-300">Escanea para reaccionar</p>
      </div>

      <p className="relative z-10 text-2xl md:text-3xl font-extrabold text-white mt-6 text-center max-w-2xl">
        {currentSinger.name} <span className="text-purple-400">{phrase}</span>
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
