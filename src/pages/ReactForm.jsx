import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'

export default function ReactForm() {
    const { currentSinger, screenMode, addReaction, reactionEmojis } = useKaraokeSession()

    if (screenMode !== 'reactions' || !currentSinger) {
          return (
                  <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Nadie está cantando ahora. Vuelve cuando empiece la próxima canción.
                    </p>
                  </div>
                )
        }

    return (
          <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-sm w-full rounded-3xl border p-7 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex justify-end mb-2">
                <ThemeToggle />
              </div>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {currentSinger.name} está cantando
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--accent-purple)' }}>
                {currentSinger.song}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {reactionEmojis.map((emoji) => (
                              <button key={emoji} onClick={() => addReaction(emoji)} className="aspect-square rounded-full flex items-center justify-center text-2xl border-2 active:scale-95 transition-transform" style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--accent-magenta)' }}>
                                {emoji}
                              </button>
                            ))}
              </div>

              <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Tus reacciones aparecen en la pantalla del bar
              </p>
            </div>
          </div>
        )
  }
