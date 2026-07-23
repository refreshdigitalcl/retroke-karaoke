import { useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

function LoginGate() {
  var auth = useAuth()
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]

  var sentState = useState(false)
  var sent = sentState[0]
  var setSent = sentState[1]

  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return
    auth.signInWithEmail(email.trim()).then(function (result) {
      if (result.error) {
        setError('No se pudo enviar el link. Intenta de nuevo.')
      } else {
        setSent(true)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Panel del DJ
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Ingresa tu correo para recibir tu link de acceso
        </p>

        {sent ? (
          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>
            Revisa tu correo y haz clic en el link para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              placeholder="tu@correo.com"
              required
              className="w-full mb-3 h-11 rounded-lg px-3 border outline-none"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="w-full h-11 rounded-lg font-medium text-white"
              style={{ background: 'var(--accent-magenta)' }}
            >
              Enviar link de acceso
            </button>
            {error && (
              <p className="text-sm mt-3" style={{ color: 'var(--accent-magenta)' }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default function DjPanel() {
  var auth = useAuth()

  var {
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

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!auth.session) {
    return <LoginGate />
  }

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
          <button
            onClick={function () { auth.signOut() }}
            className="text-sm px-3 h-9 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cerrar sesion
          </button>
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
                  Terminar cancion, pedir votos
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
          <p style={{ color: 'var(--text-secondary)' }}>Nadie esta cantando ahora mismo.</p>
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
          {queue.map(function (entry, index) {
            return (
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
                  onClick={function () { removeFromQueue(entry.id) }}
                  className="text-xs px-2.5 py-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Quitar
                </button>
              </div>
            )
          })}
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
            {ratings.map(function (r, i) {
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {r.name} — {r.song}
                  </span>
                  <span style={{ color: 'var(--accent-yellow)' }}>{r.score}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function screenLabel(mode) {
  if (mode === 'reactions') return 'reacciones en vivo'
  if (mode === 'rating') return 'calificacion'
  return 'cola'
}

function DjRatingShortcut(props) {
  return (
    <button
      onClick={function () { props.submitRating(8) }}
      className="px-4 h-10 rounded-lg text-sm border"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      title="Solo para pruebas"
    >
      Simular voto de prueba
    </button>
  )
}
