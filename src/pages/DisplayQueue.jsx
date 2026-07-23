import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import ThemeToggle from '../components/ThemeToggle'
import QRCode from '../components/QRCode'

const waitBoxStyle = { background: 'var(--bg-card)', borderColor: 'var(--border)' }
const singerBoxStyle = { background: 'var(--bg-card)', borderColor: 'var(--accent-magenta)' }
const avatarBoxStyle = { background: 'var(--accent-magenta)' }

export default function DisplayQueue() {
      const { barName, sessionCode, queue, currentSinger } = useKaraokeSession()
      const registerUrl = typeof window !== 'undefined' ? window.location.origin + '/registro?bar=' + sessionCode : ''

  return (
          <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col" style={{ background: 'var(--bg-page)' }}>
                    <RetroEqualizer />

                    <header className="flex items-center justify-between relative z-10 mb-10">
                            <div className="px-4 py-1.5 -skew-x-6" style={avatarBoxStyle}>
                                      <span className="inline-block skew-x-6 text-sm font-medium text-white tracking-wide">
                                          {barName.toUpperCase()}
                                      </span>span>
                            </div>div>
                            <div className="flex items-center gap-4">
                                      <div className="text-right">
                                                  <p className="text-sm font-medium" style={{ color: 'var(--accent-yellow)' }}>
                                                                Escanea para cantar
                                                  </p>p>
                                                  <p className="text-xs" style={{ color: 'var(--accent-purple)' }}>
                                                                karaoke.cl/{sessionCode}
                                                  </p>p>
                                      </div>div>
                                      <QRCode url={registerUrl} size={80} />
                                      <ThemeToggle />
                            </div>div>
                    </header>header>
          
                <section className="relative z-10 text-center mb-10">
                        <p className="text-sm mb-3 tracking-[3px] uppercase" style={{ color: 'var(--accent-yellow)' }}>
                                  Cantando ahora
                        </p>p>
                
                    {currentSinger ? (
                        <div className="inline-flex items-center gap-5 rounded-2xl px-9 py-5 border-2" style={singerBoxStyle}>
                                    <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center text-3xl" style={avatarBoxStyle}>
                                        {currentSinger.avatar}
                                    </div>div>
                                    <div className="text-left">
                                                  <p className="text-2xl font-medium" style={{ color: 'var(--text-primary)' }}>
                                                      {currentSinger.name}
                                                  </p>p>
                                                  <p className="text-base mt-0.5" style={{ color: 'var(--accent-purple)' }}>
                                                      {currentSinger.song}
                                                  </p>p>
                                    </div>div>
                        </div>div>
                      ) : (
                        <div className="inline-block rounded-2xl px-9 py-6 border" style={waitBoxStyle}>
                                    <p style={{ color: 'var(--text-secondary)' }}>Esperando al próximo cantante</p>p>
                        </div>div>
                        )}
                </section>section>
          
                <section className="relative z-10 max-w-lg w-full mx-auto flex-1">
                        <p className="text-sm mb-3 tracking-[2px] uppercase text-center" style={{ color: 'var(--accent-yellow)' }}>
                                  Próximos en la fila
                        </p>p>
                        <div className="flex flex-col gap-2.5">
                            {queue.length === 0 && (
                          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                        La cola está vacía. Escanea el QR para anotarte.
                          </p>p>
                                  )}
                            {queue.map((entry, index) => (
                          <div key={entry.id} className="flex items-center gap-3.5 rounded-r-xl py-3 px-4 border-l-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-purple)' }}>
                                        <span className="w-6 text-sm font-medium" style={{ color: 'var(--accent-purple)' }}>
                                            {index + 1}
                                        </span>span>
                                        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-lg" style={avatarBoxStyle}>
                                            {entry.avatar}
                                        </div>div>
                                        <div className="flex-1">
                                                        <p className="text-base" style={{ color: 'var(--text-primary)' }}>
                                                            {entry.name}
                                                        </p>p>
                                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                            {entry.song}
                                                        </p>p>
                                        </div>div>
                          </div>div>
                        ))}
                        </div>div>
                </section>section>
          
                <footer className="relative z-10 text-center text-sm mt-8" style={{ color: 'var(--accent-purple)' }}>
                    {queue.length} {queue.length === 1 ? 'persona' : 'personas'} en cola esta noche
                </footer>footer>
          </div>div>
        )
}
</header>
