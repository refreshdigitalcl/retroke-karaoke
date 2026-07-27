import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession, parseYoutubeId } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'
import { startMicSender } from '../lib/webrtcMic'

const AVATARS = ['🔥', '🦄', '👽', '🐸', '🎤', '🐙', '⭐', '👑', '🍄', '🌊', '🎸', '🦋']

function resizeToSquareJpeg(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        var size = 320
        var canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        var ctx = canvas.getContext('2d')
        var side = Math.min(img.width, img.height)
        var sx = (img.width - side) / 2
        var sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function YourTurnScreen(props) {
  var name = props.name
  var song = props.song
  var sessionId = props.sessionId
  var entryId = props.entryId

  var micState = useState('idle')
  var micStatus = micState[0]
  var setMicStatus = micState[1]

  var levelState = useState(0)
  var level = levelState[0]
  var setLevel = levelState[1]

  var errorState = useState('')
  var micError = errorState[0]
  var setMicError = errorState[1]

  var connState = useState('idle')
  var connStatus = connState[0]
  var setConnStatus = connState[1]

  var streamRef = useRef(null)
  var audioCtxRef = useRef(null)
  var rafRef = useRef(null)
  var peakSeenRef = useRef(false)
  var senderRef = useRef(null)

  useEffect(function () {
    return function () {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (senderRef.current) senderRef.current.close()
      if (streamRef.current) streamRef.current.getTracks().forEach(function (t) { t.stop() })
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  function handleActivateMic() {
    setMicError('')
    setMicStatus('requesting')

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported')
      return
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        streamRef.current = stream
        setMicStatus('testing')
        peakSeenRef.current = false

        var AudioContextClass = window.AudioContext || window.webkitAudioContext
        var audioCtx = new AudioContextClass()
        audioCtxRef.current = audioCtx
        var source = audioCtx.createMediaStreamSource(stream)
        var analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        var data = new Uint8Array(analyser.frequencyBinCount)

        function tick() {
          analyser.getByteTimeDomainData(data)
          var sum = 0
          for (var i = 0; i < data.length; i++) {
            var v = (data[i] - 128) / 128
            sum += v * v
          }
          var rms = Math.sqrt(sum / data.length)
          var pct = Math.min(100, Math.round(rms * 350))
          setLevel(pct)
          if (pct > 12) peakSeenRef.current = true
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(function (err) {
        if (err && err.name === 'NotAllowedError') {
          setMicStatus('denied')
        } else if (err && err.name === 'NotFoundError') {
          setMicStatus('no-device')
        } else {
          setMicStatus('error')
          setMicError(err ? err.message : '')
        }
      })
  }

  function handleContinue() {
    setMicStatus('ready')
    if (sessionId && entryId && streamRef.current) {
      senderRef.current = startMicSender(sessionId, entryId, streamRef.current, function (state) {
        setConnStatus(state)
      })
    }
  }

  var hasSignal = peakSeenRef.current

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div
        className="max-w-sm w-full rounded-3xl border-2 p-8 text-center your-turn-pulse"
        style={{ background: 'var(--bg-card)', borderColor: '#F4D03F', boxShadow: '0 0 40px -8px rgba(244,208,63,0.6)' }}
      >
        <p className="text-6xl mb-3">🎤</p>
        <p className="text-2xl font-extrabold mb-1" style={{ color: '#F4D03F' }}>
          ¡ES TU TURNO!
        </p>
        <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{name}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{song}</p>

        {micStatus === 'idle' && (
          <>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              🎙️ Prepara tu micrófono
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              ACTIVAR MICRÓFONO
            </button>
          </>
        )}

        {micStatus === 'requesting' && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Solicitando permiso del micrófono...
          </p>
        )}

        {micStatus === 'denied' && (
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-magenta)' }}>
              🎤 Para usar Retroke Home Mic debes permitir el acceso al micrófono.
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Revisa el ícono de candado o el menú del navegador junto a la barra de direcciones, activa el permiso de micrófono para este sitio, y vuelve a intentar.
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: 'var(--accent-purple)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {micStatus === 'no-device' && (
          <p className="text-sm" style={{ color: 'var(--accent-magenta)' }}>
            No encontramos un micrófono en este dispositivo. Prueba con otro celular.
          </p>
        )}

        {micStatus === 'unsupported' && (
          <p className="text-sm" style={{ color: 'var(--accent-magenta)' }}>
            Tu navegador no permite usar el micrófono aquí. Prueba abriendo Retroke en Chrome o Safari actualizado.
          </p>
        )}

        {micStatus === 'error' && (
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--accent-magenta)' }}>
              No pudimos activar el micrófono{micError ? ': ' + micError : '.'}
            </p>
            <button
              onClick={handleActivateMic}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: 'var(--accent-purple)' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {micStatus === 'testing' && (
          <div>
            <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
              Di algo para probar tu micrófono
            </p>
            <div className="h-4 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-card-alt)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: level + '%',
                  background: level > 60 ? '#E9544A' : level > 12 ? '#7ED957' : '#F4D03F',
                  transition: 'width 0.08s linear'
                }}
              />
            </div>
            <p className="text-xs mb-4" style={{ color: hasSignal ? '#7ED957' : 'var(--text-muted)' }}>
              {hasSignal ? '🟢 Micrófono funcionando' : '🟡 No detectamos suficiente audio. Acércate y habla.'}
            </p>
            <button
              onClick={handleContinue}
              className="w-full h-14 rounded-2xl font-bold text-white text-lg"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              CONTINUAR
            </button>
          </div>
        )}

        {micStatus === 'ready' && (
          <div>
            <p className="text-4xl mb-3">{connStatus === 'connected' ? '📡' : '🎧'}</p>
            <p className="text-sm font-semibold mb-2" style={{ color: '#7ED957' }}>
              Micrófono listo
            </p>
            {connStatus === 'connected' ? (
              <p className="text-xs font-semibold" style={{ color: '#7ED957' }}>
                🔴 En vivo — tu voz está sonando en la pantalla principal
              </p>
            ) : connStatus === 'connecting' || connStatus === 'idle' ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Conectando con la pantalla principal...
              </p>
            ) : (
              <p className="text-xs" style={{ color: 'var(--accent-magenta)' }}>
                No se pudo conectar con la pantalla principal. Canta igual frente a ella, tu presentación sigue en curso 🎉
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .your-turn-pulse { animation: yourTurnPulse 1.6s ease-in-out infinite; }
        @keyframes yourTurnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

export default function RegisterForm() {
  var session = useKaraokeSession()
  var barName = session.barName
  var queue = session.queue
  var addToQueue = session.addToQueue
  var hasActiveSession = session.hasActiveSession
  var barLoading = session.barLoading
  var loadTimedOut = session.loadTimedOut
  var retryLoad = session.retryLoad
  var spaceParam = session.spaceParam
  var workspacePlan = session.workspacePlan
  var urlAttempts = session.urlAttempts
  var workspaceType = session.workspaceType
  var currentSinger = session.currentSinger
  var sendPresenceHeartbeat = session.sendPresenceHeartbeat

  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]

  var avatarState = useState(AVATARS[0])
  var avatar = avatarState[0]
  var setAvatar = avatarState[1]

  var songState = useState('')
  var song = songState[0]
  var setSong = songState[1]

  var youtubeState = useState('')
  var youtubeUrl = youtubeState[0]
  var setYoutubeUrl = youtubeState[1]

  var photoState = useState('')
  var photo = photoState[0]
  var setPhoto = photoState[1]

  var loadingPhotoState = useState(false)
  var loadingPhoto = loadingPhotoState[0]
  var setLoadingPhoto = loadingPhotoState[1]

  var submittedState = useState(false)
  var submitted = submittedState[0]
  var setSubmitted = submittedState[1]

  var myEntryIdState = useState(null)
  var myEntryId = myEntryIdState[0]
  var setMyEntryId = myEntryIdState[1]

  var optimisticPositionState = useState(null)
  var optimisticPosition = optimisticPositionState[0]
  var setOptimisticPosition = optimisticPositionState[1]

  var fileInputRef = useRef(null)

  function handlePhotoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setLoadingPhoto(true)
    resizeToSquareJpeg(file)
      .then(function (dataUrl) {
        setPhoto(dataUrl)
        setLoadingPhoto(false)
      })
      .catch(function () {
        setLoadingPhoto(false)
      })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !song.trim()) return
    setOptimisticPosition(queue.length + 1)
    addToQueue({
      name: name.trim(),
      avatar: avatar,
      song: song.trim(),
      youtubeUrl: youtubeUrl.trim(),
      videoUrl: youtubeUrl.trim(),
      photo: photo
    }).then(function (row) {
      if (row) setMyEntryId(row.id)
    })
    setSubmitted(true)
  }

  var realIndex = myEntryId ? queue.findIndex(function (q) { return q.id === myEntryId }) : -1
  var position = realIndex !== -1 ? realIndex + 1 : (optimisticPosition || queue.length + 1)

  var isHome = workspaceType === 'HOME'
  var itsMyTurn = isHome && myEntryId && currentSinger && currentSinger.id === myEntryId

  useEffect(function () {
    if (!isHome || !myEntryId) return
    sendPresenceHeartbeat(myEntryId)
    var intervalId = setInterval(function () {
      sendPresenceHeartbeat(myEntryId)
    }, 15000)
    return function () { clearInterval(intervalId) }
  }, [isHome, myEntryId, sendPresenceHeartbeat])

  if (loadTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Conexion lenta
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Esta tardando mas de lo normal. Revisa tu conexion e intenta de nuevo.
          </p>
          <button
            onClick={retryLoad}
            className="h-11 px-6 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-magenta)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (barLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!hasActiveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {barName || 'Este bar'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No hay una sesion de karaoke activa en este momento. Vuelve a intentarlo cuando empiece la noche.
          </p>
        </div>
      </div>
    )
  }

  if (itsMyTurn) {
    return <YourTurnScreen name={name} song={song} sessionId={session.sessionId} entryId={myEntryId} />
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl overflow-hidden"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : avatar}
          </div>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Ya estas en la cola, {name}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{song}</p>
          <p className="text-sm mt-4" style={{ color: 'var(--accent-yellow)' }}>
            Posicion {position} en la cola
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg-page)' }}>
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-3xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Anotate para cantar</p>
          </div>
          <ThemeToggle />
        </div>

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tu nombre</label>
        <input
          type="text"
          value={name}
          onChange={function (e) { setName(e.target.value) }}
          placeholder="Como quieres que te vean"
          required
          className="w-full mb-4 h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>
          Toma una selfie (opcional)
        </label>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl shrink-0 border-2"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--accent-magenta)' }}
          >
            {photo ? <img src={photo} alt="Selfie" className="w-full h-full object-cover" /> : avatar}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              onClick={function () { fileInputRef.current && fileInputRef.current.click() }}
              className="h-9 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
            >
              {loadingPhoto ? 'Procesando...' : photo ? 'Cambiar foto' : 'Tomar selfie'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={function () { setPhoto('') }}
                className="h-8 rounded-lg text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Quitar foto y usar avatar
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>
          {photo ? 'Avatar de respaldo' : 'Elige tu avatar'}
        </label>
        <div className="grid grid-cols-6 gap-2 mb-4">
          {AVATARS.map(function (a) {
            return (
              <button
                type="button"
                key={a}
                onClick={function () { setAvatar(a) }}
                className="aspect-square rounded-lg flex items-center justify-center text-xl border-2 transition-colors"
                style={{
                  background: 'var(--bg-card-alt)',
                  borderColor: avatar === a ? 'var(--accent-magenta)' : 'transparent'
                }}
              >
                {a}
              </button>
            )
          })}
        </div>

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Nombre de la cancion
        </label>
        <input
          type="text"
          value={song}
          onChange={function (e) { setSong(e.target.value) }}
          placeholder="Ej: Bohemian Rhapsody"
          required
          className="w-full mb-4 h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Link de tu video karaoke en YouTube (opcional)
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={function (e) { setYoutubeUrl(e.target.value) }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        {youtubeUrl.trim() && parseYoutubeId(youtubeUrl) && (
          <p className="text-xs mt-1.5 mb-5" style={{ color: 'var(--accent-green)' }}>
            ✓ Video reconocido, se usara para tu presentacion
          </p>
        )}
        {youtubeUrl.trim() && !parseYoutubeId(youtubeUrl) && (
          <p className="text-xs mt-1.5 mb-5" style={{ color: 'var(--accent-magenta)' }}>
            No reconocemos ese link, revisa que sea de YouTube
          </p>
        )}
        {!youtubeUrl.trim() && <div className="mb-5" />}

        <button
          type="submit"
          className="w-full h-11 rounded-lg font-medium text-white"
          style={{ background: 'var(--accent-magenta)' }}
        >
          Sumarme a la cola
        </button>

        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Estas en la posicion {position} de la cola
        </p>
      </form>
    </div>
  )
}
