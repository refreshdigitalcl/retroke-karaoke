import { createContext, useContext, useRef, useState } from 'react'

const VideoPlayerContext = createContext(null)

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

export function VideoPlayerProvider(props) {
  var containerRef = useRef(null)
  var playerRef = useRef(null)
  var readyRef = useRef(false)

  var unlockedState = useState(false)
  var unlocked = unlockedState[0]
  var setUnlocked = unlockedState[1]

  var errorState = useState(null)
  var videoError = errorState[0]
  var setVideoError = errorState[1]

  function unlock() {
    loadYouTubeApi().then(function (YT) {
      if (!YT || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, {
        width: '100%',
        height: '100%',
        videoId: 'M7lc1UVf-VE',
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady: function (e) {
            readyRef.current = true
            try {
              e.target.mute()
              e.target.playVideo()
            } catch (err) {}
            setUnlocked(true)
          },
          onError: function () {}
        }
      })
    })
  }

  function playVideoById(videoId) {
    setVideoError(null)
    if (!playerRef.current || !readyRef.current || !videoId) return
    try {
      playerRef.current.unMute()
      playerRef.current.loadVideoById(videoId)
      playerRef.current.playVideo()
    } catch (err) {}
  }

  function stopVideo() {
    if (!playerRef.current || !readyRef.current) return
    try {
      playerRef.current.stopVideo()
    } catch (err) {}
  }

  function getCurrentTime() {
    if (!playerRef.current || !readyRef.current) return 0
    try {
      return playerRef.current.getCurrentTime() || 0
    } catch (err) {
      return 0
    }
  }

  function getDuration() {
    if (!playerRef.current || !readyRef.current) return 0
    try {
      return playerRef.current.getDuration() || 0
    } catch (err) {
      return 0
    }
  }

  var value = {
    unlocked: unlocked,
    unlock: unlock,
    playVideoById: playVideoById,
    stopVideo: stopVideo,
    getCurrentTime: getCurrentTime,
    getDuration: getDuration,
    containerRef: containerRef,
    videoError: videoError
  }

  return (
    <VideoPlayerContext.Provider value={value}>
      {props.children}
    </VideoPlayerContext.Provider>
  )
}

export function useVideoPlayer() {
  var ctx = useContext(VideoPlayerContext)
  if (!ctx) throw new Error('useVideoPlayer debe usarse dentro de VideoPlayerProvider')
  return ctx
}
