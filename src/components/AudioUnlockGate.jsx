import { useState } from 'react'

export default function AudioUnlockGate(props) {
  var unlockedState = useState(false)
  var unlocked = unlockedState[0]
  var setUnlocked = unlockedState[1]

  function handleUnlock() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)()
      var buffer = ctx.createBuffer(1, 1, 22050)
      var source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
    } catch (err) {}
    setUnlocked(true)
  }

  if (unlocked) return props.children

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-8">
      <button
        onClick={handleUnlock}
        className="flex flex-col items-center gap-4 rounded-3xl border-2 px-12 py-10"
        style={{ borderColor: '#F4D03F', background: 'rgba(139, 92, 246, 0.08)' }}
      >
        <span className="text-6xl">🔊</span>
        <span className="text-xl md:text-2xl font-extrabold text-white text-center">
          Toca para activar el sonido
        </span>
        <span className="text-sm text-neutral-400 text-center max-w-xs">
          Solo se hace una vez al preparar la pantalla. Despues, cada cancion se reproducira sola.
        </span>
      </button>
    </div>
  )
}
