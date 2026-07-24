import { useEffect, useMemo, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import FallingParty from '../components/FallingParty'
import QRCode from '../components/QRCode'
import YouTubePlayer from '../components/YouTubePlayer'

var COUNTDOWN_SECONDS = 8
var QR_VISIBLE_SECONDS = 10
var QR_FADE_SECONDS = 3
var QR_HIDDEN_SECONDS = 30

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

function splitFacts(text) {
  if (!text) return []
  var parts = text.split(/(?<=\.)\s+/)
  var facts = []
  var i = 0
  while (i < parts.length && facts.length < 4) {
    var p = parts[i].trim()
    if (p.length > 15 && p.length < 160) facts.push(p)
    i = i + 1
  }
  return facts
}

function useSongInfo(song) {
  var infoState = useState(null)
  var info = infoState[0]
  var setInfo = infoState[1]
  var factsState = useState([])
  var facts = factsState[0]
  var setFacts = factsState[1]
  var factIndexState = useState(0)
  var factIndex = factIndexState[0]
  var setFactIndex = factIndexState[1]

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
          fetch('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(r.artistName))
            .then(function (res2) { return res2.ok ? res2.json() : null })
            .then(function (wiki) {
              if (cancelled) return
              if (wiki && wiki.extract) setFacts(splitFacts(wiki.extract))
            })
            .catch(function () {})
        }
      })
      .catch(function () {})

    return function () { cancelled = true }
  }, [song])

  useEffect(function () {
    if (facts.length < 2) return
    var id = setInterval(function () {
      setFactIndex(function (prev) { return (prev + 1) % facts.length })
    }, 6000)
    return function () { clearInterval(id) }
  }, [facts])

  return { info: info, fact: facts.length > 0 ? facts[factIndex] : '', factIndex: factIndex }
}

function useQrCycle(active) {
  var phaseState = useState('hidden')
  var phase = phaseState[0]
  var setPhase = phaseState[1]

  useEffect(function () {
    if (!active) {
      setPhase('hidden')
      return
    }
    setPhase('visible')
    var timeoutId = null

    function scheduleNext(nextPhase) {
      var delay =
        nextPhase === 'visible' ? QR_HIDDEN_SECONDS * 1000 :
        nextPhase === 'fading' ? QR_VISIBLE_SECONDS * 1000 :
        QR_FADE_SECONDS * 1000

      timeoutId = setTimeout(function () {
        setPhase(nextPhase)
        var after = nextPhase === 'visible' ? 'fading' : nextPhase === 'fading' ? 'hidden' : 'visible'
        scheduleNext(after)
      }, delay)
    }

    scheduleNext('fading')

    return function () {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [active])

  return phase
}

export default function DisplayShow() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var reactions = session.reactions
  var sessionCode = session.sessionCode
  var screenMode = session.screenMode
  var startPlaying = session.startPlaying

  var songInfo = useSongInfo(currentSinger ? currentSinger.song : '')
  var phrase = useMemo(function () {
    if (!currentSinger) return ''
    return pickPhrase(String(currentSinger.id))
  }, [currentSinger])

  var numberState = useState(COUNTDOWN_SECONDS)
  var number = numberState[0]
  var setNumber = numberState[1]
  var firedRef = useRef(false)

  var errorState = useState(null)
  var videoError = errorState[0]
  var setVideoError = errorState[1]
  var videoErrorRef = useRef(null)

  function setVideoErrorBoth(val) {
    videoErrorRef.current = val
    setVideoError(val)
  }

  var readyState = useState(false)
  var videoReady = readyState[0]
  var setVideoReady = readyState[1]

  var isPlaying = screenMode === 'reactions'
  var isCountdown = screenMode === 'countdown'
  var qrPhase = useQrCycle(isPlaying && videoReady)

  useEffect(function () {
    if (screenMode !== 'countdown' || !currentSinger) return
    firedRef.current = false
    var startedAt = Date.now()

    var interval = setInterval(function () {
      var elapsed = (Date.now() - startedAt) / 1000
      var remaining = Math.ceil(COUNTDOWN_SECONDS - elapsed)
      if (remaining <= 0) {
        setNumber(0)
        if (!firedRef.current && !videoErrorRef.current) {
          firedRef.current = true
          startPlaying()
        }
        clearInterval(interval)
      } else {
        setNumber(remaining)
      }
    }, 150)

    return function () { clearInterval(interval) }
  }, [screenMode, currentSinger ? currentSinger.id : null, startPlaying])

  useEffect(function () {
    setVideoReady(false)
    setVideoErrorBoth(null)
    errorReportedRef.current = false
  }, [currentSinger ? currentSinger.videoId : null])

  if (!currentSinger) return null

  var origin = typeof window !== 'undefined' ? window.location.origin : ''
  var reactUrl = origin + '/reaccionar?bar=' + sessionCode

  var floaters = []
  var i = 0
  while (i < reactions.length) {
    var r = reactions[i]
    floaters.push(
      <span
        key={r.id}
        className="floating-emoji absolute text-6xl"
        style={{ left: (30 + Math.random() * 40) + '%', bottom: '90px' }}
      >
        {r.emoji}
      </span>
    )
    i = i + 1
  }

  var errorReportedRef = useRef(false)

  function handleVideoError(code) {
    setVideoErrorBoth(code)
    if (!errorReportedRef.current) {
      errorReportedRef.current = true
      session.reportVideoError()
    }
  }

  function handleStateChange(state) {
    if (state === 1) {
      setVideoReady(true)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <FallingParty />
      {isPlaying && <div className="absolute inset-0 pointer-events-none z-20">{floaters}</div>}

      <div className="relative w-full h-screen">
        <YouTubePlayer
          videoId={currentSinger.videoId}
          shouldPlay={isPlaying}
          onError={handleVideoError}
          onStateChange={handleStateChange}
        />

        {videoError !== null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black px-8 text-center">
            <p className="text-2xl font-bold text-white mb-3">Este video no se puede reproducir aqui</p>
            <p className="text-sm text-neutral-400 mb-6">
              El autor no permite que se comparta en otros sitios. El DJ deberia elegir otro video.
            </p>
            <a
              href={'https://www.youtube.com/watch?v=' + currentSinger.videoId}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: '#E91E8C' }}
            >
              Ver en YouTube
            </a>
          </div>
        )}

        {(isCountdown || (isPlaying && !videoReady)) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
            {isCountdown ? (
              <>
                <p className="text-lg md:text-2xl tracking-widest uppercase text-purple-400 mb-4">
                  {currentSinger.name}
                </p>
                <p className="text-sm md:text-base text-neutral-400 mb-8">Preparate...</p>
                <div key={number} className="countdown-number text-[9rem] md:text-[14rem] font-extrabold leading-none text-pink-500">
                  {number > 0 ? number : '🎤'}
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">Cargando presentacion...</p>
            )}
          </div>
        )}

        {isPlaying && videoReady && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-3xl">
            <div className="flex items-center gap-4 rounded-2xl border border-purple-500/60 bg-neutral-950/35 backdrop-blur-sm px-5 py-3 h-[76px]">
              <div
                className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xl bg-pink-600 shrink-0"
                style={{ boxShadow: '0 0 14px 3px rgba(233, 30, 140, 0.55)' }}
              >
                {currentSinger.photo ? (
                  <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
                ) : (
                  currentSinger.avatar
                )}
              </div>
              <div className="shrink-0">
                <p className="text-sm font-bold text-white leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {currentSinger.name}
                </p>
                <p className="text-xs text-yellow-400 leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {songInfo.info ? songInfo.info.artist : currentSinger.song}
                  {songInfo.info && songInfo.info.year ? ' · ' + songInfo.info.year : ''}
                </p>
              </div>
              {songInfo.fact && (
                <>
                  <div className="w-px self-stretch bg-neutral-500/40 shrink-0" />
                  <p
                    key={songInfo.factIndex}
                    className="fact-glitch fact-clamp text-base text-neutral-100 leading-snug flex-1"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
                  >
                    {songInfo.fact}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {isPlaying && videoReady && qrPhase !== 'hidden' && (
          <div
            className={'absolute bottom-6 left-6 z-20 flex flex-col items-center ' + (qrPhase === 'visible' ? 'qr-glitch-in' : 'qr-fade-out')}
          >
            <p className="text-xs font-bold text-yellow-400 mb-1.5" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
              ¡Reacciona a esta presentacion!
            </p>
            <div className="rounded-2xl border-2 border-yellow-400 bg-neutral-950/90 p-3">
              <QRCode url={reactUrl} size={130} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatUp {
          from { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          to { transform: translateY(-70vh) scale(1.5) rotate(12deg); opacity: 0; }
        }
        .floating-emoji { animation: floatUp 2.2s ease-out forwards; }
        .countdown-number {
          animation: countdownPop 0.9s ease-out;
          text-shadow: 0 0 40px rgba(233, 30, 140, 0.7);
        }
        @keyframes countdownPop {
          0% { transform: scale(0.3); opacity: 0; }
          40% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .fact-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .fact-glitch { animation: factGlitch 6s ease-in-out; }
        @keyframes factGlitch {
          0% { opacity: 0; transform: translate(-4px, 0); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
          8% { opacity: 1; transform: translate(2px, 0); text-shadow: -2px 0 #8B5CF6, 2px 0 #F4D03F; }
          16% { transform: translate(0,0); text-shadow: none; }
          88% { opacity: 1; }
          100% { opacity: 0; }
        }
        .qr-glitch-in {
          animation: qrGlitchIn 0.6s ease-out;
        }
        @keyframes qrGlitchIn {
          0% { opacity: 0; transform: translate(-8px, 4px); clip-path: inset(0 40% 0 0); }
          30% { opacity: 1; transform: translate(6px, -2px); clip-path: inset(0 0 0 30%); }
          55% { transform: translate(-3px, 1px); clip-path: inset(0 20% 0 0); }
          100% { opacity: 1; transform: translate(0,0); clip-path: inset(0 0 0 0); }
        }
        .qr-fade-out {
          animation: qrFadeOut 3s ease-in-out forwards;
        }
        @keyframes qrFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
