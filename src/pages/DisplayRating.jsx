import { useMemo } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'

export default function DisplayRating() {
  const { currentSinger, ratings } = useKaraokeSession()

    const songRatings = useMemo(
        () => ratings.filter((r) => r.singerId === currentSinger?.id),
            [ratings, currentSinger]
              )

                const average = useMemo(() => {
                    if (songRatings.length === 0) return null
                        const sum = songRatings.reduce((acc, r) => acc + r.score, 0)
                            return (sum / songRatings.length).toFixed(1)
                              }, [songRatings])

                                if (!currentSinger) return null

                                  return (
                                      <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                                            <RetroEqualizer />

                                                  <div className="relative z-10 text-center">
                                                          <p className="text-sm mb-3 tracking-[3px] uppercase" style={{ color: 'var(--accent-yellow)' }}>
                                                                    Califica la presentación
                                                                            </p>
                                                                                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: 'var(--accent-magenta)' }}>
                                                                                              {currentSinger.avatar}
                                                                                                      </div>
                                                                                                              <p className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                                                        {currentSinger.name}
                                                                                                                                </p>
                                                                                                                                        <p className="text-base mt-1 mb-8" style={{ color: 'var(--accent-purple)' }}>
                                                                                                                                                  {currentSinger.song}
                                                                                                                                                          </p>
                                                                                                                                                          
                                                                                                                                                                  <div className="inline-block rounded-2xl px-12 py-8 border-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-magenta)' }}>
                                                                                                                                                                            {average ? (
                                                                                                                                                                                        <>
                                                                                                                                                                                                      <p className="text-6xl font-medium" style={{ color: 'var(--accent-yellow)' }}>
                                                                                                                                                                                                                      {average}
                                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                                                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                                                                                                                                                                                                                                                                  {songRatings.length} {songRatings.length === 1 ? 'voto' : 'votos'}
                                                                                                                                                                                                                                                                                </p>
                                                                                                                                                                                                                                                                                            </>
                                                                                                                                                                                                                                                                                                      ) : (
                                                                                                                                                                                                                                                                                                                  <p style={{ color: 'var(--text-secondary)' }}>Esperando votos del público</p>
                                                                                                                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                            <p className="text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
                                                                                                                                                                                                                                                                                                                                                      Vota desde tu celular escaneando el QR
                                                                                                                                                                                                                                                                                                                                                              </p>
                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                          
