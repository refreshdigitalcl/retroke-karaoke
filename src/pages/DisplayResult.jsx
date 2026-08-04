import { useEffect, useMemo, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FallingParty from '../components/FallingParty'
import { isMemeReaction } from '../lib/memeReactions'

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
  var workspacePlan = session.workspacePlan
  var sessionId = session.sessionId

  // Efecto de sonido al revelar la nota. Por ahora solo en el plan Free,
  // que hasta ahora se quedaba sin ningun sonido en esta pantalla.
  useEffect(function () {
    if (!currentSinger || workspacePlan === 'PRO') return
    var audio = new Audio('/sounds/applause.mp3')
    audio.volume = 0.5
    audio.play().catch(function () {})
    return function () { audio.pause() }
  }, [currentSinger ? currentSinger.id : null, workspacePlan])

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
    setReactionStats(null)
    var query = supabase
      .from('reactions')
      .select('emoji')
      .eq('session_id', sessionId)
      .eq('queue_entry_id', currentSinger.id)

    query.then(function (result) {
      var rows = result.data || []
      var counts = {}
      var memeCount = 0
      rows.forEach(function (r) {
        if (isMemeReaction(r.emoji)) {
          memeCount = memeCount + 1
        } else {
          counts[r.emoji] = (counts[r.emoji] || 0) + 1
        }
      })
      var top = Object.keys(counts)
        .map(function (emoji) { return { emoji: emoji, count: counts[emoji] } })
        .sort(function (a, b) { return b.count - a.count })
        .slice(0, 4)
      setReactionStats({ total: rows.length, top: top, memeCount: memeCount })
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
    <div className="h-screen w-screen relative overflow-hidden bg-black flex flex-col items-center justify-center px-6 py-4 md:px-12">
        <RetroEqualizer />
        <ResultStageLights />
        <FallingParty />

        <p key={titleInfo.index} className="result-title-glitch relative z-10 font-extrabold text-white text-center shrink-0" style={{ fontSize: 'clamp(1.3rem, 4.2vh, 3rem)', marginBottom: 'clamp(2px, 0.5vh, 8px)' }}>
          {titleInfo.title}
        </p>
        <p className="relative z-10 text-purple-300 text-center tracking-wide shrink-0" style={{ fontSize: 'clamp(0.9rem, 2.2vh, 1.5rem)', marginBottom: 'clamp(10px, 3vh, 40px)' }}>
          {currentSinger.name}
        </p>

        <div className="relative z-10 flex flex-col md:flex-row flex-wrap justify-center w-full max-w-6xl items-stretch min-h-0" style={{ gap: 'clamp(10px, 1.6vh, 24px)' }}>
        <div className="w-full md:w-72 shrink-0 rounded-3xl border-2 flex flex-col items-center justify-center text-center result-panel-glow-pink" style={{ borderColor: 'rgba(244,208,63,0.55)', background: 'rgba(15,10,20,0.88)', padding: 'clamp(14px, 2.4vh, 32px)' }}>
          <p className="uppercase tracking-[3px] text-neutral-400 font-bold" style={{ fontSize: 'clamp(11px, 1.4vh, 15px)', marginBottom: 'clamp(4px, 1vh, 12px)' }}>👥 Público</p>
          {average ? (
            <>
              <p className="font-extrabold text-yellow-400 leading-none" style={{ fontSize: 'clamp(2.4rem, 8vh, 5rem)' }}>
                {average}
              </p>
              <p className="font-bold text-white" style={{ fontSize: 'clamp(0.85rem, 1.8vh, 1.25rem)', marginTop: 'clamp(4px, 1.2vh, 16px)' }}>
                {phrase}
              </p>
              <p className="text-neutral-400" style={{ fontSize: 'clamp(10px, 1.3vh, 14px)', marginTop: 'clamp(2px, 0.6vh, 8px)' }}>
                {songRatings.length} {songRatings.length === 1 ? 'voto' : 'votos'}
              </p>
            </>
          ) : (
            <p className="text-neutral-400" style={{ fontSize: 'clamp(0.9rem, 1.8vh, 1.25rem)' }}>Sin votos suficientes</p>
          )}
        </div>

        {notaFinal && (
          <div className="w-full md:w-72 shrink-0 rounded-3xl border-2 flex flex-col items-center justify-center text-center nota-final-panel" style={{ padding: 'clamp(14px, 2.4vh, 32px)' }}>
            {bursting && <ConfettiBurst burstKey={burstKey} />}
            <p className="uppercase tracking-[3px] font-bold" style={{ color: '#F4D03F', textShadow: '0 0 10px rgba(244,208,63,0.8)', fontSize: 'clamp(11px, 1.4vh, 15px)', marginBottom: 'clamp(4px, 1vh, 12px)' }}>
              ⭐ Nota Final
            </p>
            <p className="nota-final-number leading-none">
              {notaFinal}
            </p>
            {average && retrokeAsNota !== null && (
              <p className="uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(9px, 1.1vh, 13px)', marginTop: 'clamp(4px, 1.2vh, 16px)' }}>
                Promedio Público + Retroke
              </p>
            )}
          </div>
        )}

        {vocalResult && (
          <div className="w-full md:w-72 shrink-0 rounded-3xl border-2 flex flex-col items-center justify-center text-center result-panel-glow-gold" style={{ borderColor: 'rgba(139,92,246,0.55)', background: 'rgba(10,8,20,0.92)', padding: 'clamp(14px, 2.4vh, 32px)' }}>
            <p className="uppercase tracking-[3px] font-bold" style={{ color: '#F4D03F', fontSize: 'clamp(11px, 1.4vh, 15px)', marginBottom: 'clamp(4px, 1vh, 12px)' }}>🎤 Retroke Score</p>
            <p className="font-extrabold leading-none" style={{ color: '#F4D03F', textShadow: '0 0 20px rgba(244,208,63,0.6)', fontSize: 'clamp(2.4rem, 8vh, 5rem)' }}>
              {vocalResult.final_score}
            </p>
            <div className="grid grid-cols-2 w-full" style={{ gap: 'clamp(6px, 1vh, 12px)', marginTop: 'clamp(8px, 1.8vh, 24px)' }}>
              {[
                { label: '🎯 Afinación', value: vocalResult.pitch_score, color: '#F4D03F' },
                { label: '🥁 Ritmo', value: vocalResult.rhythm_score, color: '#8B5CF6' },
                { label: '🎵 Estabilidad', value: vocalResult.stability_score, color: '#E91E8C' },
                { label: '🔥 Energía', value: vocalResult.energy_score, color: '#7ED957' }
              ].map(function (m) {
                return (
                  <div key={m.label} className="rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: 'clamp(6px, 1.2vh, 14px)' }}>
                    <p className="uppercase text-neutral-300 truncate font-bold" style={{ fontSize: 'clamp(9px, 1.1vh, 13px)' }}>{m.label}</p>
                    <div className="rounded-full overflow-hidden" style={{ height: 'clamp(4px, 0.7vh, 8px)', background: 'rgba(255,255,255,0.12)', marginTop: 'clamp(4px, 0.8vh, 8px)', marginBottom: 'clamp(4px, 0.8vh, 8px)' }}>
                      <div className="h-full rounded-full" style={{ width: m.value + '%', background: m.color, boxShadow: '0 0 6px ' + m.color }} />
                    </div>
                    <p className="font-extrabold" style={{ color: m.color, fontSize: 'clamp(1rem, 2.4vh, 1.5rem)' }}>{m.value}</p>
                  </div>
                )
              })}
            </div>
            {vocalResult.feedback && (
              <p className="text-neutral-200 font-medium" style={{ fontSize: 'clamp(0.75rem, 1.5vh, 1rem)', marginTop: 'clamp(6px, 1.4vh, 20px)' }}>{vocalResult.feedback}</p>
            )}
          </div>
        )}

        {reactionStats && (
          <div className="w-full md:w-72 shrink-0 rounded-3xl border-2 flex flex-col items-center justify-center text-center result-panel-glow-gold" style={{ borderColor: 'rgba(139,92,246,0.55)', background: 'rgba(10,8,20,0.92)', padding: 'clamp(14px, 2.4vh, 32px)' }}>
            <p className="uppercase tracking-[3px] font-bold" style={{ color: '#8B5CF6', fontSize: 'clamp(11px, 1.4vh, 15px)', marginBottom: 'clamp(4px, 1vh, 12px)' }}>🔥 Reacciones</p>
            <p className="font-extrabold leading-none" style={{ color: '#8B5CF6', textShadow: '0 0 20px rgba(139,92,246,0.6)', fontSize: 'clamp(2.4rem, 8vh, 5rem)' }}>
              {reactionStats.total}
            </p>
            {reactionStats.top.length > 0 ? (
              <div className="flex items-center justify-center flex-wrap" style={{ gap: 'clamp(8px, 1.6vh, 16px)', marginTop: 'clamp(8px, 1.8vh, 24px)' }}>
                {reactionStats.top.map(function (r) {
                  return (
                    <div key={r.emoji} className="flex flex-col items-center" style={{ gap: 'clamp(2px, 0.5vh, 4px)' }}>
                      <span style={{ fontSize: 'clamp(1.6rem, 4.5vh, 3rem)' }}>{r.emoji}</span>
                      <span className="font-extrabold" style={{ color: '#F4D03F', fontSize: 'clamp(0.85rem, 1.8vh, 1.125rem)' }}>{r.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : reactionStats.total === 0 ? (
              <p className="text-neutral-400" style={{ fontSize: 'clamp(0.8rem, 1.6vh, 1rem)', marginTop: 'clamp(6px, 1.4vh, 20px)' }}>Sin reacciones esta vez</p>
            ) : null}
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
        }
        .nota-final-number {
          font-size: clamp(2.4rem, 8vh, 5rem);
          font-weight: 900;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #F4D03F);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          background-size: 300% auto;
          animation: notaFinalShimmer 3s linear infinite;
          filter: drop-shadow(0 0 20px rgba(244, 208, 63, 0.5));
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
    </div>
  )
}
