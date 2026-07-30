import { useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { MEME_REACTIONS } from '../lib/memeReactions'
import ThemeToggle from '../components/ThemeToggle'

export default function ReactForm() {
  const { currentSinger, screenMode, addReaction, reactionEmojis, hasFeature, workspaceType, workspacePlan } = useKaraokeSession()
  var memesEnabled = hasFeature('memes')
  var isHomeFree = workspaceType === 'HOME' && workspacePlan === 'FREE'
  var showMemesTab = memesEnabled || isHomeFree

  var floatersState = useState([])
  var floaters = floatersState[0]
  var setFloaters = floatersState[1]

  var pageState = useState(0)
  var page = pageState[0]
  var setPage = pageState[1]

  var touchStartX = useRef(null)

  if (screenMode !== 'reactions' || !currentSinger) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--bg-page)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Nadie está cantando ahora. Vuelve cuando empiece la próxima canción.
        </p>
      </div>
    )
  }

  function spawnFloater(content, isMeme) {
    var id = Date.now() + '-' + Math.random()
    setFloaters(function (prev) {
      return [...prev, { id: id, content: content, isMeme: isMeme, left: 20 + Math.random() * 60 }]
    })
    setTimeout(function () {
      setFloaters(function (prev) { return prev.filter(function (f) { return f.id !== id } ) })
    }, 1800)
  }

  var lastReactAtRef = useRef(0)
  var cooldownState = useState(false)
  var onCooldown = cooldownState[0]
  var setOnCooldown = cooldownState[1]

  var REACT_COOLDOWN_MS = 1200

  function triggerCooldown() {
    setOnCooldown(true)
    setTimeout(function () { setOnCooldown(false) }, REACT_COOLDOWN_MS)
  }

  function handleReact(emoji) {
    var now = Date.now()
    if (now - lastReactAtRef.current < REACT_COOLDOWN_MS) return
    lastReactAtRef.current = now
    triggerCooldown()
    addReaction(emoji)
    spawnFloater(emoji, false)
  }

  function handleReactMeme(memeId, url) {
    if (!memesEnabled) return
    var now = Date.now()
    if (now - lastReactAtRef.current < REACT_COOLDOWN_MS) return
    lastReactAtRef.current = now
    triggerCooldown()
    addReaction('meme:' + memeId)
    spawnFloater(url, true)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    var diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff < -40 && page === 0 && showMemesTab) setPage(1)
    if (diff > 40 && page === 1) setPage(0)
    touchStartX.current = null
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 bg-black"
    >
      <div className="absolute inset-0 pointer-events-none z-30">
        {floaters.map(function (f) {
          return f.isMeme ? (
            <img
              key={f.id}
              src={f.content}
              alt=""
              className="floating-own-emoji absolute rounded-lg object-cover"
              style={{ left: f.left + '%', bottom: '30%', width: '56px', height: '56px' }}
            />
          ) : (
            <span
              key={f.id}
              className="floating-own-emoji absolute text-4xl"
              style={{ left: f.left + '%', bottom: '30%' }}
            >
              {f.content}
            </span>
          )
        })}
      </div>

      <div
        className="relative z-10 max-w-sm w-full rounded-3xl border-2 border-purple-500 p-7 text-center"
        style={{ background: 'rgba(23, 23, 23, 0.9)' }}
      >
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>

        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-4xl bg-pink-600 mx-auto mb-4 border-4 border-purple-400 spin-vinyl"
          style={{ boxShadow: '0 0 26px 6px rgba(139, 92, 246, 0.6)' }}
        >
          {currentSinger.photo ? (
            <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
          ) : (
            currentSinger.avatar
          )}
        </div>

        <p className="text-lg font-bold text-white mb-1">
          {currentSinger.name} está cantando
        </p>
        <p className="text-sm mb-5 text-purple-300">
          {currentSinger.song}
        </p>

        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300"
            style={{ transform: 'translateX(-' + (page * 100) + '%)' }}
          >
            <div className="w-full shrink-0 grid grid-cols-5 gap-2.5 px-0.5">
              {reactionEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  disabled={onCooldown}
                  className="aspect-square rounded-full flex items-center justify-center text-xl border-2 active:scale-90 transition-transform disabled:opacity-30"
                  style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: '#E91E8C' }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {showMemesTab && (
              <div className="w-full shrink-0 relative">
                <div className="grid grid-cols-3 gap-2.5 px-0.5" style={{ filter: memesEnabled ? 'none' : 'blur(3px) brightness(0.5)', pointerEvents: memesEnabled ? 'auto' : 'none' }}>
                  {MEME_REACTIONS.map((meme) => (
                    <button
                      key={meme.id}
                      onClick={() => handleReactMeme(meme.id, meme.url)}
                      disabled={onCooldown}
                      className="aspect-square rounded-xl overflow-hidden border-2 active:scale-90 transition-transform disabled:opacity-30"
                      style={{ borderColor: '#F4D03F' }}
                    >
                      <img src={meme.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                {!memesEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 gap-1.5">
                    <span className="text-2xl">🔒</span>
                    <p className="text-xs font-bold text-white">Funcion PRO</p>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                      Adquiere el plan PRO o Premium para reaccionar con memes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-center mt-2 h-4" style={{ color: '#F4D03F', opacity: onCooldown ? 1 : 0, transition: 'opacity 0.2s' }}>
          Espera un segundo antes de reaccionar de nuevo
        </p>

        {showMemesTab && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={function () { setPage(0) }}
              className="text-xs px-3 py-1 rounded-full border"
              style={{
                borderColor: page === 0 ? '#E91E8C' : 'var(--border)',
                color: page === 0 ? '#E91E8C' : 'var(--text-muted)',
                background: page === 0 ? 'rgba(233,30,140,0.1)' : 'transparent'
              }}
            >
              😀 Emojis
            </button>
            <button
              onClick={function () { setPage(1) }}
              className="text-xs px-3 py-1 rounded-full border"
              style={{
                borderColor: page === 1 ? '#F4D03F' : 'var(--border)',
                color: page === 1 ? '#F4D03F' : 'var(--text-muted)',
                background: page === 1 ? 'rgba(244,208,63,0.1)' : 'transparent'
              }}
            >
              {memesEnabled ? '🖼️ Memes' : '🔒 Memes'}
            </button>
          </div>
        )}

        {showMemesTab && (
          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Desliza para ver mas opciones
          </p>
        )}

        <p className="text-xs mt-2 text-neutral-500">
          Tus reacciones aparecen en la pantalla del bar
        </p>
      </div>

      <style>{`
        .spin-vinyl {
          animation: spinVinyl 6s linear infinite;
        }
        @keyframes spinVinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .floating-own-emoji {
          animation: floatUpOwn 1.8s ease-out forwards;
        }
        @keyframes floatUpOwn {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-55vh) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
