import { useEffect, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'

var HERO_PHRASES = [
  'UNA NUEVA FORMA DE VIVIR EL KARAOKE.',
  'EL ESCENARIO TE ESPERA. LA EXPERIENCIA ES TUYA.',
  'EL KARAOKE COMO NUNCA LO HAS VIVIDO.',
  'EL SHOW LO HACEMOS ENTRE TODOS.',
  'CANTAR ES SOLO EL COMIENZO, VIVIRLO ES DE TODOS.',
  'LA CANCIÓN ES TUYA. LA EXPERIENCIA ES DE TODOS.'
]

function nextHeroPhrase() {
  var idx = 0
  try {
    var stored = parseInt(localStorage.getItem('retroke_phrase_idx') || '0', 10)
    if (!isNaN(stored)) idx = stored
  } catch (e) {}
  try {
    localStorage.setItem('retroke_phrase_idx', String(idx + 1))
  } catch (e) {}
  return HERO_PHRASES[idx % HERO_PHRASES.length]
}
import QRCode from '../components/QRCode'
import FloatingDecor from '../components/FloatingDecor'
import FullscreenButton from '../components/FullscreenButton'
import FallingParty from '../components/FallingParty'
import RetroNeonBg from '../components/RetroNeonBg'

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
      className="relative rounded-2xl p-4 flex items-center gap-4 queue-row-in"
      style={{
        background: isNext ? 'linear-gradient(90deg, rgba(126,217,87,0.14), rgba(20,15,30,0.85))' : 'rgba(20,15,30,0.75)',
        border: '1.5px solid ' + (isNext ? 'rgba(126,217,87,0.6)' : 'rgba(139,92,246,0.28)'),
        boxShadow: isNext ? '0 0 20px -4px rgba(126,217,87,0.5)' : 'none'
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid ' + accentColor, color: accentColor }}
      >
        {position}
      </div>
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)' }}>
        {artwork ? (
          <img src={artwork} alt={entry.song} className="w-full h-full object-cover" />
        ) : (
          entry.avatar
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-white truncate">{entry.name}</p>
        <p className="text-base truncate" style={{ color: accentColor }}>
          {status === 'loading' && 'Buscando artista...'}
          {status === 'found' && artist}
          {status === 'none' && entry.song}
        </p>
        <p className="text-base text-neutral-400 truncate">{entry.song}</p>
      </div>
      {isNext && (
        <span className="ready-pulse text-sm font-extrabold px-3 py-1.5 rounded-full shrink-0 tracking-wide" style={{ background: '#7ED957', color: '#0a0a0a' }}>
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
      className="w-full h-full flex flex-col rounded-3xl px-6 py-5 md:px-7 md:py-6 backstage-glow"
      style={{ background: 'rgba(10,8,18,0.82)', border: '2px solid rgba(139,92,246,0.5)' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
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
      <div className="flex flex-col gap-3 overflow-y-auto pr-1" style={{ maxHeight: '45vh' }}>{rows}</div>
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

function useViewportSize() {
  var sizeState = useState(function () {
    if (typeof window === 'undefined') return { w: 1920, h: 1080 }
    return { w: window.innerWidth, h: window.innerHeight }
  })
  var size = sizeState[0]
  var setSize = sizeState[1]

  useEffect(function () {
    function onResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return function () { window.removeEventListener('resize', onResize) }
  }, [])

  return size
}

export default function DisplayQueue(props) {
  var muted = props.muted
  var toggleMute = props.toggleMute
  var musicEnabled = props.musicEnabled
  var session = useKaraokeSession()
  var barName = session.barName
  var speedTestOpenState = useState(false)
  var speedTestOpen = speedTestOpenState[0]
  var setSpeedTestOpen = speedTestOpenState[1]
  var workspacePlan = session.workspacePlan
  var logoUrl = session.hasFeature('custom_branding') ? session.logoUrl : null
  var spaceParam = session.spaceParam
  var sessionCode = session.sessionCode
  var queue = session.queue
  var ratings = session.ratings

  var viewport = useViewportSize()
  // QR proporcional a la altura real de la ventana, con piso y techo
  // razonables para que nunca quede minusculo ni gigante.
  var qrSize = Math.round(Math.max(196, Math.min(322, viewport.h * 0.294)))

  var heroPhraseState = useState(nextHeroPhrase)
  var heroPhrase = heroPhraseState[0]

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
    <div className="h-screen relative overflow-hidden flex flex-col" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <RetroNeonBg />
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
        <button
          onClick={function () { setSpeedTestOpen(true) }}
          className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors sound-neon-btn"
          style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.85)' }}
          title="Test de velocidad de internet"
        >
          <span className="text-lg">📶</span>
        </button>
        <button
          onClick={function () {
            try { localStorage.removeItem('retroke_last_room') } catch (e) {}
            window.location.href = '/'
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors sound-neon-btn"
          style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.85)' }}
          title="Cambiar sala"
        >
          <span className="text-lg">🏠</span>
        </button>
      </div>

      {speedTestOpen && <SpeedTestModal onClose={function () { setSpeedTestOpen(false) }} />}

      <header className="flex items-center justify-center gap-2.5 relative z-10 pt-4 pb-1 shrink-0">
        {workspacePlan !== 'PRO' ? (
          <div
            className="queue-neon-ring px-6 py-2.5 rounded-full flex items-center"
            style={{
              background: 'rgba(10,6,15,0.72)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 0 28px 4px rgba(233,30,140,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset'
            }}
          >
            <img
              src="/landing/retroke-logo.png"
              alt="Retroke"
              className="h-14 w-auto"
              style={{ filter: 'drop-shadow(0 0 10px rgba(233,30,140,0.7)) drop-shadow(0 0 20px rgba(139,92,246,0.5))' }}
            />
          </div>
        ) : logoUrl ? (
          <div
            className="queue-neon-ring px-6 py-2.5 rounded-full flex items-center"
            style={{
              background: 'rgba(10,6,15,0.72)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 0 28px 4px rgba(233,30,140,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset'
            }}
          >
            <img
              src={logoUrl}
              alt={barName}
              className="h-14 w-auto object-contain"
              style={{ maxWidth: '260px', filter: 'drop-shadow(0 0 10px rgba(233,30,140,0.5)) drop-shadow(0 0 20px rgba(139,92,246,0.35))' }}
            />
          </div>
        ) : (
          <>
            <span className="text-xl">🎤</span>
            <div
              className="queue-neon-ring px-5 py-2 rounded-full"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', boxShadow: '0 0 22px -4px rgba(233,30,140,0.7)' }}
            >
              <span className="text-sm md:text-base font-extrabold text-white tracking-wide">
                {barName}
              </span>
            </div>
          </>
        )}
      </header>

      <main className="relative z-10 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mx-auto px-6 md:px-8 pb-3 pt-1">
        <div className="flex flex-col items-center justify-center text-center min-h-0" style={{ gap: 'clamp(10px, 2.2vh, 22px)' }}>
          <div>
            <div className="flex items-center justify-center gap-2.5 relative z-10" style={{ marginBottom: -4, transform: 'translateY(-10px)' }}>
              <span className="hero-eyebrow-emoji eyebrow-emoji-1" aria-hidden="true">🔥</span>
              <span className="hero-eyebrow-emoji eyebrow-emoji-2" aria-hidden="true">🤯</span>
              <span className="hero-eyebrow-emoji eyebrow-emoji-3" aria-hidden="true">💣</span>
              <span className="hero-eyebrow-emoji eyebrow-emoji-4" aria-hidden="true">😍</span>
            </div>
            <p
              className="tracking-[4px] uppercase font-bold mb-2 relative"
              style={{ color: '#F4D03F', fontSize: 'clamp(10px, 1.5vh, 14px)' }}
            >
              ✨ La Evolución del Karaoke
            </p>
            <h1
              className="hero-title font-extrabold leading-tight"
              style={{ fontSize: 'clamp(1.3rem, 4.4vh, 2.5rem)' }}
            >
              {heroPhrase}
            </h1>
          </div>

          <p
            className="font-bold hero-subtitle max-w-lg"
            style={{ color: '#E91E8C', fontSize: 'clamp(1.05rem, 2.6vh, 1.5rem)' }}
          >
            Escanea el QR, anota tu nombre y canción, y sube al escenario.
          </p>

          <div className="queue-neon-ring relative rounded-[1.75rem] px-6 py-4 flex flex-col items-center gap-2.5" style={{ background: 'rgba(12,8,20,0.9)', boxShadow: '0 0 24px -6px rgba(244,208,63,0.4)' }}>
            <QRCode url={registerUrl} size={qrSize} />
            <p className="font-bold tracking-wide" style={{ color: '#FFFFFF', fontSize: 'clamp(13px, 1.7vh, 16px)' }}>
              {barName}
            </p>
          </div>

          {currentSung && (
            <div className="queue-neon-ring w-full max-w-[360px] rounded-2xl px-5 py-2.5" style={{ background: 'rgba(15,10,20,0.8)' }}>
              <p
                className="tracking-widest uppercase font-bold mb-1 text-center"
                style={{ color: '#8B5CF6', fontSize: 'clamp(9px, 1.2vh, 12px)' }}
              >
                Ya cantaron esta noche
              </p>
              <div style={{ height: 'clamp(26px, 3.4vh, 36px)' }} className="flex items-center justify-center overflow-hidden">
                <div
                  key={currentSung.id + '-' + sungIndex}
                  className="glitch-row flex items-center gap-3"
                >
                  <span className="text-white font-bold" style={{ fontSize: 'clamp(15px, 2.3vh, 20px)' }}>{currentSung.name}</span>
                  <span className="font-extrabold" style={{ color: '#F4D03F', fontSize: 'clamp(15px, 2.3vh, 20px)' }}>{currentSung.average}</span>
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
              color: #ffffff;
              letter-spacing: 0.5px;
              animation: heroEntrance 0.7s steps(4) both;
              text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55), 0 0 30px rgba(139, 92, 246, 0.35);
            }
            @keyframes heroEntrance {
              0% { opacity: 0; transform: translate(-10px, 4px) scale(0.96); }
              25% { opacity: 1; transform: translate(6px, -3px) scale(1.02); }
              50% { transform: translate(-4px, 2px) scale(0.99); }
              75% { transform: translate(2px, -1px) scale(1.01); }
              100% { opacity: 1; transform: translate(0,0) scale(1); }
            }
            .hero-subtitle {
              text-shadow: 0 0 10px rgba(233, 30, 140, 0.55);
            }
            .sound-neon-btn {
              box-shadow: 0 0 14px -2px rgba(244, 208, 63, 0.5);
            }
            .hero-eyebrow-emoji {
              font-size: 22px;
              line-height: 1;
              filter: drop-shadow(0 3px 8px rgba(0,0,0,0.5));
              animation: eyebrowEmojiFloat 3.2s ease-in-out infinite;
              display: inline-block;
            }
            .eyebrow-emoji-1 { animation-delay: 0s; }
            .eyebrow-emoji-2 { animation-delay: -0.8s; }
            .eyebrow-emoji-3 { animation-delay: -1.6s; }
            .eyebrow-emoji-4 { animation-delay: -2.4s; }
            @keyframes eyebrowEmojiFloat {
              0%, 100% { transform: translateY(0) rotate(-5deg); }
              50% { transform: translateY(-6px) rotate(5deg); }
            }
            /* Mismo "anillo de flujo de colores" animado que el avatar de
               DisplayCalled.jsx (.called-neon-ring) -- pedido explicito
               para reemplazar los bordes solidos (amarillo, morado) del QR,
               "Ya cantaron esta noche" y el logo por este mismo lenguaje
               visual. Tecnica padding+mask: el gradiente pinta un cuadrado
               completo, la mascara le quita el centro y deja solo el aro
               del grosor del padding. border-radius:inherit hace que el
               mismo anillo sirva para el QR (esquinas muy redondeadas), la
               caja de "ya cantaron" (esquinas normales) y el logo
               (pastilla completa) sin repetir la regla tres veces. */
            .queue-neon-ring {
              position: relative;
            }
            .queue-neon-ring::before {
              content: '';
              position: absolute;
              inset: 0;
              z-index: 1;
              border-radius: inherit;
              padding: 2.5px;
              box-sizing: border-box;
              background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
              background-size: 300% 300%;
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              pointer-events: none;
              animation: queueRingShift 5s linear infinite, queueRingGlowPulse 2.4s ease-in-out infinite;
            }
            @keyframes queueRingShift {
              0% { background-position: 0% 50%; }
              100% { background-position: 300% 50%; }
            }
            @keyframes queueRingGlowPulse {
              0%, 100% { filter: drop-shadow(0 0 8px rgba(233,30,140,0.4)) drop-shadow(0 0 14px rgba(139,92,246,0.28)); }
              50% { filter: drop-shadow(0 0 14px rgba(233,30,140,0.65)) drop-shadow(0 0 22px rgba(139,92,246,0.48)); }
            }
          `}</style>
        </div>

        <div className="min-h-0 h-full">
          <Backstage queue={queue} />
        </div>
      </main>
    </div>
  )
}

function SpeedTestModal(props) {
  var onClose = props.onClose
  var statusState = useState('testing')
  var status = statusState[0]
  var setStatus = statusState[1]
  var mbpsState = useState(null)
  var mbps = mbpsState[0]
  var setMbps = mbpsState[1]

  useEffect(function () {
    var cancelled = false
    var PARALLEL_CONNECTIONS = 6
    var BYTES_PER_CONNECTION = 4 * 1024 * 1024 // 4MB cada una, 24MB en total

    function runTest() {
      var startTime = performance.now()
      var requests = []
      for (var i = 0; i < PARALLEL_CONNECTIONS; i++) {
        requests.push(
          fetch('https://speed.cloudflare.com/__down?bytes=' + BYTES_PER_CONNECTION + '&i=' + i, { cache: 'no-store' })
            .then(function (res) { return res.arrayBuffer() })
        )
      }
      Promise.all(requests)
        .then(function (buffers) {
          if (cancelled) return
          var totalBytes = buffers.reduce(function (sum, b) { return sum + b.byteLength }, 0)
          var seconds = (performance.now() - startTime) / 1000
          var bits = totalBytes * 8
          var result = (bits / seconds) / 1000000
          setMbps(Math.round(result * 10) / 10)
          setStatus('done')
        })
        .catch(function () {
          if (!cancelled) setStatus('error')
        })
    }

    runTest()
    return function () { cancelled = true }
  }, [])

  function calidad(v) {
    if (v === null) return null
    if (v >= 15) return { label: 'Excelente para video en vivo', color: '#7ED957' }
    if (v >= 5) return { label: 'Suficiente, sin margen de sobra', color: '#F4D03F' }
    return { label: 'Puede cortarse el video', color: '#E9544A' }
  }

  var q = calidad(mbps)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border-2 px-8 py-9 text-center"
        style={{ borderColor: '#F4D03F', background: 'rgba(15,10,20,0.96)', boxShadow: '0 0 40px -8px rgba(244,208,63,0.5)' }}
        onClick={function (e) { e.stopPropagation() }}
      >
        <p className="text-2xl font-extrabold text-white mb-1">📶 Test de velocidad</p>
        <p className="text-sm text-neutral-400 mb-6">Conexión de esta pantalla</p>

        {status === 'testing' && (
          <>
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-t-transparent animate-spin mb-5" style={{ borderColor: '#8B5CF6', borderTopColor: 'transparent' }} />
            <p className="text-neutral-300 text-sm">Midiendo...</p>
          </>
        )}

        {status === 'done' && (
          <>
            <p className="text-6xl font-extrabold leading-none mb-2" style={{ color: '#F4D03F' }}>
              {mbps}
            </p>
            <p className="text-sm uppercase tracking-widest text-neutral-400 mb-4">Mbps de bajada</p>
            {q && (
              <p className="text-base font-bold mb-6" style={{ color: q.color }}>
                {q.label}
              </p>
            )}
          </>
        )}

        {status === 'error' && (
          <p className="text-base text-red-400 mb-6">No se pudo medir la velocidad. Revisa la conexión.</p>
        )}

        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
