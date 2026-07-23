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
  while (i < parts.length && facts.length < 5) {
    var p = parts[i].trim()
    if (p.length > 25) facts.push(p)
    i = i + 1
  }
  return facts
}

function SongInfoPanel(props) {
  var song = props.song

  var infoState = useState(null)
  var info = infoState[0]
  var setInfo = infoState[1]

  var factsState = useState([])
  var facts = factsState[0]
  var setFacts = factsState[1]

  var factIndexState = useState(0)
  var factIndex = factIndexState[0]
  var setFactIndex = factIndexState[1]

  useEffect(function () {
    var cancelled = false
    setInfo(null)
    setFacts([])
    setFactIndex(0)

    fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1')
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          var r = data.results[0]
          var bigArtwork = r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : ''
          var year = r.releaseDate ? r.releaseDate.slice(0, 4) : ''
          setInfo({
            artist: r.artistName,
            album: r.collectionName || '',
            year: year,
            artwork: bigArtwork
          })

          fetch('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(r.artistName))
            .then(function (res2) { return res2.ok ? res2.json() : null })
            .then(function (wiki) {
              if (cancelled) return
              if (wiki && wiki.extract) {
                setFacts(splitFacts(wiki.extract))
              }
            })
            .catch(function () {})
        }
      })
      .catch(function () {})

    return function () {
      cancelled = true
    }
  }, [song])

  useEffect(function () {
    if (facts.length < 2) return
    var id = setInterval(function () {
      setFactIndex(function (prev) {
        return (prev + 1) % facts.length
      })
    }, 7000)
    return function () {
      clearInterval(id)
    }
  }, [facts])

  return (
    <div className="rounded-3xl border-2 border-purple-500 bg-neutral-950/85 px-7 py-7 w-full max-w-md flex flex-col items-center text-center">
      <p className="text-xs tracking-widest uppercase text-yellow-400 mb-4">
        Sobre esta cancion
      </p>

      <div className="w-40 h-40 rounded-xl overflow-hidden bg-pink-600 mb-4 flex items-center justify-center text-4xl shrink-0">
        {info && info.artwork ? (
          <img src={info.artwork} alt={song} className="w-full h-full object-cover" />
        ) : (
          '🎵'
        )}
      </div>

      <p className="text-lg font-bold text-white">{info ? info.artist : 'Buscando...'}</p>
      {info && info.album && (
        <p className="text-sm text-purple-300 mt-0.5">{info.album}</p>
      )}
      {info && info.year && (
        <p className="text-xs text-neutral-400 mt-1">Lanzamiento: {info.year}</p>
      )}

      {facts.length > 0 && (
        <div className="mt-5 min-h-[70px] flex items-center">
          <p className="text-sm text-neutral-300 leading-relaxed">
            {facts[factIndex]}
          </p>
        </div>
      )}
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

  return (
    <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col items-center bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="absolute inset-0 pointer-events-none z-10">{floaters}</div>

      <span className="relative z-10 text-xs px-3 py-1 rounded-full text-white bg-pink-600 mb-8">
        En vivo
      </span>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full items-start">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-purple-500 flex items-center justify-center text-6xl bg-pink-600 spin-vinyl"
            style={{ boxShadow: '0 0 30px 6px rgba(139, 92, 246, 0.55)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>

          <p className="text-2xl md:text-3xl font-extrabold text-white mt-6 max-w-md">
            {currentSinger.name} <span className="text-purple-400">{phrase}</span>
          </p>
          <p className="text-base md:text-lg text-yellow-400 mt-1 mb-6">
            {currentSinger.song}
          </p>

          <div className="flex flex-col items-center gap-1.5">
            <QRCode url={reactUrl} size={130} />
            <p className="text-[11px] text-purple-300">Escanea para reaccionar</p>
          </div>
        </div>

        <div className="flex justify-center">
          <SongInfoPanel song={currentSinger.song} />
        </div>
      </div>

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
