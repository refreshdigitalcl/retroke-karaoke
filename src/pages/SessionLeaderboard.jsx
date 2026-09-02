import { useEffect, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'
import FallingParty from '../components/FallingParty'
import { useLanguage } from '../lib/i18n'

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
      className="podium-pop relative flex-1 h-full flex flex-col items-center justify-center px-4 border-x min-h-0"
      style={{ borderColor: 'rgba(139, 92, 246, 0.25)', animationDelay: delay }}
    >
      {isFirst && <ConfettiBurst />}

      <span className="relative z-10 mb-1" style={{ fontSize: 'clamp(1.6rem, 5vh, 3.5rem)' }}>
        {place === 1 ? '👑' : place === 2 ? '🥈' : '🥉'}
      </span>

      <div
        className="relative z-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-2 border-4"
        style={{
          width: 'clamp(70px, 15vh, 180px)',
          height: 'clamp(70px, 15vh, 180px)',
          fontSize: 'clamp(30px, 6.5vh, 80px)',
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
        className="relative z-10 font-extrabold leading-none mb-1.5"
        style={{ color: accent, textShadow: '0 0 20px ' + accent + '80', fontSize: 'clamp(1.6rem, 5vh, 3.5rem)' }}
      >
        {place}
      </p>

      <p className="relative z-10 font-extrabold text-white text-center max-w-[280px] truncate" style={{ fontSize: 'clamp(0.85rem, 2.2vh, 1.5rem)' }}>
        {entry.name}
      </p>
      <p className="relative z-10 font-bold text-yellow-400 mt-1" style={{ fontSize: 'clamp(0.75rem, 1.8vh, 1.25rem)' }}>
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
    <div className="rounded-2xl border-2 border-purple-500/50 bg-neutral-950/85 flex flex-col items-center text-center" style={{ padding: 'clamp(10px, 2vh, 24px) clamp(12px, 2vw, 24px)' }}>
      <span className="mb-1" style={{ fontSize: 'clamp(1.2rem, 3vh, 2.25rem)' }}>{props.icon}</span>
      <p className="uppercase tracking-widest text-yellow-400 font-bold mb-1" style={{ fontSize: 'clamp(0.6rem, 1.3vh, 0.875rem)' }}>
        {props.label}
      </p>
      <p className="font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(0.9rem, 2.2vh, 1.875rem)' }}>
        {props.value}
      </p>
      {props.sub && <p className="text-neutral-400 mt-1" style={{ fontSize: 'clamp(0.65rem, 1.3vh, 0.875rem)' }}>{props.sub}</p>}
    </div>
  )
}

export default function SessionLeaderboard() {
  var session = useKaraokeSession()
  var lastClosedSession = session.lastClosedSession
  var loadSessionLeaderboard = session.loadSessionLeaderboard
  var hasFeature = session.hasFeature
  var T = useLanguage().T

  var listState = useState(null)
  var list = listState[0]
  var setList = listState[1]

  var applausePlayedRef = useRef(false)
  var applauseAudioRef = useRef(null)

  useEffect(function () {
    if (!lastClosedSession) return
    loadSessionLeaderboard(lastClosedSession.id).then(setList)
  }, [lastClosedSession, loadSessionLeaderboard])

  useEffect(function () {
    if (!lastClosedSession) return
    var cancelled = false
    var intervalId = setInterval(function () {
      supabase
        .from('sessions')
        .select('dismiss_podium_at')
        .eq('id', lastClosedSession.id)
        .maybeSingle()
        .then(function (result) {
          if (cancelled) return
          if (result.data && result.data.dismiss_podium_at) {
            window.location.href = '/'
          }
        })
    }, 4000)
    return function () {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [lastClosedSession])

  useEffect(function () {
    if (list && list.length > 0 && !applausePlayedRef.current) {
      applausePlayedRef.current = true
      var audio = new Audio('/sounds/podio-aplausos.mp3')
      applauseAudioRef.current = audio
      audio.play().catch(function () {})
    }
  }, [list])

  useEffect(function () {
    return function () {
      if (applauseAudioRef.current) {
        applauseAudioRef.current.pause()
        applauseAudioRef.current = null
      }
    }
  }, [])

  var nightStats = useNightStats(
    lastClosedSession ? lastClosedSession.id : null,
    list || []
  )

  if (!lastClosedSession) return null
  if (list === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-neutral-500">{T.leaderboard.loading}</p>
      </div>
    )
  }

  var top3 = list.slice(0, 3)
  var first = top3[0]
  var second = top3[1]
  var third = top3[2]

  return (
    <div className="h-screen relative overflow-hidden flex flex-col items-center bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <button
        onClick={function () {
          try { localStorage.removeItem('retroke_last_room') } catch (e) {}
          window.location.href = '/'
        }}
        className="fixed top-5 right-5 z-30 w-11 h-11 rounded-full flex items-center justify-center border-2"
        style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.85)' }}
        title={T.leaderboard.goToRooms}
      >
        <span className="text-lg">🏠</span>
      </button>

      <div className="relative z-10 w-full flex flex-col items-center shrink-0" style={{ paddingTop: 'clamp(10px, 2.5vh, 32px)', paddingBottom: 'clamp(4px, 1vh, 16px)' }}>
        <p className="tracking-[6px] uppercase text-purple-400 mb-1" style={{ fontSize: 'clamp(10px, 1.4vh, 14px)' }}>
          {lastClosedSession.name}
        </p>
        <h1 className="font-extrabold text-white text-center leading-tight" style={{ fontSize: 'clamp(1.4rem, 4.2vh, 3rem)' }}>
          {T.leaderboard.title}
        </h1>
      </div>

      {list.length === 0 ? (
        <p className="relative z-10 text-xl text-neutral-400 flex-1 flex items-center">
          {T.leaderboard.noRatings}
        </p>
      ) : (
        <>
          <div className="relative z-10 w-full flex-1 flex flex-col md:flex-row min-h-0">
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
            <div
              className="relative z-10 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 shrink-0"
              style={{ gap: 'clamp(6px, 1.2vh, 16px)', padding: '0 clamp(10px, 2vw, 16px)', marginBottom: 'clamp(10px, 2.5vh, 40px)' }}
            >
              <StatCard
                icon="🎶"
                label={T.leaderboard.genreOfNight}
                value={nightStats.topGenre || T.leaderboard.genreVaried}
                sub={nightStats.participantCount + ' ' + T.leaderboard.performancesCount}
              />
              <StatCard
                icon="🔥"
                label={T.leaderboard.mostReacted}
                value={nightStats.mostReacted || T.leaderboard.noDataYet}
                sub={nightStats.mostReactedCount > 0 ? nightStats.mostReactedCount + ' ' + T.leaderboard.reactionsCount : ''}
              />
              <StatCard
                icon="⭐"
                label={T.leaderboard.averageScore}
                value={nightStats.avgScore.toFixed(1)}
                sub={nightStats.totalReactions + ' ' + T.leaderboard.reactionsTotal}
              />
            </div>
          )}

          {nightStats && !hasFeature('advanced_statistics') && (
            <div
              className="relative z-10 w-full max-w-md rounded-2xl border-2 border-purple-500/40 bg-neutral-950/70 text-center shrink-0"
              style={{ padding: 'clamp(10px, 2vh, 20px) clamp(16px, 3vw, 24px)', marginBottom: 'clamp(10px, 2.5vh, 40px)' }}
            >
              <p className="text-neutral-400" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 0.875rem)' }}>
                {T.leaderboard.proLocked} <span className="text-yellow-400 font-bold">{T.leaderboard.proLabel}</span>
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
