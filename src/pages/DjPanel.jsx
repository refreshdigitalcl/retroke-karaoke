import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'

export default function DjPanel() {
  const {
    barName,
    sessionCode,
    queue,
    currentSinger,
    screenMode,
    removeFromQueue,
    startNextSinger,
    finishCurrentSong,
    submitRating,
    returnToQueue,
    ratings
  } = useKaraokeSession()

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Panel del DJ
          </p>
          <p className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {barName}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--accent-purple)' }}>
            karaoke.cl/{sessionCode}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <section
        className="rounded-2xl border p-5 mb-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
          Estado actual
        </p>

        {currentSinger ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden"
                style={{ background: 'var(--accent-magenta)' }}
              >
                {currentSinger.photo ? (
                  <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
                ) : (
                  currentSinger.avatar
                )}
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentSinger.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {currentSinger.song} · pantalla: {screenLabel(screenMode)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {screenMode === 'reactions' && (
                <button
                  onClick={finishCurrentSong}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--accent-purple)' }}
                >
                  Terminar canción, pedir votos
                </button>
              )}
              {screenMode === 'rating' && (
                <DjRatingShortcut submitRating={submitRating} />
              )}
              <button
                onClick={returnToQueue}
                className="px-4 h-10 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Volver a la cola
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Nadie está cantando ahora mismo.</p>
        )}
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--accent-yellow)' }}>
            Cola ({queue.length})
          </p>
          {!currentSinger && queue.length > 0 && (
            <button
              onClick={startNextSinger}
              className="px-4 h-9 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--accent-magenta)' }}
            >
              Llamar al siguiente
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {queue.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay nadie esperando. Comparte el QR para que la gente se anote.
            </p>
          )}
          {queue.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg py-2.5 px-3"
              style={{ background: 'var(--bg-card-alt)' }}
            >
              <span className="text-sm w-5" style={{ color: 'var(--text-muted)' }}>
                {index + 1}
              </span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base overflow-hidden"
                style={{ background: 'var(--accent-purple)' }}
              >
                {entry.photo ? (
                  <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  entry.avatar
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {entry.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {entry.song}
                </p>
              </div>
              <button
                onClick={() => removeFromQueue(entry.id)}
                className="text-xs px-2.5 py-1 rounded"
                style={{ color: 'var(--text-muted)' }}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </section>

      {ratings.length > 0 && (
        <section
          className="rounded-2xl border p-5 mt-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
            Historial de la noche
          </p>
          <div className="flex flex-col gap-1.5">
            {ratings.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-primary)' }}>
                  {r.name} — {r.song}
                </span>
                <span style={{ color: 'var(--accent-yellow)' }}>{r.score}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function screenLabel(mode) {
  if (mode === 'reactions') return 'reacciones en vivo'
  if (mode === 'rating') return 'calificación'
  return 'cola'
}

function DjRatingShortcut({ submitRating }) {
  return (
    <button
      onClick={() => submitRating(8)}
      className="px-4 h-10 rounded-lg text-sm border"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      title="Solo para pruebas — la nota real la envía el público desde su celular"
    >
      Simular voto de prueba
    </button>
  )
}
