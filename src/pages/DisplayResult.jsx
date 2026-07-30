import { useEffect, useMemo, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FallingParty from '../components/FallingParty'

var STAGE_LIGHT_COLORS = ['#E91E8C', '#8B5CF6', '#F4D03F', '#7ED957', '#E91E8C']
var STAGE_LIGHT_POSITIONS = ['8%', '27%', '50%', '73%', '92%']

function ResultStageLights() {
  var lights = []
  var i = 0
  while (i < STAGE_LIGHT_POSITIONS.length) {
    var color = STAGE_LIGHT_COLORS[i]
    var left = STAGE_LIGHT_POSITIONS[i]
    var delay = i * 0.6 + 's'
    lights.push(
      <div
        key={i}
        className="stage-light-flicker"
        style={{ position: 'absolute', top: 0, left: left, animationDelay: delay }}
      >
        <svg width="30" height="76" viewBox="0 0 30 76">
          <line x1="15" y1="0" x2="15" y2="28" stroke={color} strokeWidth="2" opacity="0.55" />
          <path d="M5 28 L25 28 L20 50 L10 50 Z" fill="none" stroke={color} strokeWidth="2" opacity="0.75" />
          <ellipse cx="15" cy="55" rx="11" ry="5" fill={color} opacity="0.18" />
        </svg>
      </div>
    )
    i = i + 1
  }
  return <div className="absolute inset-x-0 top-0 z-0 pointer-events-none">{lights}</div>
}

var BURST_COLORS = ['#E91E8C', '#F4D03F', '#7ED957', '#8B5CF6']

function ConfettiBurst(props) {
  var burstKey = props.burstKey
  var particles = []
  var i = 0
  while (i < 18) {
    var angle = (i * 20) * (Math.PI / 180)
    var distance = 90 + Math.random() * 70
    var dx = Math.cos(angle) * distance
    var dy = Math.sin(angle) * distance
    var color = BURST_COLORS[i % BURST_COLORS.length]
    particles.push(
      <span
        key={burstKey + '-' + i}
        className="burst-particle"
        style={{ background: color, '--dx': dx + 'px', '--dy': dy + 'px' }}
      />
    )
    i = i + 1
  }
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">{particles}</div>
}

var RESULT_TITLES = [
  '¡Gran Presentación! 🎤👏',
  '¡Excelente Presentación! ⭐🎶',
  '¡Tremenda Presentación! 🔥🎤',
  '¡Fantástica Presentación! 🌟👏',
  '¡Increíble Presentación! 🤩🎤',
  '¡Brillante Presentación! ✨🎶',
  '¡Espectacular Presentación! 💥👏',
  '¡Magnífica Presentación! 🌟🎤',
  '¡Qué Gran Presentación! 👏🔥',
  '¡Una Presentación Inolvidable! 🎶⭐',
  '¡Presentación de Lujo! 👑🎤',
  '¡Puro Talento! 🎤✨',
  '¡Te Luciste! 🔥👏',
  '¡La Rompiste! 💥🎤',
  '¡El Escenario Fue Tuyo! 👑🎶',
  '¡Una Presentación para Recordar! 🌟👏',
  '¡El Público lo Disfrutó! 🙌🎤',
  '¡Voz y Actitud! 🔥🎶',
  '¡Te Pasaste! 👏⭐',
  '¡Nivel Estrella! 🌟🎤'
]

var RESULT_PHRASES = [
  '¡Gran presentación! 🎤👏',
  '¡Te luciste en el escenario! 🔥🎤',
  '¡El público lo disfrutó muchísimo! 👏❤️',
  '¡Qué tremenda interpretación! ⭐🎶',
  '¡Voz, actitud y espectáculo! 🔥🎤',
  '¡Nos regalaste una gran presentación! 🎵👏',
  '¡El escenario fue tuyo! 👑🎤',
  '¡Una actuación para recordar! 🌟🎶',
  '¡Te pasaste! Tremenda presentación 🔥👏',
  '¡El público habló y te aplaudió! 👏🙌',
  '¡Puro talento sobre el escenario! 🎤✨',
  '¡Cantaste con todo el corazón! ❤️🎶',
  '¡Qué manera de cantar! 🔥🎤',
  '¡Una presentación llena de energía! ⚡👏',
  '¡El micrófono fue tuyo y lo disfrutaste! 🎤😎',
  '¡Nos sorprendiste! Gran presentación 😮⭐',
  '¡La rompiste esta noche! 💥🎤',
  '¡Una presentación digna de aplausos! 👏🌟',
  '¡El público disfrutó cada segundo! 🎶❤️',
  '¡Gracias por dejarlo todo en el escenario! 🙌🔥'
]

function pickFromList(list, seed) {
  var index = 0
  var i = 0
  while (i < seed.length) {
    index = index + seed.charCodeAt(i)
    i = i + 1
  }
  return list[index % list.length]
}

function useRotatingTitle(seed) {
  var startIndex = useMemo(function () {
    var index = 0
    var i = 0
    while (i < seed.length) {
      index = index + seed.charCodeAt(i)
      i = i + 1
    }
    return index % RESULT_TITLES.length
  }, [seed])

  var indexState = useState(startIndex)
  var index = indexState[0]
  var setIndex = indexState[1]

  useEffect(function () {
    setIndex(startIndex)
    var id = setInterval(function () {
      setIndex(function (prev) { return (prev + 1) % RESULT_TITLES.length })
    }, 5000)
    return function () { clearInterval(id) }
  }, [startIndex])

  return { title: RESULT_TITLES[index], index: index }
}

export default function DisplayResult() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var ratings = session.ratings
  var workspaceType = session.workspaceType
  var sessionId = session.sessionId

  var vocalResultState = useState(null)
  var vocalResult = vocalResultState[0]
  var setVocalResult = vocalResultState[1]

  useEffect(function () {
    if (workspaceType !== 'HOME' || !sessionId || !currentSinger) {
      setVocalResult(null)
      return
    }
    var cancelled = false
    function load() {
      supabase
        .from('vocal_results')
        .select('*')
        .eq('session_id', sessionId)
        .eq('queue_entry_id', currentSinger.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(function (result) {
          if (cancelled) return
          if (result.data && result.data[0]) setVocalResult(result.data[0])
        })
    }
    load()
    var intervalId = setInterval(load, 3000)
    return function () {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [workspaceType, sessionId, currentSinger ? currentSinger.id : null])

  var reactionStatsState = useState(null)
  var reactionStats = reactionStatsState[0]
  var setReactionStats = reactionStatsState[1]

  useEffect(function () {
    if (workspaceType === 'HOME' || !sessionId || !currentSinger) {
      setReactionStats(null)
      return
    }
    var since = currentSinger.playbackStartedAt || currentSinger.calledAt || null
    var query = supabase.from('reactions').select('emoji').eq('session_id', sessionId)
    if (since) query = query.gte('created_at', since)

    query.then(function (result) {
      var rows = result.data || []
      var counts = {}
      rows.forEach(function (r) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1
      })
      var top = Object.keys(counts)
        .map(function (emoji) { return { emoji: emoji, count: counts[emoji] } })
        .sort(function (a, b) { return b.count - a.count })
        .slice(0, 4)
      setReactionStats({ total: rows.length, top: top })
    })
  }, [workspaceType, sessionId, currentSinger ? currentSinger.id : null])

  var songRatings = useMemo(function () {
    if (!currentSinger) return []
    return ratings.filter(function (r) { return r.singerId === String(currentSinger.id) })
  }, [ratings, currentSinger])

  var average = useMemo(function () {
    if (songRatings.length === 0) return null
    var sum = 0
    var i = 0
    while (i < songRatings.length) {
      sum = sum + songRatings[i].score
      i = i + 1
    }
    return (sum / songRatings.length).toFixed(1)
  }, [songRatings])

  var retrokeAsNota = vocalResult ? (1 + (vocalResult.final_score / 100) * 9) : null

  var notaFinal = useMemo(function () {
    var parts = []
    if (average) parts.push(parseFloat(average))
    if (retrokeAsNota !== null) parts.push(retrokeAsNota)
    if (parts.length === 0) return null
    var sum = parts.reduce(function (a, b) { return a + b }, 0)
    return (sum / parts.length).toFixed(1)
  }, [average, retrokeAsNota])

  var burstState = useState(0)
  var burstKey = burstState[0]
  var setBurstKey = burstState[1]

  var burstingState = useState(false)
  var bursting = burstingState[0]
  var setBursting = burstingState[1]

  useEffect(function () {
    var id = setInterval(function () {
      setBurstKey(function (prev) { return prev + 1 })
      setBursting(true)
      setTimeout(function () { setBursting(false) }, 1100)
    }, 10000)
    return function () { clearInterval(id) }
  }, [])

  var titleInfo = useRotatingTitle(currentSinger ? String(currentSinger.id) : 'none')

  if (!currentSinger) return null

  var phrase = pickFromList(RESULT_PHRASES, String(currentSinger.id) + 'x')

  return (
    <div className="min-h-screen w-screen relative overflow-hidden bg-black flex items-center justify-center">
      <Stage16x9>
        <RetroEqualizer />
        <ResultStageLights />
        <FallingParty />

        <p key={titleInfo.index} className="result-title-glitch relative z-10 text-3xl md:text-5xl font-extrabold text-white mb-2 text-center">
          {titleInfo.title}
        </p>
        <p className="relative z-10 text-xl md:text-2xl text-purple-300 mb-10 text-center tracking-wide">
          {currentSinger.name}
        </p>

        <div className="relative z-10 flex flex-col md:flex-row flex-wrap justify-center gap-6 w-full max-w-6xl items-stretch">
        <div className="w-full md:w-80 shrink-0 rounded-3xl border-2 px-8 py-8 flex flex-col items-center justify-center text-center result-panel-glow-pink" style={{ borderColor: 'rgba(244,208,63,0.55)', background: 'rgba(15,10,20,0.88)' }}>
          <p className="text-sm md:text-base uppercase tracking-[3px] text-neutral-400 mb-3 font-bold">👥 Público</p>
          {average ? (
            <>
              <p className="text-7xl md:text-8xl font-extrabold text-yellow-400 leading-none">
                {average}
              </p>
              <p className="text-lg md:text-xl font-bold text-white mt-4">
                {phrase}
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                {songRatings.length} {songRatings.length === 1 ? 'voto' : 'votos'}
              </p>
            </>
          ) : (
            <p className="text-xl text-neutral-400 mt-1">Sin votos suficientes</p>
          )}
        </div>

        {notaFinal && (
          <div className="w-full md:w-80 shrink-0 rounded-3xl border-2 px-8 py-8 flex flex-col items-center justify-center text-center nota-final-panel">
            {bursting && <ConfettiBurst burstKey={burstKey} />}
            <p className="text-sm md:text-base uppercase tracking-[3px] font-bold mb-3" style={{ color: '#F4D03F', textShadow: '0 0 10px rgba(244,208,63,0.8)' }}>
              ⭐ Nota Final
            </p>
            <p className="nota-final-number leading-none">
              {notaFinal}
            </p>
            {average && retrokeAsNota !== null && (
              <p className="text-xs md:text-sm mt-4 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Promedio Público + Retroke
              </p>
            )}
          </div>
        )}

        {vocalResult && (
          <div className="w-full md:w-80 shrink-0 rounded-3xl border-2 px-8 py-8 flex flex-col items-center justify-center text-center result-panel-glow-gold" style={{ borderColor: 'rgba(139,92,246,0.55)', background: 'rgba(10,8,20,0.92)' }}>
            <p className="text-sm md:text-base uppercase tracking-[3px] mb-3 font-bold" style={{ color: '#F4D03F' }}>🎤 Retroke Score</p>
            <p className="text-7xl md:text-8xl font-extrabold leading-none" style={{ color: '#F4D03F', textShadow: '0 0 20px rgba(244,208,63,0.6)' }}>
              {vocalResult.final_score}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6 w-full">
              {[
                { label: '🎯 Afinación', value: vocalResult.pitch_score, color: '#F4D03F' },
                { label: '🥁 Ritmo', value: vocalResult.rhythm_score, color: '#8B5CF6' },
                { label: '🎵 Estabilidad', value: vocalResult.stability_score, color: '#E91E8C' },
                { label: '🔥 Energía', value: vocalResult.energy_score, color: '#7ED957' }
              ].map(function (m) {
                return (
                  <div key={m.label} className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-sm uppercase text-neutral-300 truncate font-bold">{m.label}</p>
                    <div className="h-2 rounded-full overflow-hidden mt-2 mb-2" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: m.value + '%', background: m.color, boxShadow: '0 0 6px ' + m.color }} />
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
                  </div>
                )
              })}
            </div>
            {vocalResult.feedback && (
              <p className="text-base text-neutral-200 mt-5 font-medium">{vocalResult.feedback}</p>
            )}
          </div>
        )}

        {reactionStats && (
          <div className="w-full md:w-80 shrink-0 rounded-3xl border-2 px-8 py-8 flex flex-col items-center justify-center text-center result-panel-glow-gold" style={{ borderColor: 'rgba(139,92,246,0.55)', background: 'rgba(10,8,20,0.92)' }}>
            <p className="text-sm md:text-base uppercase tracking-[3px] mb-3 font-bold" style={{ color: '#8B5CF6' }}>🔥 Reacciones</p>
            <p className="text-7xl md:text-8xl font-extrabold leading-none" style={{ color: '#8B5CF6', textShadow: '0 0 20px rgba(139,92,246,0.6)' }}>
              {reactionStats.total}
            </p>
            {reactionStats.top.length > 0 ? (
              <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
                {reactionStats.top.map(function (r) {
                  return (
                    <div key={r.emoji} className="flex flex-col items-center gap-1">
                      <span className="text-5xl">{r.emoji}</span>
                      <span className="text-lg font-extrabold" style={{ color: '#F4D03F' }}>{r.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-base text-neutral-400 mt-5">Sin reacciones esta vez</p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .result-title-glitch {
          animation: resultTitleGlitch 0.6s ease-out;
        }
        @keyframes resultTitleGlitch {
          0% { opacity: 0; transform: translate(-6px, 0); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
          20% { opacity: 1; transform: translate(4px, 0); text-shadow: -3px 0 #8B5CF6, 3px 0 #F4D03F; }
          40% { transform: translate(-2px, 0); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
          60%, 100% { transform: translate(0,0); text-shadow: none; opacity: 1; }
        }
        .nota-final-in {
          animation: notaFinalIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes notaFinalIn {
          from { opacity: 0; transform: scale(0.6) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .nota-final-panel {
          position: relative;
          border-color: rgba(244, 208, 63, 0.75);
          background: linear-gradient(160deg, rgba(139,92,246,0.16), rgba(10,8,20,0.94) 55%);
          animation: notaFinalPanelGlow 2.6s ease-in-out infinite;
        }
        @keyframes notaFinalPanelGlow {
          0%, 100% { box-shadow: 0 0 45px -10px rgba(244, 208, 63, 0.7), 0 0 80px -25px rgba(139, 92, 246, 0.6); }
          50% { box-shadow: 0 0 65px -6px rgba(244, 208, 63, 0.95), 0 0 100px -18px rgba(233, 30, 140, 0.7); }
        }
        .nota-final-number {
          font-size: 6.5rem;
          font-weight: 900;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #F4D03F);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          background-size: 300% auto;
          animation: notaFinalShimmer 3s linear infinite;
          filter: drop-shadow(0 0 20px rgba(244, 208, 63, 0.5));
        }
        @media (min-width: 768px) {
          .nota-final-number { font-size: 8.5rem; }
        }
        @keyframes notaFinalShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        .result-panel-glow-pink {
          box-shadow: 0 0 40px -8px rgba(244, 208, 63, 0.6);
          animation: panelGlowPink 2.6s ease-in-out infinite;
        }
        @keyframes panelGlowPink {
          0%, 100% { box-shadow: 0 0 40px -8px rgba(244, 208, 63, 0.55); }
          50% { box-shadow: 0 0 55px -4px rgba(244, 208, 63, 0.85); }
        }
        .result-panel-glow-gold {
          animation: panelGlowGold 2.6s ease-in-out infinite;
        }
        @keyframes panelGlowGold {
          0%, 100% { box-shadow: 0 0 40px -8px rgba(139, 92, 246, 0.55); }
          50% { box-shadow: 0 0 55px -4px rgba(233, 30, 140, 0.75); }
        }
        .stage-light-flicker {
          animation: stageFlicker 3.2s ease-in-out infinite;
        }
        @keyframes stageFlicker {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.35; }
        }
        .burst-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: burstOut 1s ease-out forwards;
        }
        @keyframes burstOut {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
        }
      `}</style>
      </Stage16x9>
    </div>
  )
}

function Stage16x9(props) {
  var scaleState = useState(1)
  var scale = scaleState[0]
  var setScale = scaleState[1]

  useEffect(function () {
    function computeScale() {
      var scaleX = window.innerWidth / 1920
      var scaleY = window.innerHeight / 1080
      setScale(Math.min(scaleX, scaleY))
    }
    computeScale()
    window.addEventListener('resize', computeScale)
    return function () { window.removeEventListener('resize', computeScale) }
  }, [])

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        transform: 'scale(' + scale + ')',
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      {props.children}
    </div>
  )
}
