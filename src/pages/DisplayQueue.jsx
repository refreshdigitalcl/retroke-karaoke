import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import ThemeToggle from '../components/ThemeToggle'
import QRCode from '../components/QRCode'

export default function DisplayQueue() {
  const { barName, sessionCode, queue, currentSinger } = useKaraokeSession()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const registerUrl = origin + '/registro?bar=' + sessionCode

  return (
    <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col bg-black">
      <RetroEqualizer />

      <header className="flex items-center justify-between relative z-10 mb-10">
        <div className="px-4 py-1.5 -skew-x-6 bg-pink-600">
          <span className="inline-block skew-x-6 text-sm font-medium text-white tracking-wide">
            {barName}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-yellow-400">Escanea para cantar</p>
            <p className="text-xs text-purple-400">karaoke.cl/{sessionCode}</p>
          </div>
          <QRCode url={registerUrl} size={80} />
          <ThemeToggle />
        </div>
      </header>

      <section className="relative z-10 text-center mb-10">
        <p className="text-sm mb-3 tracking-widest uppercase text-yellow-400">Cantando ahora</p>
        {currentSinger ? (
          <div className="inline-flex items-center gap-5 rounded-2xl px-9 py-5 border-2 border-pink-600 bg-neutral-900">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-pink-600">
              {currentSinger.avatar}
            </div>
            <div className="text-left">
              <p className="text-2xl font-medium text-white">{currentSinger.name}</p>
              <p className="text-base mt-0.5 text-purple-400">{currentSinger.song}</p>
            </div>
          </div>
        ) : (
          <div className="inline-block rounded-2xl px-9 py-6 border border-neutral-700 bg-neutral-900">
            <p className="text-neutral-400">Esperando al próximo cantante</p>
          </div>
        )}
      </section>

      <section className="relative z-10 max-w-lg w-full mx-auto flex-1">
        <p className="text-sm mb-3 tracking-widest uppercase text-center text-yellow-400">
          Próximos en la fila
        </p>
        <div className="flex flex-col gap-2.5">
          {queue.length === 0 && (
            <p className="text-center text-sm text-neutral-500">
              La cola está vacía. Escanea el QR para anotarte.
            </p>
          )}
          {queue.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3.5 rounded-r-xl py-3 px-4 border-l-4 border-purple-500 bg-neutral-900"
            >
              <span className="w-6 text-sm font-medium text-purple-400">{index + 1}</span>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-pink-600">
                {entry.avatar}
              </div>
              <div className="flex-1">
                <p className="text-base text-white">{entry.name}</p>
                <p className="text-sm text-neutral-400">{entry.song}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center text-sm mt-8 text-purple-400">
        {queue.length} personas en cola esta noche
      </footer>
    </div>
  )
}
