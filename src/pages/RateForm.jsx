import { useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import ThemeToggle from '../components/ThemeToggle'

const SCORES = [5, 6, 7, 8, 9, 10]

export default function RateForm() {
    const { currentSinger, submitRating, screenMode } = useKaraokeSession()
    const [selected, setSelected] = useState(null)
    const [sent, setSent] = useState(false)

    if (screenMode !== 'rating' || !currentSinger) {
          return (
                  <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Aún no hay votación abierta. Vuelve cuando termine la canción.
                    </p>
                  </div>
                )
        }

    function handleSend() {
          if (!selected) return
          submitRating(selected)
          setSent(true)
        }

    return (
          <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-sm w-full rounded-3xl border p-7 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex justify-end mb-2">
                <ThemeToggle />
              </div>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                ¿Cómo estuvo {currentSinger.name}?
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {currentSinger.song}
              </p>

              {sent ? (
                          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>
                            Nota enviada, gracias por votar
                          </p>
                        ) : (
                          <>
                            <div className="grid grid-cols-6 gap-1.5 mb-5">
                              {SCORES.map((score) => (
                                                <button key={score} onClick={() => setSelected(score)} className="aspect-square rounded-lg text-base font-medium" style={{ background: selected === score ? 'var(--accent-magenta)' : 'var(--bg-card-alt)', color: selected === score ? '#fff' : 'var(--text-primary)' }}>
                                                  {score}
                                                </button>
                                              ))}
                            </div>
                            <button onClick={handleSend} disabled={!selected} className="w-full h-11 rounded-lg font-medium text-white disabled:opacity-40" style={{ background: 'var(--accent-magenta)' }}>
                              Enviar nota
                            </button>
                          </>
                        )}
            </div>
          </div>
        )
  }
