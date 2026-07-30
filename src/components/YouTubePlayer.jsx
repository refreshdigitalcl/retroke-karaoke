import { useEffect, useRef } from 'react'

var apiPromise = null
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise(function (resolve) {
    var tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    var firstScript = document.getElementsByTagName('script')[0]
    firstScript.parentNode.insertBefore(tag, firstScript)
    window.onYouTubeIframeAPIReady = function () {
      resolve(window.YT)
    }
  })
  return apiPromise
}

export function checkYoutubeEmbeddable(videoId) {
  return new Promise(function (resolve) {
    loadYouTubeApi().then(function (YT) {
      if (!YT) {
        resolve(true)
        return
      }
      var hiddenDiv = document.createElement('div')
      hiddenDiv.style.position = 'fixed'
      hiddenDiv.style.left = '-9999px'
      hiddenDiv.style.width = '200px'
      hiddenDiv.style.height = '150px'
      document.body.appendChild(hiddenDiv)

      var settled = false
      var testPlayer = null

      var timeoutId = setTimeout(function () {
        finish(true)
      }, 6000)

      function cleanup() {
        clearTimeout(timeoutId)
        if (testPlayer && testPlayer.destroy) testPlayer.destroy()
        if (hiddenDiv.parentNode) hiddenDiv.parentNode.removeChild(hiddenDiv)
      }

      function finish(result) {
        if (settled) return
        settled = true
        cleanup()
        resolve(result)
      }

      testPlayer = new YT.Player(hiddenDiv, {
        videoId: videoId,
        playerVars: { autoplay: 1, controls: 0, cc_load_policy: 0 },
        events: {
          onReady: function (e) {
            try {
              e.target.mute()
              e.target.playVideo()
            } catch (err) {}
          },
          onStateChange: function (e) {
            if (e.data === 1 || e.data === 3 || e.data === 2) {
              finish(true)
            }
          },
          onError: function (e) {
            var code = e.data
            var blocked = code === 101 || code === 150 || code === 100 || code === 2
            finish(!blocked)
          }
        }
      })
    })
  })
}

export default function YouTubePlayer(props) {
  var videoId = props.videoId
  var shouldPlay = props.shouldPlay
  var onError = props.onError
  var onStateChange = props.onStateChange

  var containerRef = useRef(null)
  var playerRef = useRef(null)
  var mountedRef = useRef(true)
  var shouldPlayRef = useRef(shouldPlay)
  var playAttemptedRef = useRef(false)

  shouldPlayRef.current = shouldPlay

  function attemptAutoplay() {
    if (!playerRef.current || !playerRef.current.playVideo) return
    playAttemptedRef.current = true
    try {
      playerRef.current.mute()
    } catch (e) {}
    playerRef.current.playVideo()
    setTimeout(function () {
      if (!mountedRef.current || !playerRef.current || !playerRef.current.unMute) return
      try {
        playerRef.current.unMute()
      } catch (e) {}
    }, 300)
    // Red de seguridad: si a los 1.2s el video no quedo realmente
    // reproduciendose (por una carrera con la carga del reproductor
    // en TVs sin cache), se reintenta una vez mas.
    setTimeout(function () {
      if (!mountedRef.current || !playerRef.current || !playerRef.current.getPlayerState) return
      try {
        var state = playerRef.current.getPlayerState()
        if (state !== 1 && state !== 3 && shouldPlayRef.current) {
          playerRef.current.mute()
          playerRef.current.playVideo()
          setTimeout(function () {
            if (mountedRef.current && playerRef.current && playerRef.current.unMute) {
              try { playerRef.current.unMute() } catch (e) {}
            }
          }, 300)
        }
      } catch (e) {}
    }, 1200)
  }

  useEffect(function () {
    mountedRef.current = true
    playAttemptedRef.current = false

    loadYouTubeApi().then(function (YT) {
      if (!YT || !mountedRef.current || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, playsinline: 1, cc_load_policy: 0, iv_load_policy: 3 },
        events: {
          onReady: function () {
            if (shouldPlayRef.current && !playAttemptedRef.current) {
              attemptAutoplay()
            }
          },
          onError: function (e) {
            if (onError) onError(e.data)
          },
          onStateChange: function (e) {
            if (onStateChange) onStateChange(e.data)
          }
        }
      })
    })

    return function () {
      mountedRef.current = false
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
      playerRef.current = null
    }
  }, [videoId])

  useEffect(function () {
    if (!playerRef.current || !playerRef.current.playVideo) return
    if (shouldPlay && !playAttemptedRef.current) {
      attemptAutoplay()
    }
  }, [shouldPlay])

  return <div ref={containerRef} className="w-full h-full" />
}
