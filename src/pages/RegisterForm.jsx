import { useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'

const AVATARS = ['🔥', '🦄', '👽', '🐸', '🎤', '🐙', '⭐', '👑', '🍄', '🌊', '🎸', '🦋']

export default function RegisterForm() {
    const { barName, queue, addToQueue } = useKaraokeSession()
    const [name, setName] = useState('')
    const [avatar, setAvatar] = useState(AVATARS[0])
    const [song, setSong] = useState('')
    const [youtubeUrl, setYoutubeUrl] = useState('')
    const [submitted, setSubmitted] = useState(false)

    function handleSubmit(e) {
          e.preventDefault()
          if (!name.trim() || !song.trim()) return
          addToQueue({ name: name.trim(), avatar, song: song.trim(), youtubeUrl: youtubeUrl.trim() })
          setSubmitted(true)
        }

    const position = queue.length + 1

    if (submitted) {
          return (
                  <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
                    <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'var(--accent-magenta)' }}>
                        {avatar}
                      </div>
                      <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Ya estás en la cola, {name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {song}
                      </p>
                      <p className="text-sm mt-4" style={{ color: 'var(--accent-yellow)' }}>
                        Posición {position} en la cola
                      </p>
                    </div>
                  </div>
                )
        }

    return (
          <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg-page)' }}>
            <form onSubmit={handleSubmit} className="max-w-sm w-full rounded-3xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {barName}
                  </p>
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    Anótate para cantar
                  </p>
                </div>
                <ThemeToggle />
              </div>

              <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Tu nombre
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quieres que te vean" required className="w-full mb-4 h-11 rounded-lg px-3 border outline-none" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />

              <label className="text-sm block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Elige tu avatar
              </label>
              <div className="grid grid-cols-6 gap-2 mb-4">
                {AVATARS.map((a) => (
                              <button type="button" key={a} onClick={() => setAvatar(a)} className="aspect-square rounded-lg flex items-center justify-center text-xl border-2 transition-colors" style={{ background: 'var(--bg-card-alt)', borderColor: avatar === a ? 'var(--accent-magenta)' : 'transparent' }}>
                                {a}
                              </button>
                            ))}
              </div>

              <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nombre de la canción
              </label>
              <input type="text" value={song} onChange={(e) => setSong(e.target.value)} placeholder="Ej: Bohemian Rhapsody" required className="w-full mb-4 h-11 rounded-lg px-3 border outline-none" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />

              <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Link de YouTube (opcional)
              </label>
              <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full mb-5 h-11 rounded-lg px-3 border outline-none" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />

              <button type="submit" className="w-full h-11 rounded-lg font-medium text-white" style={{ background: 'var(--accent-magenta)' }}>
                Sumarme a la cola
              </button>

              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Estás en la posición {position} de la cola
              </p>
            </form>
          </div>
        )
  }
