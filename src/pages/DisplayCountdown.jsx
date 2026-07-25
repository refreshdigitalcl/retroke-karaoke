import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'

export default function DisplayCountdown() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var startPlaying = session.startPlaying

  var numberState = useState(8)
  var number = numberState[0]
  var setNumber = numberState[1]

  var firedRef = useRef(false)
  var startPlayingRef = useRef(startPlaying)

  useEffect(function () {
    startPlayingRef.current = startPlaying
  }, [startPlaying])

  useEffect(function () {
    if (!currentSinger) return
    firedRef.current = false

    var startedAt = Date.now()

    var interval = setInterval(function () {
      var elapsed = (Date.now() - startedAt) / 1000
      var remaining = Math.ceil(8 - elapsed)

      if (remaining <= 0) {
        setNumber(0)
        if (!firedRef.current) {
          firedRef.current = true
          startPlayingRef.current()
        }
        clearInterval(interval)
      } else {
        setNumber(remaining)
      }
    }, 150)

    return function () {
      clearInterval(interval)
    }
  }, [currentSinger ? currentSinger.id : null])

  if (!currentSinger) return null

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-black">
      <p className="text-lg md:text-2xl tracking-widest uppercase text-purple-400 mb-4">
        {currentSinger.name}
      </p>
      <p className="text-sm md:text-base text-neutral-400 mb-10">Preparate...</p>

      <div key={number} className="countdown-number text-[10rem] md:text-[16rem] font-extrabold leading-none text-pink-500">
        {number > 0 ? number : '🎤'}
      </div>

      <style>{`
        .countdown-number {
          animation: countdownPop 0.9s ease-out;
          text-shadow: 0 0 40px rgba(233, 30, 140, 0.7);
        }
        @keyframes countdownPop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
