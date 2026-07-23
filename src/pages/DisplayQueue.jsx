import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FloatingDecor from '../components/FloatingDecor'
import FullscreenButton from '../components/FullscreenButton'
import FallingParty from '../components/FallingParty'

function QueueRow(props) {
  var entry = props.entry
  var position = props.position
  var isNext = position === 1

  var artworkState = useState(null)
  var artwork = artworkState[0]
  var setArtwork = artworkState[1]

  var artistState = useState('')
  var artist = artistState[0]
  var setArtist = artistState[1]

  var statusState = useState('loading')
  var status = statusState[0]
  var setStatus = statusState[1]

  useEffect(function () {
    var cancelled = false
    var query = encodeURIComponent(entry.song)
    fetch('https://itunes.apple.com/search?term=' + query + '&entity=song&limit=1')
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          setArtwork(data.results[0].artworkUrl100)
          setArtist(data.results[0].artistName)
          setStatus('found')
        } else {
          setStatus('none')
        }
      })
      .catch(function () {
        if (!cancelled) setStatus('none')
      })
    return function () {
      cancelled = true
    }
  }, [entry.song])

  return (
    <div className="relative rounded-xl p-3 bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-pink-600 flex items-center justify-center text-xl">
        {artwork ? (
          <img src={artwork} alt={entry.song} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
        <p className="text-xs text-purple-300 truncate">
          {status === 'loading' && 'Buscando artista...'}
          {status === 'found' && artist}
          {status === 'none' && 'Artista no encontrado'}
        </p>
        <p className="text-xs text-neutral-400 truncate">{entry.song}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-xs text-neutral-500">#{position}</span>
        {isNext && (
          <span className="ready-pulse text-[10px] font-bold px-2.5 py-1 rounded-full bg-lime-400 text-black tracking-wide">
            READY
          </span>
        )}
      </div>
    </div>
  )
}

function Backstage(props) {
  var queue = props.queue
  var rows = []
  var i = 0
  while (i < queue.length) {
    rows.push(<QueueRow key={queue[i].id} entry={queue[i]} position={i + 1} />)
    i = i + 1
  }

  return (
    <div className="w-full h-full flex flex-col rounded-3xl border-2 border-purple-500 bg-neutral-950/80 px-6 py-6">
      <p className="text-xs tracking-[4px] uppercase text-purple-400 mb-1">
        Lista de espera
      </p>
      <h2 className="text-2xl font-extrabold text-white mb-5">Backstage</h2>
      {rows.length === 0 && (
        <p className="text-sm text-neutral-500">
          Aun no hay nadie anotado. Escanea el QR y se el primero en subir al escenario.
        </p>
      )}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[520px]">{rows}</div>
      <style>{`
        .ready-pulse {
          animation: readyPulse 1.6s ease-in-out infinite;
          box-shadow: 0 0 12px 3px rgba(163, 230, 53, 0.65);
        }
        @keyframes readyPulse {
          0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 10px 2px rgba(163, 230, 53, 0.55); }
          50% { transform: translateY(-2px) scale(1.05); box-shadow: 0 0 16px 5px rgba(163, 230, 53, 0.85); }
        }
      `}</style>
    </div>
  )
}

function groupRatings(ratings) {
  var map = {}
  var order = []
  var i = 0
  while (i < ratings.length) {
    var r = ratings[i]
    if (!map[r.singerId]) {
      map[r.singerId] = { name: r.name, total: 0, count: 0 }
      order.push(r.singerId)
    }
    map[r.singerId].total = map[r.singerId].total + r.score
    map[r.singerId].count = map[r.singerId].count + 1
    i = i + 1
  }
  var result = []
  var j = 0
  while (j < order.length) {
    var id = order[j]
    var e = map[id]
    result.push({ id: id, name: e.name, average: (e.total / e.count).toFixed(1) })
    j = j + 1
  }
  return result
}

export default function DisplayQueue() {
  var session = useKaraokeSession()
  var barName = session.barName
  var sessionCode = session.sessionCode
  var queue = session.queue
  var ratings = session.ratings

  var sungTonight = groupRatings(ratings)

  var sungIndexState = useState(0)
  var sungIndex = sungIndexState[0]
  var setSungIndex = sungIndexState[1]

  useEffect(function () {
    if (sungTonight.length < 2) return
    var id = setInterval(function () {
      setSungIndex(function (prev) {
        return (prev + 1) % sungTonight.length
      })
    }, 4000)
    return function () {
      clearInterval(id)
    }
  }, [sungTonight.length])

  var currentSung = sungTonight.length > 0 ? sungTonight[sungIndex % sungTonight.length] : null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var registerUrl = origin + '/registro?bar=' + sessionCode

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />
      <FullscreenButton />

      <header className="flex items-center justify-center relative z-10 pt-8 pb-4">
        <div className="px-5 py-2 -skew-x-6 bg-pink-600">
          <span className="inline-block skew-x-6 text-base font-bold text-white tracking-wide">
            {barName}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full mx-auto px-8 pb-10">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs tracking-[6px] uppercase text-yellow-400 mb-3">
            Karaoke en vivo
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Unete a nuestra{' '}
            <span className="text-pink-500">fiesta de karaoke</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-300 mb-8 max-w-md">
            Escanea el codigo QR, anota tu nombre y tu cancion, y preparate
            para brillar en el escenario.
          </p>
          <div className="rounded-3xl border-2 border-yellow-400 bg-neutral-900/90 px-8 py-7 flex flex-col items-center gap-3 shadow-2xl">
            <QRCode url={registerUrl} size={220} />
            <p className="text-sm font-semibold text-purple-300 tracking-wide">
              karaoke.cl/{sessionCode}
            </p>
          </div>

          {currentSung && (
            <div className="mt-6 w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950/70 px-5 py-4">
              <p className="text-xs tracking-widest uppercase text-purple-400 mb-2 text-center">
                Ya cantaron esta noche
              </p>
              <div className="h-8 flex items-center justify-center overflow-hidden">
                <div
                  key={currentSung.id + '-' + sungIndex}
                  className="glitch-row flex items-center gap-3"
                >
                  <span className="text-white font-medium">{currentSung.name}</span>
                  <span className="text-yellow-400 font-bold">{currentSung.average}</span>
                </div>
              </div>
            </div>
          )}
          <style>{`
            .glitch-row {
              animation: glitchIn 0.5s steps(3) forwards;
            }
            @keyframes glitchIn {
              0% { opacity: 0; transform: translate(-6px, 2px); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
              15% { opacity: 1; transform: translate(4px, -2px); text-shadow: -3px 0 #8B5CF6, 3px 0 #F4D03F; }
              30% { transform: translate(-3px, 1px); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
              45% { transform: translate(2px, -1px); text-shadow: none; }
              60%, 100% { transform: translate(0,0); text-shadow: none; opacity: 1; }
            }
          `}</style>
        </div>

        <div className="min-h-[560px]">
          <Backstage queue={queue} />
        </div>
      </main>
    </div>
  )
}
