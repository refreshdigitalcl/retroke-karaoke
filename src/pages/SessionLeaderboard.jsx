import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'

var BURST_COLORS = ['#E91E8C', '#F4D03F', '#7ED957', '#8B5CF6']

function ConfettiBurst() {
  var particles = []
  var i = 0
  while (i < 20) {
    var angle = (i * 18) * (Math.PI / 180)
    var distance = 100 + Math.random() * 90
    var dx = Math.cos(angle) * distance
    var dy = Math.sin(angle) * distance
    var color = BURST_COLORS[i % BURST_COLORS.length]
    particles.push(
      <span
        key={i}
        className="burst-particle"
        style={{ background: color, '--dx': dx + 'px', '--dy': dy + 'px' }}
      />
    )
    i = i + 1
  }
  return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">{particles}</div>
}

function useArtist(song) {
  var artistState = useState('')
  var artist = artistState[0]
  var setArtist = artistState[1]

  useEffect(function () {
    var cancelled = false
    if (!song) return
    fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1')
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) setArtist(data.results[0].artistName)
      })
      .catch(function () {})
    return function () { cancelled = true }
  }, [song])

  return artist
}

function Avatar(props) {
  var entry = props.entry
  var size = props.size
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: '#E91E8C',
        boxShadow: '0 0 28px 6px rgba(233, 30, 140, 0.55)'
      }}
    >
      {entry.photo ? (
        <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
      ) : (
        entry.avatar
      )}
    </div>
  )
}

function PodiumColumn(props) {
  var entry = props.entry
  var place = props.place
  var accent = props.accent
  var delay = props.delay
  var isFirst = place === 1

  return (
    <div
      className="podium-pop relative flex-1 h-full flex flex-col items-center justify-center px-4 border-x"
      style={{ borderColor: 'rgba(139, 92, 246, 0.25)', animationDelay: delay }}
    >
      {isFirst && <ConfettiBurst />}

      <span className="relative z-10 text-6xl md:text-7xl mb-3">
        {place === 1 ? '👑' : place === 2 ? '🥈' : '🥉'}
      </span>

      <div
        className="relative z-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-5 border-4"
        style={{
          width: 180,
          height: 180,
          fontSize: 80,
          background: '#E91E8C',
          borderColor: accent,
          boxShadow: '0 0 40px 10px ' + accent + '70'
        }}
      >
        {entry.photo ? (
          <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>

      <p
        className="relative z-10 text-6xl md:text-7xl font-extrabold leading-none mb-4"
        style={{ color: accent, textShadow: '0 0 20px ' + accent + '80' }}
      >
        {place}
      </p>

      <p className="relative z-10 text-2xl md:text-3xl font-extrabold text-white text-center max-w-[280px] truncate">
        {entry.name}
      </p>
      <p className="relative z-10 text-xl md:text-2xl font-bold text-yellow-400 mt-2">
        {entry.average.toFixed(1)}
      </p>
    </div>
  )
}

function useNightStats(sessionId, list) {
  var statsState = useState(null)
  var stats = statsState[0]
  var setStats = statsState[1]

  useEffect(function () {
    var cancelled = false
    if (!sessionId || !list || list.length === 0) {
      setStats(null)
      return
    }

    async function compute() {
      var genreCounts = {}
      await Promise.all(
        list.map(function (entry) {
          return fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(entry.song) + '&entity=song&limit=1')
            .then(function (res) { return res.json() })
            .then(function (data) {
              if (data.results && data.results.length > 0) {
                var genre = data.results[0].primaryGenreName
                if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1
              }
            })
            .catch(function () {})
        })
      )
      if (cancelled) return

      var topGenre = null
      var topGenreCount = 0
      Object.keys(genreCounts).forEach(function (g) {
        if (genreCounts[g] > topGenreCount) {
          topGenre = g
          topGenreCount = genreCounts[g]
        }
      })

      var reactionsResult = await supabase
        .from('reactions')
        .select('queue_entry_id')
        .eq('session_id', sessionId)
      if (cancelled) return
      var reactionRows = reactionsResult.data || []
      var reactionCounts = {}
      reactionRows.forEach(function (r) {
        if (r.queue_entry_id === null || r.queue_entry_id === undefined) return
        var key = String(r.queue_entry_id)
        reactionCounts[key] = (reactionCounts[key] || 0) + 1
      })

      var mostReactedId = null
      var mostReactedCount = 0
      Object.keys(reactionCounts).forEach(function (id) {
        if (reactionCounts[id] > mostReactedCount) {
          mostReactedId = id
          mostReactedCount = reactionCounts[id]
        }
      })
      var mostReactedEntry = list.find(function (e) { return String(e.id) === mostReactedId })

      var totalScore = list.reduce(function (sum, e) { return sum + e.average }, 0)
      var avgScore = totalScore / list.length

      setStats({
        topGenre: topGenre,
        participantCount: list.length,
        avgScore: avgScore,
        mostReacted: mostReactedEntry ? mostReactedEntry.name : null,
        mostReactedCount: mostReactedCount,
        totalReactions: reactionRows.length
      })
    }

    compute()
    return function () { cancelled = true }
  }, [sessionId, list])

  return stats
}

function StatCard(props) {
  return (
    <div className="rounded-2xl border-2 border-purple-500/50 bg-neutral-950/85 px-6 py-6 flex flex-col items-center text-center">
      <span className="text-4xl mb-2">{props.icon}</span>
      <p className="text-sm uppercase tracking-widest text-yellow-400 font-bold mb-2">
        {props.label}
      </p>
      <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
        {props.value}
      </p>
      {props.sub && <p className="text-sm text-neutral-400 mt-1">{props.sub}</p>}
    </div>
  )
}

export default function SessionLeaderboard() {
  var session = useKaraokeSession()
  var lastClosedSession = session.lastClosedSession
  var loadSessionLeaderboard = session.loadSessionLeaderboard
  var hasFeature = session.hasFeature

  var listState = useState(null)
  var list = listState[0]
  var setList = listState[1]

  var applausePlayedRef = useRef(false)

  useEffect(function () {
    if (!lastClosedSession) return
    loadSessionLeaderboard(lastClosedSession.id).then(setList)
  }, [lastClosedSession, loadSessionLeaderboard])

  useEffect(function () {
    if (list && list.length > 0 && !applausePlayedRef.current) {
      applausePlayedRef.current = true
      var audio = new Audio('/sounds/applause.mp3')
      audio.play().catch(function () {})
    }
  }, [list])

  var nightStats = useNightStats(
    lastClosedSession ? lastClosedSession.id : null,
    list || []
  )

  if (!lastClosedSession) return null
  if (list === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-neutral-500">Cargando resultados...</p>
      </div>
    )
  }

  var top3 = list.slice(0, 3)
  var first = top3[0]
  var second = top3[1]
  var third = top3[2]

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="relative z-10 w-full flex flex-col items-center pt-8 pb-4">
        <p className="text-sm tracking-[8px] uppercase text-purple-400 mb-2">
          {lastClosedSession.name}
        </p>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center">
          🏆 Mejores del karaoke
        </h1>
      </div>

      {list.length === 0 ? (
        <p className="relative z-10 text-xl text-neutral-400 flex-1 flex items-center">
          No hubo calificaciones esta noche.
        </p>
      ) : (
        <>
          <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row">
            {second && (
              <PodiumColumn entry={second} place={2} accent="#C0C0C0" delay="0.15s" />
            )}
            {first && (
              <PodiumColumn entry={first} place={1} accent="#F4D03F" delay="0s" />
            )}
            {third && (
              <PodiumColumn entry={third} place={3} accent="#CD7F32" delay="0.3s" />
            )}
          </div>

          {nightStats && hasFeature('advanced_statistics') && (
            <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 mb-10">
              <StatCard
                icon="🎶"
                label="Genero de la noche"
                value={nightStats.topGenre || 'Variado'}
                sub={nightStats.participantCount + ' presentaciones'}
              />
              <StatCard
                icon="🔥"
                label="Mas reaccionado"
                value={nightStats.mostReacted || 'Sin datos aun'}
                sub={nightStats.mostReactedCount > 0 ? nightStats.mostReactedCount + ' reacciones' : ''}
              />
              <StatCard
                icon="⭐"
                label="Promedio general"
                value={nightStats.avgScore.toFixed(1)}
                sub={nightStats.totalReactions + ' reacciones en total'}
              />
            </div>
          )}

          {nightStats && !hasFeature('advanced_statistics') && (
            <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-purple-500/40 bg-neutral-950/70 px-6 py-5 mb-10 text-center">
              <p className="text-sm text-neutral-400">
                🔒 Las estadisticas de la noche estan disponibles en el plan <span className="text-yellow-400 font-bold">PRO</span>
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        .podium-pop {
          animation: podiumPop 0.6s ease-out both;
        }
        @keyframes podiumPop {
          0% { opacity: 0; transform: translateY(50px) scale(0.85); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .podium-shimmer {
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: shimmerMove 3s ease-in-out infinite;
        }
        @keyframes shimmerMove {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .burst-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 2px;
          animation: burstOut 1.4s ease-out infinite;
        }
        @keyframes burstOut {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
