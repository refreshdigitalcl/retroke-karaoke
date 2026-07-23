import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FloatingDecor from '../components/FloatingDecor'
import FullscreenButton from '../components/FullscreenButton'

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
    <div className="relative rounded-xl p-3 pt-4 bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
      {isNext && (
        <span className="ready-pulse absolute top-1.5 right-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-lime-400 text-black tracking-wide z-10">
          READY
        </span>
      )}
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
      <span className="text-xs text-neutral-500 shrink-0 self-start mt-1">#{position}</span>
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
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">{rows}</div>
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

export default function DisplayQueue() {
  var session = useKaraokeSession()
  var barName = session.barName
  var sessionCode = session.sessionCode
  var queue = session.queue

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var registerUrl = origin + '/registro?bar=' + sessionCode

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-black">
      <RetroEqualizer />
      <FloatingDecor />
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
        </div>

        <div className="min-h-[420px]">
          <Backstage queue={queue} />
        </div>
      </main>
    </div>
  )
}
