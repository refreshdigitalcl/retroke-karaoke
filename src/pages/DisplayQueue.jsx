import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'

function QueueRow(props) {
  var entry = props.entry
  var position = props.position
  return (
    <div className="flex items-center gap-3 rounded-r-xl py-2.5 px-4 border-l-4 border-purple-500 bg-neutral-900/80">
      <span className="w-6 text-sm font-semibold text-purple-400">
        {position}
      </span>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-base bg-pink-600 shrink-0">
        {entry.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{entry.name}</p>
        <p className="text-xs text-neutral-400 truncate">{entry.song}</p>
      </div>
    </div>
  )
}

function QueueList(props) {
  var queue = props.queue
  var rows = []
  var i = 0
  while (i < queue.length) {
    rows.push(<QueueRow key={queue[i].id} entry={queue[i]} position={i + 1} />)
    i = i + 1
  }
  return <div className="flex flex-col gap-2">{rows}</div>
}

function WaitingHero(props) {
  var registerUrl = props.registerUrl
  var sessionCode = props.sessionCode
  var queueCount = props.queueCount
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
      <p className="text-sm tracking-[6px] uppercase text-yellow-400 mb-3">
        Karaoke en vivo
      </p>
      <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
        Únete a nuestra{' '}
        <span className="text-pink-500">fiesta de karaoke</span>
      </h1>
      <p className="text-base md:text-lg text-neutral-300 mb-10 max-w-xl">
        Escanea el código QR en pantalla, anota tu nombre y tu canción,
        y prepárate para brillar en el escenario.
      </p>
      <div className="rounded-3xl border-2 border-yellow-400 bg-neutral-900/90 px-10 py-8 flex flex-col items-center gap-4 shadow-2xl">
        <QRCode url={registerUrl} size={260} />
        <p className="text-sm font-semibold text-purple-300 tracking-wide">
          karaoke.cl/{sessionCode}
        </p>
      </div>
      {queueCount > 0 && (
        <p className="text-sm text-neutral-400 mt-8">
          {queueCount} {queueCount === 1 ? 'persona ya se anotó' : 'personas ya se anotaron'} para cantar
        </p>
      )}
    </div>
  )
}

function SingerSpotlight(props) {
  var name = props.name
  var song = props.song
  var avatar = props.avatar
  return (
    <div className="inline-flex items-center gap-5 rounded-2xl px-8 py-5 border-2 border-pink-600 bg-neutral-900/90">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-pink-600 shrink-0">
        {avatar}
      </div>
      <div className="text-left">
        <p className="text-2xl font-bold text-white">{name}</p>
        <p className="text-base text-purple-300">{song}</p>
      </div>
    </div>
  )
}

export default function DisplayQueue() {
  var session = useKaraokeSession()
  var barName = session.barName
  var sessionCode = session.sessionCode
  var queue = session.queue
  var currentSinger = session.currentSinger

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var registerUrl = origin + '/registro?bar=' + sessionCode

  var hasSinger = !!currentSinger

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-black">
      <RetroEqualizer />

      <header className="flex items-center justify-center relative z-10 pt-8 pb-2">
        <div className="px-5 py-2 -skew-x-6 bg-pink-600">
          <span className="inline-block skew-x-6 text-base font-bold text-white tracking-wide">
            {barName}
          </span>
        </div>
      </header>

      {!hasSinger && (
        <WaitingHero
          registerUrl={registerUrl}
          sessionCode={sessionCode}
          queueCount={queue.length}
        />
      )}

      {hasSinger && (
        <section className="relative z-10 flex-1 flex flex-col md:flex-row gap-10 max-w-6xl w-full mx-auto px-8 py-8 items-start">
          <div className="flex-1 w-full flex flex-col items-center md:items-start gap-8">
            <div>
              <p className="text-sm mb-3 tracking-widest uppercase text-yellow-400 text-center md:text-left">
                Cantando ahora
              </p>
              <SingerSpotlight
                name={currentSinger.name}
                song={currentSinger.song}
                avatar={currentSinger.avatar}
              />
            </div>
            <div className="w-full max-w-md">
              <p className="text-sm mb-3 tracking-widest uppercase text-yellow-400 text-center md:text-left">
                Próximos en la fila
              </p>
              {queue.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Nadie más en la fila todavía.
                </p>
              )}
              <QueueList queue={queue} />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-yellow-400 bg-neutral-900/90 px-6 py-6 flex flex-col items-center gap-3 mx-auto md:mx-0 shrink-0">
            <p className="text-sm font-semibold text-yellow-400">
              Sigue la fiesta
            </p>
            <QRCode url={registerUrl} size={160} />
            <p className="text-xs text-purple-300">
              karaoke.cl/{sessionCode}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
