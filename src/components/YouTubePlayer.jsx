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
        if (settled) return
        settled = true
        cleanup()
        resolve(true)
      }, 5000)

      function cleanup() {
        clearTimeout(timeoutId)
        if (testPlayer && testPlayer.destroy) testPlayer.destroy()
        if (hiddenDiv.parentNode) hiddenDiv.parentNode.removeChild(hiddenDiv)
      }

      testPlayer = new YT.Player(hiddenDiv, {
        videoId: videoId,
        playerVars: { autoplay: 0 },
        events: {
          onReady: function () {
            if (settled) return
            settled = true
            cleanup()
            resolve(true)
          },
          onError: function (e) {
            if (settled) return
            settled = true
            cleanup()
            var code = e.data
            var blocked = code === 101 || code === 150 || code === 100 || code === 2
            resolve(!blocked)
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

  useEffect(function () {
    mountedRef.current = true

    loadYouTubeApi().then(function (YT) {
      if (!YT || !mountedRef.current || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, playsinline: 1 },
        events: {
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
    if (shouldPlay) {
      playerRef.current.playVideo()
    }
  }, [shouldPlay])

  return <div ref={containerRef} className="w-full h-full" />
}
