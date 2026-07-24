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
