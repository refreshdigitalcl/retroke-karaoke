import { useEffect, useMemo, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useVideoPlayer } from '../contexts/VideoPlayerContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'
import QRCode from '../components/QRCode'
import { fetchArtistFacts } from '../lib/artistFacts'
import { getSentiment } from '../lib/reactionEmojis'
import { isMemeReaction, getMemeUrl, getMemeSentiment } from '../lib/memeReactions'


var PHRASES = [
  'está cantando con todo.', 'está rompiendo el escenario.', 'está rockeando como nunca.',
  'está en su prime.', 'está dando cátedra.', 'está dejando todo en el escenario.',
  'está encendiendo la noche.', 'está haciendo vibrar el lugar.', 'está simplemente increíble.',
  'está en modo estrella.', 'está demostrando por qué es uno de los grandes.',
  'está entregando un show de otro nivel.', 'está haciendo historia esta noche.',
  'está conquistando al público.', 'está haciendo cantar a todos.', 'está prendiendo el ambiente.',
  'está dejando la energía arriba.', 'está demostrando todo su talento.',
  'está brillando sobre el escenario.', 'está en su mejor momento.', 'está entregando pura energía.',
  'está haciendo vibrar cada rincón.', 'está desatando la fiesta.', 'está dominando el escenario.',
  'está cantando como los grandes.', 'está regalando un show inolvidable.',
  'está haciendo explotar el ambiente.', 'está entregando una presentación espectacular.',
  'está cantando con el alma.', 'está en modo leyenda.', 'está brillando con luz propia.',
  'está haciendo vibrar la noche.', 'está haciendo disfrutar a todos.', 'está en llamas.',
  'está simplemente en otro nivel.'
]

function pickPhrase(seed) {
  var index = 0
  var i = 0
  while (i < seed.length) {
    index = index + seed.charCodeAt(i)
    i = i + 1
  }
  return PHRASES[index % PHRASES.length]
}

function useSongInfo(song, active) {
  var infoState = useState(null)
  var info = infoState[0]
  var setInfo = infoState[1]
  var factsState = useState([])
  var facts = factsState[0]
  var setFacts = factsState[1]
  var factIndexState = useState(0)
  var factIndex = factIndexState[0]
  var setFactIndex = factIndexState[1]
  var factVisibleState = useState(true)
  var factVisible = factVisibleState[0]
  var setFactVisible = factVisibleState[1]

  useEffect(function () {
    var cancelled = false
    setInfo(null)
    setFacts([])
    setFactIndex(0)

    fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1')
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          var r = data.results[0]
          var year = r.releaseDate ? r.releaseDate.slice(0, 4) : ''
          setInfo({ artist: r.artistName, year: year })
          fetchArtistFacts(r.artistName).then(function (f) {
            if (!cancelled) setFacts(f)
          })
        }
      })
      .catch(function () {})

    return function () { cancelled = true }
  }, [song])

  useEffect(function () {
    if (!active || facts.length < 1) return
    var cancelled = false
    setFactVisible(true)

    function scheduleNext(showing) {
      var delay = showing ? 10000 : 13000
      var id = setTimeout(function () {
        if (cancelled) return
        if (showing) {
          setFactVisible(false)
        } else {
          setFactIndex(function (prev) { return facts.length > 0 ? (prev + 1) % facts.length : 0 })
          setFactVisible(true)
        }
        scheduleNext(!showing)
      }, delay)
      return id
    }

    var timeoutId = scheduleNext(true)
    return function () {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [facts, active])

  return { info: info, fact: facts.length > 0 ? facts[factIndex] : '', factIndex: factIndex, barVisible: factVisible }
}

var ALT_VISIBLE_SECONDS = 9
var ALT_FADE_SECONDS = 3
var ALT_PAUSE_SECONDS = 15

function useAlternatingQrCycle(active) {
  var stateState = useState({ which: 'none', phase: 'hidden' })
  var state = stateState[0]
  var setState = stateState[1]

  useEffect(function () {
    if (!active) {
      setState({ which: 'none', phase: 'hidden' })
      return
    }
    var cancelled = false

    function run(which, phase) {
      if (cancelled) return
      setState({ which: which, phase: phase })

      var delay =
        phase === 'visible' ? ALT_VISIBLE_SECONDS * 1000 :
        phase === 'fading' ? ALT_FADE_SECONDS * 1000 :
        ALT_PAUSE_SECONDS * 1000

      var next
      if (which === 'reaction' && phase === 'visible') next = ['reaction', 'fading']
      else if (which === 'reaction' && phase === 'fading') next = ['register', 'visible']
      else if (which === 'register' && phase === 'visible') next = ['register', 'fading']
      else if (which === 'register' && phase === 'fading') next = ['none', 'pause']
      else next = ['reaction', 'visible']

      setTimeout(function () { run(next[0], next[1]) }, delay)
    }

    run('reaction', 'visible')

    return function () { cancelled = true }
  }, [active])

  return state
}

function useNeedlePosition(reactions) {
  var historyRef = useRef([])
  var seenIdsRef = useRef(new Set())
  var positionState = useState(50)
  var position = positionState[0]
  var setPosition = positionState[1]

  useEffect(function () {
    reactions.forEach(function (r) {
      if (!seenIdsRef.current.has(r.id)) {
        seenIdsRef.current.add(r.id)
        historyRef.current.push({ sentiment: isMemeReaction(r.emoji) ? getMemeSentiment(r.emoji) : getSentiment(r.emoji), time: Date.now() })
      }
    })
  }, [reactions])

  useEffect(function () {
    var interval = setInterval(function () {
      var now = Date.now()
      historyRef.current = historyRef.current.filter(function (h) { return now - h.time < 20000 })
      if (historyRef.current.length === 0) {
        setPosition(function (prev) { return prev + (50 - prev) * 0.08 })
        return
      }
      var sum = historyRef.current.reduce(function (acc, h) { return acc + h.sentiment }, 0)
      var avg = (sum / historyRef.current.length) * 100
      setPosition(function (prev) { return prev + (avg - prev) * 0.25 })
    }, 400)
    return function () { clearInterval(interval) }
  }, [])

  return position
}

export default function DisplayReactions() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var reactions = session.reactions
  var spaceParam = session.spaceParam
  var videoPlayer = useVideoPlayer()

  var phrase = useMemo(function () {
    if (!currentSinger) return ''
    return pickPhrase(String(currentSinger.id))
  }, [currentSinger])

  var hasVideo = !!(currentSinger && currentSinger.videoId)
  var songInfo = useSongInfo(currentSinger ? currentSinger.song : '', hasVideo)
  var qrCycle = useAlternatingQrCycle(hasVideo)
  var needlePosition = useNeedlePosition(reactions)

  var progressState = useState(0)
  var progress = progressState[0]
  var setProgress = progressState[1]

  useEffect(function () {
    if (!hasVideo) return
    videoPlayer.playVideoById(currentSinger.videoId)
    return function () {
      videoPlayer.stopVideo()
    }
  }, [hasVideo, currentSinger ? currentSinger.videoId : null])

  useEffect(function () {
    if (!hasVideo) return
    var interval = setInterval(function () {
      var duration = videoPlayer.getDuration()
      var current = videoPlayer.getCurrentTime()
      if (duration > 0) {
        setProgress(Math.min(100, (current / duration) * 100))
      }
    }, 500)
    return function () { clearInterval(interval) }
  }, [hasVideo])

  if (!currentSinger) return null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var reactUrl = origin + '/reaccionar?' + spaceParam
  var registerUrl = origin + '/registro?' + spaceParam

  var floaters = []
  var i = 0
  while (i < reactions.length) {
    var r = reactions[i]
    var memeUrl = isMemeReaction(r.emoji) ? getMemeUrl(r.emoji) : null
    floaters.push(
      memeUrl ? (
        <img
          key={r.id}
          src={memeUrl}
          alt=""
          className="floating-meme absolute rounded-xl object-cover border-2 border-white/20"
          style={{
            left: (25 + Math.random() * 45) + '%',
            bottom: hasVideo ? '115px' : '48%',
            width: '150px',
            height: '150px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.5)'
          }}
        />
      ) : (
        <span
          key={r.id}
          className="floating-emoji absolute text-6xl"
          style={{ left: (30 + Math.random() * 40) + '%', bottom: hasVideo ? '110px' : '50%' }}
        >
          {r.emoji}
        </span>
      )
    )
    i = i + 1
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: hasVideo ? 'transparent' : '#000' }}>
      {!hasVideo && (
        <div className="px-8 py-10">
          <RetroEqualizer />
          <FloatingDecor />
        </div>
      )}
      {!hasVideo && <FallingParty />}

      <div className="absolute inset-0 pointer-events-none z-20">{floaters}</div>

      {hasVideo ? (
        <div className="relative w-full h-screen">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-3 h-[55vh]">
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <div
                className="absolute bottom-0 left-0 w-full rounded-full progress-fill"
                style={{
                  height: progress + '%',
                  background: 'linear-gradient(0deg, #E91E8C, #8B5CF6, #F4D03F)',
                  boxShadow: '0 0 10px 2px rgba(233, 30, 140, 0.6)'
                }}
              />
            </div>
            <div
              className="absolute needle-arrow needle-pulse"
              style={{ bottom: 'calc(' + progress + '% - 11px)', right: '100%', marginRight: '6px' }}
            >
              <svg width="34" height="22" viewBox="0 0 34 22">
                <polygon
                  points="34,11 14,0 14,7 0,7 0,15 14,15 14,22"
                  fill="#F4D03F"
                  stroke="#E91E8C"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(244, 208, 63, 0.95))' }}
                />
              </svg>
            </div>
          </div>

          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-3 h-[55vh]"
          >
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(0deg, #E9544A 0%, #F4A93F 50%, #7ED957 100%)',
                border: '1px solid rgba(255,255,255,0.25)'
              }}
            />
            <div
              className="absolute needle-arrow needle-pulse"
              style={{ bottom: 'calc(' + needlePosition + '% - 11px)', left: '100%', marginLeft: '6px' }}
            >
              <svg width="34" height="22" viewBox="0 0 34 22">
                <polygon
                  points="0,11 20,0 20,7 34,7 34,15 20,15 20,22"
                  fill="#fff"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.95))' }}
                />
              </svg>
            </div>
          </div>

          {songInfo.barVisible && (
            <div key={songInfo.factIndex} className="info-bar-toggle absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-[52rem]">
              <div className="flex items-center gap-5 rounded-2xl border border-purple-500/60 bg-neutral-950/35 backdrop-blur-sm px-7 py-5 min-h-[100px]">
                <div
                  className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-2xl bg-pink-600 shrink-0"
                  style={{ boxShadow: '0 0 16px 4px rgba(233, 30, 140, 0.55)' }}
                >
                  {currentSinger.photo ? (
                    <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
                  ) : (
                    currentSinger.avatar
                  )}
                </div>
                <div className="shrink-0">
                  <p className="text-lg font-bold text-white leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {currentSinger.name}
                  </p>
                  <p className="text-sm text-yellow-400 leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {songInfo.info ? songInfo.info.artist : currentSinger.song}
                    {songInfo.info && songInfo.info.year ? ' · ' + songInfo.info.year : ''}
                  </p>
                </div>
                {songInfo.fact && (
                  <>
                    <div className="w-px self-stretch bg-neutral-500/40 shrink-0" />
                    <p
                      className="fact-clamp text-lg text-neutral-100 leading-snug flex-1"
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                    >
                      {songInfo.fact}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {qrCycle.which !== 'none' && (
            <div
              className={
                'absolute bottom-5 z-20 flex flex-col items-center ' +
                (qrCycle.which === 'reaction' ? 'left-4' : 'right-4') + ' ' +
                (qrCycle.phase === 'visible' ? 'qr-glitch-in' : 'qr-fade-out')
              }
            >
              {qrCycle.which === 'reaction' ? (
                <>
                  <p
                    className="text-sm font-bold text-yellow-400 mb-2 text-center leading-tight w-[130px]"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                  >
                    ¡Reacciona a esta presentacion!
                  </p>
                  <div className="rounded-2xl border-2 border-yellow-400 bg-neutral-950/90 p-3">
                    <QRCode url={reactUrl} size={120} />
                  </div>
                </>
              ) : (
                <>
                  <p
                    className="text-sm font-bold text-purple-300 mb-2 text-center leading-tight w-[130px]"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                  >
                    ¿Aun no te anotas? ¡Escanea aqui!
                  </p>
                  <div className="rounded-2xl border-2 border-purple-400 bg-neutral-950/90 p-3" style={{ boxShadow: '0 0 24px 4px rgba(139, 92, 246, 0.35)' }}>
                    <QRCode url={registerUrl} size={120} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8">
          <span className="text-xs px-3 py-1 rounded-full text-white bg-pink-600 mb-8">
            En vivo
          </span>

          <div
            className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-purple-500 flex items-center justify-center text-6xl bg-pink-600 spin-vinyl mb-6"
            style={{ boxShadow: '0 0 30px 6px rgba(139, 92, 246, 0.55)' }}
          >
            {currentSinger.photo ? (
              <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
            ) : (
              currentSinger.avatar
            )}
          </div>

          <p className="text-2xl md:text-3xl font-extrabold text-white text-center max-w-md">
            {currentSinger.name} <span className="text-purple-400">{phrase}</span>
          </p>
          <p className="text-lg md:text-xl text-yellow-400 mt-1 mb-6">
            {currentSinger.song}
          </p>

          <div className="flex flex-col items-center gap-1.5">
            <QRCode url={reactUrl} size={130} />
            <p className="text-sm text-purple-300">Escanea para reaccionar</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          from { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          to { transform: translateY(-70vh) scale(1.5) rotate(12deg); opacity: 0; }
        }
        .floating-emoji { animation: floatUp 2.2s ease-out forwards; }
        .floating-meme { animation: floatUpMeme 2.6s ease-out forwards; }
        @keyframes floatUpMeme {
          0% { transform: translateY(0) scale(0.85); opacity: 0; }
          12% { transform: translateY(-8vh) scale(1); opacity: 1; }
          75% { transform: translateY(-55vh) scale(1); opacity: 1; }
          100% { transform: translateY(-70vh) scale(1.05); opacity: 0; }
        }
        .spin-vinyl { animation: spinVinyl 7s linear infinite; }
        @keyframes spinVinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .progress-fill { transition: height 0.5s linear; }
        .needle-arrow { transition: bottom 0.4s ease-out; }
        .needle-pulse { animation: needlePulse 1.6s ease-in-out infinite; }
        @keyframes needlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        .fact-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fact-glitch { animation: factGlitch 0.6s ease-out; }
        @keyframes factGlitch {
          0% { opacity: 0; transform: translate(-4px, 0); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
          30% { opacity: 1; transform: translate(2px, 0); text-shadow: -2px 0 #8B5CF6, 2px 0 #F4D03F; }
          60% { transform: translate(0,0); text-shadow: none; }
          100% { opacity: 1; }
        }
        .qr-glitch-in { animation: qrGlitchIn 0.6s ease-out; }
        @keyframes qrGlitchIn {
          0% { opacity: 0; transform: translate(-8px, 4px); clip-path: inset(0 40% 0 0); }
          30% { opacity: 1; transform: translate(6px, -2px); clip-path: inset(0 0 0 30%); }
          55% { transform: translate(-3px, 1px); clip-path: inset(0 20% 0 0); }
          100% { opacity: 1; transform: translate(0,0); clip-path: inset(0 0 0 0); }
        }
        .qr-fade-out { animation: qrFadeOut 3s ease-in-out forwards; }
        @keyframes qrFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
