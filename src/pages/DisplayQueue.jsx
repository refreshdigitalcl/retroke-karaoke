import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import QRCode from '../components/QRCode'
import FloatingDecor from '../components/FloatingDecor'
import FullscreenButton from '../components/FullscreenButton'
import FallingParty from '../components/FallingParty'

function QueueRow(props) {
  var entry = props.entry
  var position = props.position
  var isNext = position === 1

  var artworkState = useState(null)
  var artwork = artworkState[0]
  var setArtwork = artworkState[1]

  var artistState = useState('')
  var artist = artistState[0]
  var setArtist = artistState[1]

  var statusState = useState('loading')
  var status = statusState[0]
  var setStatus = statusState[1]

  useEffect(function () {
    var cancelled = false
    var query = encodeURIComponent(entry.song)
    fetch('https://itunes.apple.com/search?term=' + query + '&entity=song&limit=1')
      .then(function (res) {
        return res.json()
      })
      .then(function (data) {
        if (cancelled) return
        if (data.results && data.results.length > 0) {
          setArtwork(data.results[0].artworkUrl100)
          setArtist(data.results[0].artistName)
          setStatus('found')
        } else {
          setStatus('none')
        }
      })
      .catch(function () {
        if (!cancelled) setStatus('none')
      })
    return function () {
      cancelled = true
    }
  }, [entry.song])

  var accentColor = isNext ? '#7ED957' : position === 2 ? '#F4D03F' : '#8B5CF6'

  return (
    <div
      className="relative rounded-2xl p-3.5 flex items-center gap-3.5 queue-row-in"
      style={{
        background: isNext ? 'linear-gradient(90deg, rgba(126,217,87,0.14), rgba(20,15,30,0.85))' : 'rgba(20,15,30,0.75)',
        border: '1.5px solid ' + (isNext ? 'rgba(126,217,87,0.6)' : 'rgba(139,92,246,0.28)'),
        boxShadow: isNext ? '0 0 20px -4px rgba(126,217,87,0.5)' : 'none'
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid ' + accentColor, color: accentColor }}
      >
        {position}
      </div>
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}>
        {artwork ? (
          <img src={artwork} alt={entry.song} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-white truncate">{entry.name}</p>
        <p className="text-sm truncate" style={{ color: accentColor }}>
          {status === 'loading' && 'Buscando artista...'}
          {status === 'found' && artist}
          {status === 'none' && entry.song}
        </p>
        <p className="text-sm text-neutral-400 truncate">{entry.song}</p>
      </div>
      {isNext && (
        <span className="ready-pulse text-xs font-extrabold px-3 py-1.5 rounded-full shrink-0 tracking-wide" style={{ background: '#7ED957', color: '#0a0a0a' }}>
          🎤 LISTO
        </span>
      )}
    </div>
  )
}

function Backstage(props) {
  var queue = props.queue
  var rows = []
  var i = 0
  while (i < queue.length) {
    rows.push(<QueueRow key={queue[i].id} entry={queue[i]} position={i + 1} />)
    i = i + 1
  }

  return (
    <div
      className="w-full h-full flex flex-col rounded-3xl px-6 py-6 md:px-7 md:py-7 backstage-glow"
      style={{ background: 'rgba(10,8,18,0.82)', border: '2px solid rgba(139,92,246,0.5)' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#7ED957', boxShadow: '0 0 8px 2px rgba(126,217,87,0.8)' }} />
        <p className="text-xs md:text-sm tracking-[4px] uppercase font-bold" style={{ color: '#F4D03F' }}>
          Lista de espera
        </p>
      </div>
      {rows.length === 0 && (
        <p className="text-base text-neutral-400">
          Aún no hay nadie anotado. Escanea el QR y sé el primero en subir al escenario.
        </p>
      )}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[560px]">{rows}</div>
      <style>{`
        .ready-pulse {
          animation: readyPulse 1.4s ease-in-out infinite;
        }
        @keyframes readyPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px 2px rgba(126,217,87,0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 18px 6px rgba(126,217,87,0.95); }
        }
        .queue-row-in {
          animation: queueRowIn 0.4s ease-out both;
        }
        @keyframes queueRowIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .backstage-glow {
          box-shadow: 0 0 40px -10px rgba(139,92,246,0.4), inset 0 0 30px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  )
}

function groupRatings(ratings) {
  var map = {}
  var order = []
  var i = 0
  while (i < ratings.length) {
    var r = ratings[i]
    if (!map[r.singerId]) {
      map[r.singerId] = { name: r.name, total: 0, count: 0 }
      order.push(r.singerId)
    }
    map[r.singerId].total = map[r.singerId].total + r.score
    map[r.singerId].count = map[r.singerId].count + 1
    i = i + 1
  }
  var result = []
  var j = 0
  while (j < order.length) {
    var id = order[j]
    var e = map[id]
    result.push({ id: id, name: e.name, average: (e.total / e.count).toFixed(1) })
    j = j + 1
  }
  return result
}

export default function DisplayQueue(props) {
  var muted = props.muted
  var toggleMute = props.toggleMute
  var musicEnabled = props.musicEnabled
  var session = useKaraokeSession()
  var barName = session.barName
  var logoUrl = session.logoUrl
  var spaceParam = session.spaceParam
  var sessionCode = session.sessionCode
  var queue = session.queue
  var ratings = session.ratings

  var sungTonight = groupRatings(ratings)

  var sungIndexState = useState(0)
  var sungIndex = sungIndexState[0]
  var setSungIndex = sungIndexState[1]

  useEffect(function () {
    if (sungTonight.length < 2) return
    var id = setInterval(function () {
      setSungIndex(function (prev) {
        return (prev + 1) % sungTonight.length
      })
    }, 4000)
    return function () {
      clearInterval(id)
    }
  }, [sungTonight.length])

  var currentSung = sungTonight.length > 0 ? sungTonight[sungIndex % sungTonight.length] : null

  var origin = ''
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  var registerUrl = origin + '/registro?' + spaceParam

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-black">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="pointer-events-none fixed -top-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#E91E8C' }} />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-25 blur-3xl" style={{ background: '#8B5CF6' }} />

      <RetroEqualizer />
      <FloatingDecor />
      <FallingParty />

      <div className="fixed top-5 right-5 z-30 flex flex-col gap-3">
        <FullscreenButton />
        {musicEnabled && (
          <button
            onClick={toggleMute}
            className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors sound-neon-btn"
            style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.85)' }}
            title={muted ? 'Activar musica de fondo' : 'Silenciar musica de fondo'}
          >
            <span className="text-lg">{muted ? '🔇' : '🔊'}</span>
          </button>
        )}
      </div>

      <button
        onClick={function () {
          try { localStorage.removeItem('retroke_last_room') } catch (e) {}
          window.location.href = '/'
        }}
        className="fixed bottom-4 left-4 z-30 text-[11px] px-3 py-1.5 rounded-full opacity-25 hover:opacity-80 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        🏠 Cambiar sala
      </button>

      <header className="flex items-center justify-center gap-3 relative z-10 pt-8 pb-2">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={barName}
            className="h-12 w-12 rounded-full object-cover border-2"
            style={{ borderColor: '#F4D03F', boxShadow: '0 0 16px 3px rgba(244, 208, 63, 0.5)' }}
          />
        ) : (
          <span className="text-2xl">🎤</span>
        )}
        <div
          className="px-6 py-2.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', boxShadow: '0 0 22px -4px rgba(233,30,140,0.7)' }}
        >
          <span className="text-base md:text-lg font-extrabold text-white tracking-wide">
            {barName}
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full mx-auto px-6 md:px-8 pb-10 pt-4">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs md:text-sm tracking-[6px] uppercase font-bold mb-3" style={{ color: '#F4D03F' }}>
            ✨ Karaoke en vivo
          </p>
          <h1 className="hero-title text-3xl md:text-5xl font-extrabold leading-tight mb-3">
            El karaoke nunca volvió a ser igual.
          </h1>
          <p className="text-lg md:text-2xl font-bold mb-4 hero-subtitle" style={{ color: '#E91E8C' }}>
            Somos el sistema operativo del karaoke moderno.
          </p>
          <p className="text-base md:text-lg text-neutral-300 mb-8 max-w-md">
            Escanea el código QR, anota tu nombre y tu canción, y prepárate
            para vivir el verdadero espectáculo interactivo.
          </p>

          <div className="relative qr-card-glow rounded-[2rem] px-9 py-8 flex flex-col items-center gap-4" style={{ background: 'rgba(12,8,20,0.9)', border: '2.5px solid #F4D03F' }}>
            <span className="qr-corner qr-corner-tl" />
            <span className="qr-corner qr-corner-tr" />
            <span className="qr-corner qr-corner-bl" />
            <span className="qr-corner qr-corner-br" />
            <QRCode url={registerUrl} size={220} />
            <p className="text-sm md:text-base font-bold tracking-wide" style={{ color: '#8B5CF6' }}>
              karaoke.cl/{sessionCode}
            </p>
          </div>

          {currentSung && (
            <div className="mt-6 w-full max-w-[300px] rounded-2xl px-5 py-4" style={{ background: 'rgba(15,10,20,0.75)', border: '1.5px solid rgba(139,92,246,0.4)' }}>
              <p className="text-xs md:text-sm tracking-widest uppercase font-bold mb-2 text-center" style={{ color: '#8B5CF6' }}>
                Ya cantaron esta noche
              </p>
              <div className="h-9 flex items-center justify-center overflow-hidden">
                <div
                  key={currentSung.id + '-' + sungIndex}
                  className="glitch-row flex items-center gap-3"
                >
                  <span className="text-white font-bold text-lg">{currentSung.name}</span>
                  <span className="font-extrabold text-lg" style={{ color: '#F4D03F' }}>{currentSung.average}</span>
                </div>
              </div>
            </div>
          )}
          <style>{`
            .glitch-row {
              animation: glitchIn 0.5s steps(3) forwards;
            }
            @keyframes glitchIn {
              0% { opacity: 0; transform: translate(-6px, 2px); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
              15% { opacity: 1; transform: translate(4px, -2px); text-shadow: -3px 0 #8B5CF6, 3px 0 #F4D03F; }
              30% { transform: translate(-3px, 1px); text-shadow: 2px 0 #E91E8C, -2px 0 #7ED957; }
              45% { transform: translate(2px, -1px); text-shadow: none; }
              60%, 100% { transform: translate(0,0); text-shadow: none; opacity: 1; }
            }
            .hero-title {
              background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #7ED957, #F4D03F);
              background-size: 300% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: heroGradient 6s linear infinite, heroEntrance 0.7s steps(4) both;
              text-shadow: 0 0 24px rgba(233, 30, 140, 0.35);
            }
            @keyframes heroGradient {
              0% { background-position: 0% 50%; }
              100% { background-position: 300% 50%; }
            }
            @keyframes heroEntrance {
              0% { opacity: 0; transform: translate(-10px, 4px) scale(0.96); }
              25% { opacity: 1; transform: translate(6px, -3px) scale(1.02); }
              50% { transform: translate(-4px, 2px) scale(0.99); }
              75% { transform: translate(2px, -1px) scale(1.01); }
              100% { opacity: 1; transform: translate(0,0) scale(1); }
            }
            .hero-subtitle {
              animation: subtitlePulse 3.2s ease-in-out infinite;
            }
            @keyframes subtitlePulse {
              0%, 100% { text-shadow: 0 0 6px rgba(233, 30, 140, 0.4); }
              50% { text-shadow: 0 0 18px rgba(233, 30, 140, 0.9); }
            }
            .sound-neon-btn {
              box-shadow: 0 0 16px -2px rgba(244, 208, 63, 0.55);
              animation: soundBtnGlow 2.6s ease-in-out infinite;
            }
            @keyframes soundBtnGlow {
              0%, 100% { box-shadow: 0 0 16px -2px rgba(244, 208, 63, 0.5); }
              50% { box-shadow: 0 0 22px 0px rgba(244, 208, 63, 0.85); }
            }
            .qr-card-glow {
              box-shadow: 0 0 44px -6px rgba(244, 208, 63, 0.6), 0 0 70px -20px rgba(233, 30, 140, 0.6);
              animation: qrGlow 2.8s ease-in-out infinite;
            }
            @keyframes qrGlow {
              0%, 100% { box-shadow: 0 0 44px -6px rgba(244, 208, 63, 0.55), 0 0 70px -20px rgba(233, 30, 140, 0.55); }
              50% { box-shadow: 0 0 56px -4px rgba(244, 208, 63, 0.85), 0 0 90px -14px rgba(139, 92, 246, 0.75); }
            }
            .qr-corner {
              position: absolute;
              width: 22px;
              height: 22px;
              border-color: #8B5CF6;
              border-style: solid;
            }
            .qr-corner-tl { top: -3px; left: -3px; border-width: 3px 0 0 3px; border-top-left-radius: 12px; }
            .qr-corner-tr { top: -3px; right: -3px; border-width: 3px 3px 0 0; border-top-right-radius: 12px; }
            .qr-corner-bl { bottom: -3px; left: -3px; border-width: 0 0 3px 3px; border-bottom-left-radius: 12px; }
            .qr-corner-br { bottom: -3px; right: -3px; border-width: 0 3px 3px 0; border-bottom-right-radius: 12px; }
          `}</style>
        </div>

        <div className="min-h-[560px]">
          <Backstage queue={queue} />
        </div>
      </main>
    </div>
  )
}
