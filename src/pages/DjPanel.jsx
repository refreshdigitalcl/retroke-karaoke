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

function StartSessionGate(props) {
  var barName = props.barName
  var barIsActive = props.barIsActive
  var startSession = props.startSession

  var nameState = useState('Karaoke ' + new Date().toLocaleDateString('es-CL', { weekday: 'long' }))
  var name = nameState[0]
  var setName = nameState[1]

  var loadingState = useState(false)
  var loading = loadingState[0]
  var setLoading = loadingState[1]

  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  if (!barIsActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--accent-magenta)' }}>
            Servicio desactivado
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Este bar esta desactivado en la plataforma. Contacta al administrador de Retroke para reactivarlo.
          </p>
        </div>
      </div>
    )
  }

  function handleStart(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    startSession(name.trim()).then(function (result) {
      setLoading(false)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          No existe una sesion activa
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Dale un nombre a la sesion de esta noche para empezar
        </p>

        <form onSubmit={handleStart}>
          <input
            type="text"
            value={name}
            onChange={function (e) { setName(e.target.value) }}
            placeholder="Ej: Karaoke Viernes"
            required
            className="w-full mb-3 h-11 rounded-lg px-3 border outline-none"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {loading ? 'Iniciando...' : 'Iniciar sesion'}
          </button>
          {error && (
            <p className="text-sm mt-3" style={{ color: 'var(--accent-magenta)' }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}

function HistoryPanel(props) {
  var sessions = props.sessions

  function formatDate(iso) {
    if (!iso) return ''
    var d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
  }

  return (
    <section
      className="rounded-2xl border p-5 mt-6"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
        Historial de sesiones
      </p>
      {sessions.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Aun no hay sesiones cerradas.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {sessions.map(function (s) {
          return (
            <div key={s.id} className="rounded-lg p-3" style={{ background: 'var(--bg-card-alt)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {s.name} — {formatDate(s.startedAt)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {s.songCount} canciones · {s.ratingCount} votos
                {s.average ? ' · Promedio ' + s.average : ''}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function DjPanel() {
  var auth = useAuth()

  var session = useKaraokeSession()
  var barName = session.barName
  var barIsActive = session.barIsActive
  var barLoading = session.barLoading
  var sessionCode = session.sessionCode
  var hasActiveSession = session.hasActiveSession
  var activeSessionName = session.activeSessionName
  var queue = session.queue
  var currentSinger = session.currentSinger
  var screenMode = session.screenMode
  var removeFromQueue = session.removeFromQueue
  var setQueueEntryVideo = session.setQueueEntryVideo
  var callSinger = session.callSinger
  var startCountdown = session.startCountdown
  var finishCurrentSong = session.finishCurrentSong
  var submitRating = session.submitRating
  var closeVoting = session.closeVoting
  var returnToQueue = session.returnToQueue
  var ratings = session.ratings
  var startSession = session.startSession
  var closeSession = session.closeSession
  var loadPastSessions = session.loadPastSessions

  var showHistoryState = useState(false)
  var showHistory = showHistoryState[0]
  var setShowHistory = showHistoryState[1]

  var pastSessionsState = useState([])
  var pastSessions = pastSessionsState[0]
  var setPastSessions = pastSessionsState[1]

  var closingState = useState(false)
  var closing = closingState[0]
  var setClosing = closingState[1]

  function handleToggleHistory() {
    if (!showHistory) {
      loadPastSessions().then(function (data) {
        setPastSessions(data)
      })
    }
    setShowHistory(!showHistory)
  }

  function handleCloseSession() {
    if (!window.confirm('Cerrar la sesion de esta noche? No se aceptaran mas canciones.')) return
    setClosing(true)
    closeSession().then(function () {
      setClosing(false)
    })
  }

  if (auth.loading || barLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!auth.session) {
    return <LoginGate />
  }

  if (!hasActiveSession) {
    return <StartSessionGate barName={barName} barIsActive={barIsActive} startSession={startSession} />
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      <header className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {barName} · {activeSessionName}
          </p>
          <p className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            Panel del DJ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--accent-purple)' }}>
            karaoke.cl/{sessionCode}
          </span>
          <button
            onClick={handleCloseSession}
            disabled={closing}
            className="text-sm px-3 h-9 rounded-lg border disabled:opacity-50"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            {closing ? 'Cerrando...' : 'Cerrar sesion de karaoke'}
          </button>
          <button
            onClick={function () { auth.signOut() }}
            className="text-sm px-3 h-9 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Salir
          </button>
          <ThemeToggle />
        </div>
      </header>

      <button
        onClick={handleToggleHistory}
        className="text-xs mb-6 underline"
        style={{ color: 'var(--text-muted)' }}
      >
        {showHistory ? 'Ocultar historial' : 'Ver historial de sesiones'}
      </button>

      {showHistory && <HistoryPanel sessions={pastSessions} />}

      <section
        className="rounded-2xl border p-5 mb-6 mt-6"
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
                {screenMode === 'called' && !currentSinger.videoId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--accent-magenta)' }}>
                    ⚠️ Video no seleccionado
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {screenMode === 'called' && (
                <button
                  onClick={startCountdown}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--accent-magenta)' }}
                >
                  Iniciar presentacion
                </button>
              )}
              {screenMode === 'countdown' && (
                <span className="px-4 h-10 flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cuenta regresiva en curso...
                </span>
              )}
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
                <>
                  <DjRatingShortcut submitRating={submitRating} />
                  <button
                    onClick={closeVoting}
                    className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'var(--accent-purple)' }}
                  >
                    Cerrar votacion
                  </button>
                </>
              )}
              {screenMode === 'result' && (
                <span className="px-4 h-10 flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Mostrando resultado en pantalla
                </span>
              )}
              <button
                onClick={returnToQueue}
                className="px-4 h-10 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {screenMode === 'called' ? 'Cancelar' : screenMode === 'result' ? 'Siguiente cantante' : 'Volver a la cola'}
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
        </div>

        <div className="flex flex-col gap-2">
          {queue.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay nadie esperando. Comparte el QR para que la gente se anote.
            </p>
          )}
          {queue.map(function (entry, index) {
            return (
              <QueueRowAdmin
                key={entry.id}
                entry={entry}
                index={index}
                canCall={!currentSinger}
                callSinger={callSinger}
                removeFromQueue={removeFromQueue}
                setQueueEntryVideo={setQueueEntryVideo}
              />
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
            Calificaciones de esta sesion
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

function QueueRowAdmin(props) {
  var entry = props.entry
  var index = props.index
  var canCall = props.canCall
  var callSinger = props.callSinger
  var removeFromQueue = props.removeFromQueue
  var setQueueEntryVideo = props.setQueueEntryVideo

  var openState = useState(false)
  var open = openState[0]
  var setOpen = openState[1]

  var urlState = useState(entry.videoUrl || '')
  var url = urlState[0]
  var setUrl = urlState[1]

  var savedState = useState(false)
  var saved = savedState[0]
  var setSaved = savedState[1]

  function handleSave() {
    setQueueEntryVideo(entry.id, url.trim()).then(function () {
      setSaved(true)
      setTimeout(function () { setSaved(false) }, 1500)
    })
  }

  return (
    <div className="rounded-lg py-2.5 px-3" style={{ background: 'var(--bg-card-alt)' }}>
      <div className="flex items-center gap-3">
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
          onClick={function () { setOpen(!open) }}
          className="text-xs px-2.5 py-1 rounded"
          style={{ color: entry.videoId ? 'var(--accent-green)' : 'var(--text-muted)' }}
        >
          {entry.videoId ? 'Video listo' : 'Agregar video'}
        </button>
        {canCall && (
          <button
            onClick={function () { callSinger(entry.id) }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-magenta)' }}
          >
            Llamar
          </button>
        )}
        <button
          onClick={function () { removeFromQueue(entry.id) }}
          className="text-xs px-2.5 py-1 rounded"
          style={{ color: 'var(--text-muted)' }}
        >
          Quitar
        </button>
      </div>

      {open && (
        <div className="flex gap-2 mt-2.5 pl-8">
          <input
            type="text"
            value={url}
            onChange={function (e) { setUrl(e.target.value) }}
            placeholder="Pega el link de YouTube"
            className="flex-1 h-9 rounded-lg px-3 border outline-none text-sm"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSave}
            className="h-9 px-3 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
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
