import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import ThemeToggle from '../components/ThemeToggle'
import QRCode from '../components/QRCode'

function QueueRow(props) {
  var entry = props.entry
  var position = props.position
  return (
    <div
      className="flex items-center gap-3.5 rounded-r-xl py-3 px-4 border-l-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-purple)' }}
    >
      <span className="w-6 text-sm font-medium" style={{ color: 'var(--accent-purple)' }}>
        {position}
      </span>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: 'var(--accent-magenta)' }}
      >
        {entry.avatar}
      </div>
      <div className="flex-1">
        <p className="text-base" style={{ color: 'var(--text-primary)' }}>
          {entry.name}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {entry.song}
        </p>
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
  if (rows.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        La cola esta vacia. Escanea el QR para anotarte.
      </p>
    )
  }
  return <div className="flex flex-col gap-2.5">{rows}</div>
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

  var singerName = ''
  var singerSong = ''
  var singerAvatar = ''
  if (currentSinger) {
    singerName = currentSinger.name
    singerSong = currentSinger.song
    singerAvatar = currentSinger.avatar
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col"
      style={{ background: 'var(--bg-page)' }}
    >
      <RetroEqualizer />

      <header className="flex items-center justify-between relative z-10 mb-8">
        <div className="px-4 py-1.5 -skew-x-6" style={{ background: 'var(--accent-magenta)' }}>
          <span className="inline-block skew-x-6 text-sm font-medium text-white tracking-wide">
            {barName}
          </span>
        </div>
        <ThemeToggle />
      </header>

      <section className="relative z-10 text-center mb-8">
        <p className="text-sm mb-3 tracking-widest uppercase" style={{ color: 'var(--accent-yellow)' }}>
          Cantando ahora
        </p>
        <div
          className="inline-flex items-center gap-5 rounded-2xl px-9 py-5 border-2"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-magenta)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {singerAvatar}
          </div>
          <div className="text-left">
            <p className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
              {singerName}
            </p>
            <p className="text-base mt-0.5" style={{ color: 'var(--accent-purple)' }}>
              {singerSong}
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex-1 flex flex-col md:flex-row gap-8 max-w-5xl w-full mx-auto items-start">
        <div className="flex-1 w-full">
          <p
            className="text-sm mb-3 tracking-widest uppercase text-center md:text-left"
            style={{ color: 'var(--accent-yellow)' }}
          >
            Proximos en la fila
          </p>
          <QueueList queue={queue} />
          <p className="text-center md:text-left text-sm mt-6" style={{ color: 'var(--accent-purple)' }}>
            {queue.length} personas en cola esta noche
          </p>
        </div>

        <div
          className="flex flex-col items-center gap-3 rounded-2xl px-8 py-8 border-2 mx-auto md:mx-0"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-yellow)' }}
        >
          <p className="text-base font-medium" style={{ color: 'var(--accent-yellow)' }}>
            Escanea para cantar
          </p>
          <QRCode url={registerUrl} size={240} />
          <p className="text-sm" style={{ color: 'var(--accent-purple)' }}>
            karaoke.cl/{sessionCode}
          </p>
        </div>
      </section>
    </div>
  )
}
