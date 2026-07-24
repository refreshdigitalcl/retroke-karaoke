import { useEffect, useMemo, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FallingParty from '../components/FallingParty'

var STAGE_LIGHT_COLORS = ['#E91E8C', '#8B5CF6', '#F4D03F', '#7ED957', '#E91E8C']
var STAGE_LIGHT_POSITIONS = ['8%', '27%', '50%', '73%', '92%']

function ResultStageLights() {
  var lights = []
  var i = 0
  while (i < STAGE_LIGHT_POSITIONS.length) {
    var color = STAGE_LIGHT_COLORS[i]
    var left = STAGE_LIGHT_POSITIONS[i]
    var delay = i * 0.6 + 's'
    lights.push(
      <div
        key={i}
        className="stage-light-flicker"
        style={{ position: 'absolute', top: 0, left: left, animationDelay: delay }}
      >
        <svg width="30" height="76" viewBox="0 0 30 76">
          <line x1="15" y1="0" x2="15" y2="28" stroke={color} strokeWidth="2" opacity="0.55" />
          <path d="M5 28 L25 28 L20 50 L10 50 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.75" />
          <ellipse cx="15" cy="55" rx="11" ry="5" fill={color} opacity="0.18" />
        </svg>
      </div>
    )
    i = i + 1
  }
  return <div className="absolute inset-x-0 top-0 z-0 pointer-events-none">{lights}</div>
}

var BURST_COLORS = ['#E91E8C', '#F4D03F', '#7ED957', '#8B5CF6']

function ConfettiBurst(props) {
  var burstKey = props.burstKey
  var particles = []
  var i = 0
  while (i < 18) {
    var angle = (i * 20) * (Math.PI / 180)
    var distance = 90 + Math.random() * 70
    var dx = Math.cos(angle) * distance
    var dy = Math.sin(angle) * distance
    var color = BURST_COLORS[i % BURST_COLORS.length]
    particles.push(
      <span
        key={burstKey + '-' + i}
        className="burst-particle"
        style={{ background: color, '--dx': dx + 'px', '--dy': dy + 'px' }}
      />
    )
    i = i + 1
  }
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">{particles}</div>
}

var RESULT_TITLES = [
  '¡Gran Presentación! 🎤👏',
  '¡Excelente Presentación! ⭐🎶',
  '¡Tremenda Presentación! 🔥🎤',
  '¡Fantástica Presentación! 🌟👏',
  '¡Increíble Presentación! 🤩🎤',
  '¡Brillante Presentación! ✨🎶',
  '¡Espectacular Presentación! 💥👏',
  '¡Magnífica Presentación! 🌟🎤',
  '¡Qué Gran Presentación! 👏🔥',
  '¡Una Presentación Inolvidable! 🎶⭐',
  '¡Presentación de Lujo! 👑🎤',
  '¡Puro Talento! 🎤✨',
  '¡Te Luciste! 🔥👏',
  '¡La Rompiste! 💥🎤',
  '¡El Escenario Fue Tuyo! 👑🎶',
  '¡Una Presentación para Recordar! 🌟👏',
  '¡El Público lo Disfrutó! 🙌🎤',
  '¡Voz y Actitud! 🔥🎶',
  '¡Te Pasaste! 👏⭐',
  '¡Nivel Estrella! 🌟🎤'
]

var RESULT_PHRASES = [
  '¡Gran presentación! 🎤👏',
  '¡Te luciste en el escenario! 🔥🎤',
  '¡El público lo disfrutó muchísimo! 👏❤️',
  '¡Qué tremenda interpretación! ⭐🎶',
  '¡Voz, actitud y espectáculo! 🔥🎤',
  '¡Nos regalaste una gran presentación! 🎵👏',
  '¡El escenario fue tuyo! 👑🎤',
  '¡Una actuación para recordar! 🌟🎶',
  '¡Te pasaste! Tremenda presentación 🔥👏',
  '¡El público habló y te aplaudió! 👏🙌',
  '¡Puro talento sobre el escenario! 🎤✨',
  '¡Cantaste con todo el corazón! ❤️🎶',
  '¡Qué manera de cantar! 🔥🎤',
  '¡Una presentación llena de energía! ⚡👏',
  '¡El micrófono fue tuyo y lo disfrutaste! 🎤😎',
  '¡Nos sorprendiste! Gran presentación 😮⭐',
  '¡La rompiste esta noche! 💥🎤',
  '¡Una presentación digna de aplausos! 👏🌟',
  '¡El público disfrutó cada segundo! 🎶❤️',
  '¡Gracias por dejarlo todo en el escenario! 🙌🔥'
]

function pickFromList(list, seed) {
  var index = 0
  var i = 0
  while (i < seed.length) {
    index = index + seed.charCodeAt(i)
    i = i + 1
  }
  return list[index % list.length]
}

export default function DisplayResult() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var ratings = session.ratings

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

  var burstState = useState(0)
  var burstKey = burstState[0]
  var setBurstKey = burstState[1]

  var burstingState = useState(false)
  var bursting = burstingState[0]
  var setBursting = burstingState[1]

  useEffect(function () {
    var id = setInterval(function () {
      setBurstKey(function (prev) { return prev + 1 })
      setBursting(true)
      setTimeout(function () { setBursting(false) }, 1100)
    }, 10000)
    return function () { clearInterval(id) }
  }, [])

  if (!currentSinger) return null

  var title = pickFromList(RESULT_TITLES, String(currentSinger.id))
  var phrase = pickFromList(RESULT_PHRASES, String(currentSinger.id) + 'x')

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 bg-black">
      <RetroEqualizer />
      <ResultStageLights />
      <FallingParty />

      <p className="relative z-10 text-2xl md:text-4xl font-extrabold text-white mb-2 text-center">
        {title}
      </p>
      <p className="relative z-10 text-xl md:text-2xl text-purple-300 mb-10 text-center">
        {currentSinger.name}
      </p>

      <div className="relative z-10 rounded-3xl border-2 border-yellow-400 bg-neutral-950/85 px-12 py-10 flex flex-col items-center">
        {bursting && <ConfettiBurst burstKey={burstKey} />}
        {average ? (
          <>
            <p className="text-8xl md:text-9xl font-extrabold text-yellow-400 leading-none">
              {average}
            </p>
            <p className="text-lg md:text-2xl font-bold text-white mt-5 text-center">
              {phrase}
            </p>
            <p className="text-sm text-neutral-400 mt-4">
              {songRatings.length} {songRatings.length === 1 ? 'voto' : 'votos'}
            </p>
          </>
        ) : (
          <p className="text-xl text-neutral-400">Sin votos suficientes</p>
        )}
      </div>

      <style>{`
        .stage-light-flicker {
          animation: stageFlicker 3.2s ease-in-out infinite;
        }
        @keyframes stageFlicker {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.35; }
        }
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
