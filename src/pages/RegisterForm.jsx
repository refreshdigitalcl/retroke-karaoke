import { useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'

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

export default function RegisterForm() {
  var session = useKaraokeSession()
  var barName = session.barName
  var queue = session.queue
  var addToQueue = session.addToQueue

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
    addToQueue({
      name: name.trim(),
      avatar: avatar,
      song: song.trim(),
      youtubeUrl: youtubeUrl.trim(),
      photo: photo
    })
    setSubmitted(true)
  }

  var position = queue.length + 1

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
          Link de YouTube (opcional)
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={function (e) { setYoutubeUrl(e.target.value) }}
          placeholder="https://youtube.com/..."
          className="w-full mb-5 h-11 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

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
