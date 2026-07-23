import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import ThemeToggle from '../components/ThemeToggle'

function QueueRow(props) {
        var entry = props.entry
        var position = props.position
        return (
                  <div className="flex items-center gap-3.5 rounded-r-xl py-3 px-4 border-l-4 border-purple-500 bg-neutral-900">
                        <span className="w-6 text-sm font-medium text-purple-400">
                              {position}
                        </span>span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-pink-600">
                              {entry.avatar}
                        </div>div>
                        <div className="flex-1">
                                <p className="text-base text-white">
                                      {entry.name}
                                </p>p>
                                <p className="text-sm text-neutral-400">
                                      {entry.song}
                                </p>p>
                        </div>div>
                  </div>div>
                )
}

function QueueList(props) {
        var queue = props.queue
                var rows = []
                        var i = 0
                                while (i < queue.length) {
                                          rows.push(<QueueRow key={queue[i].id} entry={queue[i]} position={i + 1} />)
                                                    i = i + 1
                                }
        return <div className="flex flex-col gap-2.5">{rows}</div>div>
              }
              
              export default function DisplayQueue() {
                      var session = useKaraokeSession()
                              var barName = session.barName
                                      var sessionCode = session.sessionCode
                                              var queue = session.queue
                                                      var currentSinger = session.currentSinger
                                                            
                                                              var singerName = ''
                                                                      var singerSong = ''
                                                                              var singerAvatar = ''
                                                                                      if (currentSinger) {
                                                                                                singerName = currentSinger.name
                                                                                                          singerSong = currentSinger.song
                                                                                                                    singerAvatar = currentSinger.avatar
                                                                                            }
                    
                      return (
                                <div className="min-h-screen relative overflow-hidden px-8 py-10 flex flex-col bg-black">
                                      <RetroEqualizer />
                                      <header className="flex items-center justify-between relative z-10 mb-10">
                                              <div className="px-4 py-1.5 -skew-x-6 bg-pink-600">
                                                        <span className="inline-block skew-x-6 text-sm font-medium text-white tracking-wide">
                                                              {barName}
                                                        </span>span>
                                              </div>div>
                                              <div className="flex items-center gap-4">
                                                        <div className="text-sm text-purple-400">
                                                                    karaoke.cl/{sessionCode}
                                                        </div>div>
                                                        <ThemeToggle />
                                              </div>div>
                                      </header>header>
                                      <section className="relative z-10 text-center mb-10">
                                              <p className="text-sm mb-3 tracking-widest uppercase text-yellow-400">
                                                        Cantando ahora
                                              </p>p>
                                              <div className="inline-flex items-center gap-5 rounded-2xl px-9 py-5 border-2 border-pink-600 bg-neutral-900">
                                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-pink-600">
                                                              {singerAvatar}
                                                        </div>div>
                                                        <div className="text-left">
                                                                    <p className="text-2xl font-medium text-white">
                                                                          {singerName}
                                                                    </p>p>
                                                                    <p className="text-base mt-0.5 text-purple-400">
                                                                          {singerSong}
                                                                    </p>p>
                                                        </div>div>
                                              </div>div>
                                      </section>section>
                                      <section className="relative z-10 max-w-lg w-full mx-auto flex-1">
                                              <p className="text-sm mb-3 tracking-widest uppercase text-center text-yellow-400">
                                                        Próximos en la fila
                                              </p>p>
                                              <QueueList queue={queue} />
                                      </section>section>
                                      <footer className="relative z-10 text-center text-sm mt-8 text-purple-400">
                                            {queue.length} personas en cola esta noche
                                      </footer>footer>
                                </div>div>
                              )
                            }
                            </div>
