import { useEffect, useState } from 'react'

export default function FullscreenButton() {
  var state = useState(false)
  var isFull = state[0]
  var setIsFull = state[1]

  useEffect(function () {
    function onChange() {
      setIsFull(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onChange)
    return function () {
      document.removeEventListener('fullscreenchange', onChange)
    }
  }, [])

  function toggleFullscreen() {
    var el = document.documentElement
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      }
    }
  }

  return (
    <button
      onClick={toggleFullscreen}
      aria-label="Pantalla completa"
      className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full flex items-center justify-center border-2 border-yellow-400 bg-neutral-900/80 hover:bg-neutral-800 transition-colors"
    >
      {!isFull && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4D03F" strokeWidth="2">
          <path
            d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {isFull && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4D03F" strokeWidth="2">
          <path
            d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
