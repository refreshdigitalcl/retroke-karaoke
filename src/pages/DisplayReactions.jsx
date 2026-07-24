import { useEffect, useMemo, useState } from 'react'
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

function splitFacts(text) {
  if (!text) return []
  var parts = text.split(/(?<=\.)\s+/)
  var facts = []
  var i = 0
  while (i < parts.length && facts.length < 4) {
    var p = parts[i].trim()
    if (p.length > 20 && p.length < 140) facts.push(p)
    i = i + 1
  }
  return facts
}

function useSongInfo(song) {
  var infoState = useState(null)
  var info = infoState[0]
  var setInfo = infoState[1]

  var factsState = useState([])
  var facts = factsState[0]
  var setFacts = factsState[1]

  useEffect(function () {
    var cancelled = false
    setInfo(null)
    setFacts([])

    fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1')
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          var r = data.results[0]
          var year = r.releaseDate ? r.releaseDate.slice(0, 4) : ''
          setInfo({ artist: r.artistName, year: year })

          fetch('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(r.artistName))
            .then(function (res2) { return res2.ok ? res2.json() : null })
            .then(function (wiki) {
              if (cancelled) return
              if (wiki && wiki.extract) setFacts(splitFacts(wiki.extract))
            })
            .catch(function () {})
        }
      })
      .catch(function () {})

    return function () { cancelled = true }
  }, [song])

  var factIndexState = useState(0)
  var factIndex = factIndexState[0]
  var setFactIndex = factIndexState[1]

  useEffect(function () {
    if (facts.length < 2) return
    var id = setInterval(function () {
      setFactIndex(function (prev) { return (prev + 1) % facts.length })
    }, 6500)
    return function () { clearInterval(id) }
  }, [facts])

  return { info: info, fact: facts.length > 0 ? facts[factIndex] : '', factIndex: factIndex }
}

function FloatingInfoBar(props) {
  var currentSinger = props.currentSinger
  var songInfo = props.songInfo

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-3xl">
      <div className="flex items-center gap-4 rounded-2xl border border-purple-500 bg-neutral-950/85 backdrop-blur px-5 py-3">
        <div
          id="reaction-anchor"
          className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xl bg-pink-600 shrink-0"
          style={{ boxShadow: '0 0 14px 3px rgba(233, 30, 140, 0.55)' }}
        >
          {currentSinger.photo ? (
            <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
          ) : (
            currentSinger.avatar
          )}
        </div>

        <div className="shrink-0">
          <p className="text-sm font-bold text-white leading-tight">{currentSinger.name}</p>
          <p className="text-xs text-yellow-400 leading-tight">
            {songInfo.info ? songInfo.info.artist : currentSinger.song}
            {songInfo.info && songInfo.info.year ? ' · ' + songInfo.info.year : ''}
          </p>
        </div>

        {songInfo.fact && (
          <>
            <div className="w-px self-stretch bg-neutral-700 shrink-0" />
            <p key={songInfo.factIndex} className="fact-fade text-xs text-neutral-300 italic leading-snug">
              {songInfo.fact}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function DisplayReactions() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var reactions = session.reactions
  var sessionCode = session.sessionCode

  var phrase = useMemo(function () {
    if (!currentSinger) return ''
    return pickPhrase(String(currentSinger.id))
  }, [currentSinger])

  var songInfo = useSongInfo(currentSinger ? currentSinger.song : '')

  if (!currentSinger) return null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var reactUrl = origin + '/reaccionar?bar=' + sessionCode

  var hasVideo = !!currentSinger.videoId

  var floaters = []
  var i = 0
  while (i < reactions.length) {
    var r = reactions[i]
    floaters.push(
      <span
        key={r.id}
        className="floating-emoji absolute text-6xl"
        style={{ left: (30 + Math.random() * 40) + '%', bottom: hasVideo ? '90px' : '50%' }}
      >
        {r.emoji}
      </span>
    )
    i = i + 1
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {!hasVideo && (
        <div className="px-8 py-10">
          <RetroEqualizer />
          <FloatingDecor />
        </div>
      )}
      <FallingParty />

      <div className="absolute inset-0 pointer-events-none z-20">{floaters}</div>

      {hasVideo ? (
        <div className="relative w-full h-screen flex items-center justify-center">
          <iframe
            key={currentSinger.videoId}
            src={'https://www.youtube.com/embed/' + currentSinger.videoId + '?autoplay=1&rel=0'}
            title="Video de karaoke"
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <FloatingInfoBar currentSinger={currentSinger} songInfo={songInfo} />
        </div>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
          <span className="text-xs px-3 py-1 rounded-full text-white bg-pink-600 mb-8">
            En vivo
          </span>

          <div
            className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-purple-500 flex items-center justify-center text-6xl bg-pink-600 spin-vinyl mb-6"
            style={{ boxShadow: '0 0 30px 6px rgba(139, 92, 246, 0.55)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>

          <p className="text-2xl md:text-3xl font-extrabold text-white text-center max-w-md">
            {currentSinger.name} <span className="text-purple-400">{phrase}</span>
          </p>
          <p className="text-lg md:text-xl text-yellow-400 mt-1 mb-6">
            {currentSinger.song}
          </p>

          <div className="flex flex-col items-center gap-1.5">
            <QRCode url={reactUrl} size={130} />
            <p className="text-sm text-purple-300">Escanea para reaccionar</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          from { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          to { transform: translateY(-70vh) scale(1.5) rotate(12deg); opacity: 0; }
        }
        .floating-emoji {
          animation: floatUp 2.2s ease-out forwards;
        }
        .spin-vinyl {
          animation: spinVinyl 7s linear infinite;
        }
        @keyframes spinVinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fact-fade {
          animation: factFade 6.5s ease-in-out;
        }
        @keyframes factFade {
          0% { opacity: 0; }
          8% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
