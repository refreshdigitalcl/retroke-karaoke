import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'

export default function DisplayReactions() {
  const { currentSinger, reactions } = useKaraokeSession()

    if (!currentSinger) return null

      return (
          <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col items-center justify-center" style={{ background: 'var(--bg-page)' }}>
                <RetroEqualizer />

                      <div className="absolute inset-0 pointer-events-none z-10">
                              {reactions.map((r) => (
                                        <span key={r.id} className="floating-emoji absolute text-3xl" style={{ left: `${20 + Math.random() * 60}%`, bottom: '80px' }}>
                                                    {r.emoji}
                                                              </span>
                                                                      ))}
                                                                            </div>

                                                                                  <div className="relative z-10 text-center mb-4">
                                                                                          <span className="inline-block text-xs px-3 py-1 rounded-full text-white mb-6" style={{ background: 'var(--accent-magenta)' }}>
                                                                                                    En vivo
                                                                                                            </span>
                                                                                                                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: 'var(--accent-magenta)' }}>
                                                                                                                              {currentSinger.avatar}
                                                                                                                                      </div>
                                                                                                                                              <p className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                                                                                        {currentSinger.name} está cantando
                                                                                                                                                                </p>
                                                                                                                                                                        <p className="text-base mt-1" style={{ color: 'var(--accent-yellow)' }}>
                                                                                                                                                                                  {currentSinger.song}
                                                                                                                                                                                          </p>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                
                                                                                                                                                                                                      <p className="relative z-10 text-sm mt-8 mb-3 tracking-wide uppercase" style={{ color: 'var(--accent-purple)' }}>
                                                                                                                                                                                                              Reacciona desde tu celular
                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                    
                                                                                                                                                                                                                          <style>{`
                                                                                                                                                                                                                                  @keyframes floatUp {
                                                                                                                                                                                                                                            from { transform: translateY(0) scale(1); opacity: 1; }
                                                                                                                                                                                                                                                      to { transform: translateY(-260px) scale(1.4); opacity: 0; }
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                      .floating-emoji {
                                                                                                                                                                                                                                                                                animation: floatUp 1.8s ease-out forwards;
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                              `}</style>
                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                    
