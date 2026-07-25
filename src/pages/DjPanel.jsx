import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useAuth } from '../contexts/AuthContext'
import { checkYoutubeEmbeddable } from '../components/YouTubePlayer'
import SimilarTrackSearch from '../components/SimilarTrackSearch'
import WorkspaceSelector, { useMyBars } from '../components/WorkspaceSelector'
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

  var pinState = useState('')
  var pin = pinState[0]
  var setPin = pinState[1]

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
    if (pin && !/^\d{4}$/.test(pin)) {
      setError('El PIN debe tener exactamente 4 numeros')
      return
    }
    setLoading(true)
    setError('')
    startSession(name.trim(), pin || null).then(function (result) {
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
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={function (e) { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)) }}
            placeholder="PIN de 4 digitos (opcional, se genera solo)"
            className="w-full mb-3 h-11 rounded-lg px-3 border outline-none text-center tracking-[6px]"
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
  var myBars = useMyBars(auth)

  var session = useKaraokeSession()
  var barName = session.barName
  var workspacePlan = session.workspacePlan
  var barIsActive = session.barIsActive
  var barLoading = session.barLoading
  var sessionCode = session.sessionCode
  var activeSessionPin = session.activeSessionPin
  var spaceParam = session.spaceParam
  var hasActiveSession = session.hasActiveSession
  var activeSessionName = session.activeSessionName
  var queue = session.queue
  var currentSinger = session.currentSinger
  var screenMode = session.screenMode
  var removeFromQueue = session.removeFromQueue
  var setQueueEntryVideo = session.setQueueEntryVideo
  var callSinger = session.callSinger
  var setCurrentSingerVideo = session.setCurrentSingerVideo
  var startPlaying = session.startPlaying
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

  var checkStatusState = useState('idle')
  var checkStatus = checkStatusState[0]
  var setCheckStatus = checkStatusState[1]

  function handleCheckVideo() {
    if (!currentSinger || !currentSinger.videoId) return
    setCheckStatus('checking')
    checkYoutubeEmbeddable(currentSinger.videoId).then(function (ok) {
      setCheckStatus(ok ? 'ok' : 'blocked')
    })
  }

  function handleSelectSimilar(videoUrl, videoId) {
    setCurrentSingerVideo(videoUrl, videoId).then(function () {
      setCheckStatus('checking')
      checkYoutubeEmbeddable(videoId).then(function (ok) {
        setCheckStatus(ok ? 'ok' : 'blocked')
      })
    })
  }

  useEffect(function () {
    setCheckStatus('idle')
  }, [currentSinger ? currentSinger.id : null])

  function handleStartPresentation() {
    if (!currentSinger) return
    startPlaying()
  }

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

  var urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  var barSlugParam = urlParams ? urlParams.get('bar') : null
  var wsParam = urlParams ? urlParams.get('ws') : null

  if (wsParam) {
    // Modo Workspace directo (DJ Pro / Home): el contexto ya resuelve todo, no pasar por el selector de bares
  } else {

  if (myBars === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (myBars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta no esta asignada a ningun bar todavia. Pide al administrador que te agregue.
        </p>
      </div>
    )
  }

  var currentBarInList = barSlugParam
    ? myBars.find(function (b) { return b.slug === barSlugParam })
    : null

  if (barSlugParam && !currentBarInList) {
    return <WorkspaceSelector bars={myBars} notice="No tienes acceso a ese bar. Elige uno de los tuyos." />
  }

  if (!barSlugParam && myBars.length > 1) {
    return <WorkspaceSelector bars={myBars} />
  }

  if (!barSlugParam && myBars.length === 1) {
    if (typeof window !== 'undefined') {
      var only = myBars[0]
      window.location.href = only.kind === 'bar' ? '/dj?bar=' + only.slug : '/dj?ws=' + only.workspaceId
    }
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  } // fin del bloque exclusivo para modo bar (no aplica cuando viene con ?ws=)

  if (!hasActiveSession) {
    return <StartSessionGate barName={barName} barIsActive={barIsActive} startSession={startSession} />
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {barName} · {activeSessionName}
            </p>
            {workspacePlan && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                style={{
                  background:
                    workspacePlan === 'PREMIUM' ? 'rgba(244, 208, 63, 0.18)' :
                    workspacePlan === 'PRO' ? 'rgba(139, 92, 246, 0.18)' :
                    'rgba(255, 255, 255, 0.08)',
                  color:
                    workspacePlan === 'PREMIUM' ? '#F4D03F' :
                    workspacePlan === 'PRO' ? '#8B5CF6' :
                    'var(--text-muted)',
                  border: '1px solid ' + (
                    workspacePlan === 'PREMIUM' ? 'rgba(244, 208, 63, 0.4)' :
                    workspacePlan === 'PRO' ? 'rgba(139, 92, 246, 0.4)' :
                    'var(--border)'
                  )
                }}
              >
                {workspacePlan === 'PREMIUM' ? '👑 PREMIUM' : workspacePlan === 'PRO' ? '⭐ PRO' : 'FREE'}
              </span>
            )}
          </div>
          <p className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            Panel del DJ
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {activeSessionPin && (
            <span
              className="text-sm px-3 h-9 rounded-lg font-bold flex items-center gap-1.5"
              style={{ background: 'rgba(244, 208, 63, 0.12)', color: '#F4D03F', border: '1px solid rgba(244, 208, 63, 0.4)' }}
              title="Comparte este PIN con la gente para que pueda entrar desde la seleccion de salas"
            >
              🔑 PIN: <span className="tracking-[3px]">{activeSessionPin}</span>
            </span>
          )}
          <button
            onClick={function () {
              var url = window.location.origin + '/?' + spaceParam
              window.open(url, '_blank')
            }}
            className="text-sm px-3 h-9 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-purple)' }}
          >
            🖥️ Iniciar sala de espera
          </button>
          <button
            onClick={handleCloseSession}
            disabled={closing}
            className="text-sm px-3 h-9 rounded-lg border disabled:opacity-50 whitespace-nowrap"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            {closing ? 'Cerrando...' : 'Cerrar sesion'}
          </button>
          <button
            onClick={function () { auth.signOut() }}
            className="text-sm px-3 h-9 rounded-lg border whitespace-nowrap"
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
                {screenMode === 'called' && checkStatus === 'ok' && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--accent-green)' }}>
                    ✅ Video verificado, listo para reproducir
                  </p>
                )}
                {screenMode === 'called' && checkStatus === 'blocked' && (
                  <div className="mt-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent-magenta)' }}>
                      ❌ Este video no se puede reproducir aqui. Cambia el link.
                    </p>
                    <SimilarTrackSearch query={currentSinger.song} onSelect={handleSelectSimilar} />
                  </div>
                )}
                {currentSinger.videoError && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--accent-magenta)' }}>
                    ⚠️ Este video no se puede reproducir aqui. Cancela y cambia el link.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {screenMode === 'called' && currentSinger.videoId && (
                <button
                  onClick={handleCheckVideo}
                  disabled={checkStatus === 'checking'}
                  className="px-4 h-10 rounded-lg text-sm font-medium border disabled:opacity-60"
                  style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
                >
                  {checkStatus === 'checking' ? 'Verificando...' : 'Verificar video'}
                </button>
              )}
              {screenMode === 'called' && (
                <button
                  onClick={handleStartPresentation}
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
      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
        <span className="text-sm w-5 shrink-0" style={{ color: 'var(--text-muted)' }}>
          {index + 1}
        </span>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base overflow-hidden shrink-0"
          style={{ background: 'var(--accent-purple)' }}
        >
          {entry.photo ? (
            <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
          ) : (
            entry.avatar
          )}
        </div>
        <div className="flex-1 min-w-[90px]">
          <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {entry.name}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {entry.song}
          </p>
        </div>
        <button
          onClick={function () { setOpen(!open) }}
          className="text-xs px-2.5 py-1 rounded shrink-0"
          style={{ color: entry.videoId ? 'var(--accent-green)' : 'var(--text-muted)' }}
        >
          {entry.videoId ? 'Video listo' : 'Agregar video'}
        </button>
        {canCall && (
          <button
            onClick={function () { callSinger(entry.id) }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white shrink-0"
            style={{ background: 'var(--accent-magenta)' }}
          >
            Llamar
          </button>
        )}
        <button
          onClick={function () { removeFromQueue(entry.id) }}
          className="text-xs px-2.5 py-1 rounded shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          Quitar
        </button>
      </div>

      {open && (
        <div className="mt-2.5 pl-3 sm:pl-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={url}
              onChange={function (e) { setUrl(e.target.value) }}
              placeholder="Pega el link de YouTube"
              className="w-full sm:flex-1 h-9 rounded-lg px-3 border outline-none text-sm min-w-0"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleSave}
              className="h-9 px-3 rounded-lg text-sm font-medium text-white w-full sm:w-auto shrink-0"
              style={{ background: 'var(--accent-magenta)' }}
            >
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
          <SimilarTrackSearch
            query={entry.song}
            onSelect={function (videoUrl, videoId) {
              setUrl(videoUrl)
              setQueueEntryVideo(entry.id, videoUrl).then(function () {
                setSaved(true)
                setTimeout(function () { setSaved(false) }, 1500)
              })
            }}
          />
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
