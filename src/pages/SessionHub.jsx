import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'

function saveRoom(href) {
  try {
    localStorage.setItem('retroke_last_room', href)
  } catch (e) {}
}

function useActiveSessions() {
  var listState = useState(null)
  var list = listState[0]
  var setList = listState[1]

  useEffect(function () {
    var cancelled = false

    function load() {
      supabase
        .from('sessions')
        .select('*, bars(name, slug), workspaces(name, type)')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .then(function (result) {
          if (cancelled) return
          var rows = result.data || []
          var mapped = rows.map(function (r) {
            var isBar = !!r.bars
            return {
              id: r.id,
              name: r.name,
              pin: r.pin || null,
              placeName: isBar ? r.bars.name : (r.workspaces ? r.workspaces.name : 'Sin nombre'),
              kind: isBar ? 'bar' : (r.workspaces && r.workspaces.type === 'HOME' ? 'home' : 'dj'),
              href: isBar ? '/?bar=' + r.bars.slug : '/?ws=' + r.workspace_id
            }
          })
          setList(mapped)
        })
        .catch(function () {
          if (!cancelled) setList([])
        })
    }

    load()
    var interval = setInterval(load, 12000)
    return function () {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return list
}

function PinGate(props) {
  var session = props.session
  var onCancel = props.onCancel

  var digitsState = useState(['', '', '', ''])
  var digits = digitsState[0]
  var setDigits = digitsState[1]

  var errorState = useState(false)
  var error = errorState[0]
  var setError = errorState[1]

  function updateDigit(index, value) {
    var clean = value.replace(/\D/g, '').slice(0, 1)
    var next = digits.slice()
    next[index] = clean
    setDigits(next)
    setError(false)

    if (clean && index < 3) {
      var el = document.getElementById('pin-digit-' + (index + 1))
      if (el) el.focus()
    }

    if (clean && index === 3) {
      var fullPin = next.join('')
      if (fullPin.length === 4) {
        checkPin(fullPin, next)
      }
    }
  }

  function checkPin(fullPin, digitsUsed) {
    if (fullPin === session.pin) {
      saveRoom(session.href)
      window.location.href = session.href
    } else {
      setError(true)
      setDigits(['', '', '', ''])
      var el = document.getElementById('pin-digit-0')
      if (el) el.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/85 backdrop-blur-sm">
      <div className="max-w-xs w-full rounded-3xl border-2 border-purple-500 bg-neutral-950 px-7 py-8 text-center pin-gate-in">
        <p className="text-lg font-extrabold text-white mb-1">{session.placeName}</p>
        <p className="text-sm text-yellow-400 mb-6">{session.name}</p>
        <p className="text-sm text-neutral-400 mb-4">
          Pide el PIN de 4 digitos al DJ
        </p>
        <div className="flex justify-center gap-2.5 mb-4">
          {digits.map(function (d, i) {
            return (
              <input
                key={i}
                id={'pin-digit-' + i}
                type="text"
                inputMode="numeric"
                value={d}
                autoFocus={i === 0}
                onChange={function (e) { updateDigit(i, e.target.value) }}
                onKeyDown={function (e) {
                  if (e.key === 'Backspace' && !d && i > 0) {
                    var el = document.getElementById('pin-digit-' + (i - 1))
                    if (el) el.focus()
                  }
                }}
                className="w-12 h-14 text-2xl text-center rounded-xl border-2 font-extrabold text-white outline-none"
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  borderColor: error ? '#E9544A' : 'rgba(139, 92, 246, 0.4)'
                }}
              />
            )
          })}
        </div>
        {error && (
          <p className="text-sm mb-2" style={{ color: '#E9544A' }}>
            PIN incorrecto, intenta de nuevo
          </p>
        )}
        <button
          onClick={onCancel}
          className="text-xs underline text-neutral-500 mt-3"
        >
          Volver a la lista de salas
        </button>
      </div>
      <style>{`
        .pin-gate-in { animation: pinGateIn 0.25s ease-out; }
        @keyframes pinGateIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

var HUB_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'

export default function SessionHub() {
  var sessions = useActiveSessions()

  useEffect(function () {
    if (document.querySelector('link[data-hub-fonts]')) return
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = HUB_FONTS_HREF
    link.setAttribute('data-hub-fonts', 'true')
    document.head.appendChild(link)
  }, [])

  useEffect(function () {
    var played = false
    var audio = new Audio('/sounds/welcome.mp3')
    var timeoutId = null

    function playOnce() {
      if (played) return
      played = true
      audio.play().catch(function () {})
      document.removeEventListener('pointerdown', playOnce)
      document.removeEventListener('keydown', playOnce)
    }

    timeoutId = setTimeout(playOnce, 3000)
    document.addEventListener('pointerdown', playOnce)
    document.addEventListener('keydown', playOnce)

    return function () {
      clearTimeout(timeoutId)
      document.removeEventListener('pointerdown', playOnce)
      document.removeEventListener('keydown', playOnce)
    }
  }, [])

  var selectedState = useState(null)
  var selected = selectedState[0]
  var setSelected = selectedState[1]

  var queryState = useState('')
  var query = queryState[0]
  var setQuery = queryState[1]

  var filteredSessions = sessions
    ? sessions.filter(function (s) {
        if (!query.trim()) return true
        var q = query.trim().toLowerCase()
        return (s.placeName && s.placeName.toLowerCase().indexOf(q) !== -1) ||
          (s.name && s.name.toLowerCase().indexOf(q) !== -1)
      })
    : null

  function handlePick(s) {
    if (s.pin) {
      setSelected(s)
    } else {
      saveRoom(s.href)
      window.location.href = s.href
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 pt-28 pb-12 bg-black">
      <RetroEqualizer />
      <FloatingDecor />
      <div className="hub-scanlines" aria-hidden="true" />

      <nav
        className="fixed top-0 inset-x-0 z-40 flex items-center justify-center gap-6 md:gap-10 px-6 py-4"
        style={{ background: 'rgba(8,4,14,0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(139,92,246,0.25)' }}
      >
        <a
          href="/inicio"
          className="text-xs md:text-sm tracking-[3px] uppercase font-bold text-neutral-300 transition-colors hub-nav-link"
        >
          Inicio
        </a>
        <a
          href="/precios"
          className="text-xs md:text-sm tracking-[3px] uppercase font-bold text-neutral-300 transition-colors hub-nav-link"
        >
          Planes y precios
        </a>
        <a
          href="/world"
          className="text-xs md:text-sm tracking-[3px] uppercase font-bold text-neutral-300 transition-colors hub-nav-link"
        >
          Retroke World
        </a>
      </nav>

      <img
        src="/landing/retroke-logo-oficial-neon.png"
        alt="Retroke"
        className="relative z-10 w-auto mb-3 hub-logo-in"
        style={{ height: 'clamp(120px, 20vh, 220px)' }}
      />

      <div className="relative z-10 flex flex-col items-center mb-10">
        <p className="hub-subtitle text-center">
          El karaoke cambió <span className="hub-subtitle-break">para siempre</span>
        </p>
        <p className="text-sm md:text-base text-neutral-400 mt-5 text-center">
          Toca una sala activa para abrir su pantalla aquí
        </p>
      </div>

      {sessions === null && (
        <p className="relative z-10 text-neutral-500">Buscando salas activas...</p>
      )}

      {sessions !== null && sessions.length > 0 && (
        <div className="relative z-10 w-full max-w-md mb-6">
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="🔍 Buscar sala por nombre..."
            className="w-full h-12 rounded-full px-5 text-sm outline-none"
            style={{
              background: 'rgba(20,10,30,0.85)',
              border: '2px solid rgba(139,92,246,0.5)',
              color: '#fff',
              boxShadow: '0 0 20px -4px rgba(139,92,246,0.6)'
            }}
          />
        </div>
      )}

      {sessions !== null && sessions.length === 0 && (
        <div className="relative z-10 max-w-sm rounded-3xl border-2 border-purple-500/40 bg-neutral-950/70 px-8 py-8 text-center">
          <p className="text-4xl mb-3">🎤</p>
          <p className="text-neutral-300">
            No hay ninguna sala activa en este momento. Cuando un DJ inicie una sesion, va a aparecer aqui automaticamente.
          </p>
        </div>
      )}

      {sessions !== null && sessions.length > 0 && filteredSessions.length === 0 && (
        <p className="relative z-10 text-neutral-500">No encontramos ninguna sala con ese nombre.</p>
      )}

      {filteredSessions !== null && filteredSessions.length > 0 && (
        <div className="relative z-10 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredSessions.map(function (s, i) {
            var icon = s.kind === 'home' ? '🏠' : s.kind === 'dj' ? '🎧' : '🎤'
            var accent = s.kind === 'home' ? '#7ED957' : s.kind === 'dj' ? '#F4D03F' : '#E91E8C'
            return (
              <button
                key={s.id}
                onClick={function () { handlePick(s) }}
                className="hub-card rounded-2xl px-6 py-6 flex items-center gap-4 text-left"
                style={{
                  animationDelay: (i * 0.08) + 's',
                  background: 'linear-gradient(135deg, rgba(20,12,28,0.9), rgba(10,6,14,0.9))',
                  border: '2px solid ' + accent + '55',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset'
                }}
              >
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
                  style={{ background: accent + '1a', border: '1.5px solid ' + accent + 'aa', boxShadow: '0 0 16px -2px ' + accent }}
                >
                  {icon}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold text-white truncate">{s.placeName}</p>
                  <p className="text-sm truncate" style={{ color: accent }}>{s.name}</p>
                </span>
                {s.pin && <span className="text-lg shrink-0">🔒</span>}
                <span className="text-2xl shrink-0" style={{ color: accent }}>→</span>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <PinGate session={selected} onCancel={function () { setSelected(null) }} />
      )}

      <a
        href="/downloads/retroke.apk"
        download
        className="apk-download-btn"
        title="Descargar la app de Retroke para Android"
      >
        <span className="apk-download-inner">
          <img src="/landing/retroke-mic-icon.png" alt="" className="apk-download-icon" />
          <span className="apk-download-text">
            <span className="apk-download-line1">Descarga</span>
            <span className="apk-download-line2">APK</span>
          </span>
        </span>
        <span className="apk-download-ring" />
      </a>

      <style>{`
        .hub-scanlines {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
        }
        .hub-logo-in {
          animation: hubLogoIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes hubLogoIn {
          from { opacity: 0; transform: scale(0.9) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .hub-subtitle {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          font-weight: 700;
          font-size: clamp(1.15rem, 2.8vw, 1.85rem);
          letter-spacing: 0.2px;
          line-height: 1.3;
          margin: 0;
          background: linear-gradient(100deg, #fff 12%, #E91E8C 32%, #8B5CF6 55%, #F4D03F 76%, #fff 96%);
          background-size: 260% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: hubSubtitleShift 7s ease-in-out infinite;
          filter: drop-shadow(0 2px 14px rgba(0,0,0,0.55));
        }
        .hub-subtitle-break {
          font-weight: 500;
          opacity: 0.88;
        }
        @keyframes hubSubtitleShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .hub-nav-link {
          text-decoration: none;
        }
        .hub-nav-link:hover, .hub-nav-link:focus {
          color: #fff;
          text-shadow: 0 0 10px rgba(139,92,246,0.7);
        }
        .hub-card {
          animation: hubCardIn 0.4s ease-out both;
          transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
          cursor: pointer;
        }
        .hub-card:hover, .hub-card:focus {
          transform: scale(1.02);
          filter: brightness(1.08);
          box-shadow: 0 0 28px 4px rgba(255, 255, 255, 0.1);
        }
        @keyframes hubCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .apk-download-btn {
          position: fixed;
          right: clamp(14px, 3vw, 32px);
          bottom: clamp(14px, 3vh, 32px);
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px 10px 12px;
          border-radius: 999px;
          text-decoration: none;
          background: linear-gradient(160deg, rgba(20,10,30,0.95), rgba(10,6,16,0.95));
          border: 2px solid rgba(233,30,140,0.7);
          box-shadow:
            0 0 18px 2px rgba(233,30,140,0.55),
            0 0 36px 6px rgba(139,92,246,0.35),
            0 10px 24px -10px rgba(0,0,0,0.8);
          animation: apkFloat3d 3.6s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 600px;
        }
        .apk-download-btn:hover {
          animation-play-state: paused;
          transform: rotateY(0deg) rotateX(0deg) translateY(-4px) scale(1.05);
          box-shadow:
            0 0 26px 4px rgba(233,30,140,0.8),
            0 0 48px 10px rgba(139,92,246,0.5),
            0 14px 28px -10px rgba(0,0,0,0.85);
        }
        @keyframes apkFloat3d {
          0%, 100% { transform: rotateY(-8deg) rotateX(3deg) translateY(0px); }
          25% { transform: rotateY(4deg) rotateX(-2deg) translateY(-6px); }
          50% { transform: rotateY(8deg) rotateX(3deg) translateY(0px); }
          75% { transform: rotateY(-4deg) rotateX(-2deg) translateY(-6px); }
        }
        .apk-download-inner {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .apk-download-icon {
          width: 34px;
          height: 34px;
          object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(233,30,140,0.9));
          animation: apkIconPulse 2.2s ease-in-out infinite;
        }
        @keyframes apkIconPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(233,30,140,0.9)); }
          50% { filter: drop-shadow(0 0 12px rgba(244,208,63,1)); }
        }
        .apk-download-text {
          display: flex;
          flex-direction: column;
          line-height: 1.05;
        }
        .apk-download-line1 {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #c3bcd4;
        }
        .apk-download-line2 {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1px;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #F4D03F);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: apkTextShimmer 3s linear infinite;
        }
        @keyframes apkTextShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        .apk-download-ring {
          position: absolute;
          inset: -3px;
          border-radius: 999px;
          border: 1.5px solid rgba(244,208,63,0.5);
          pointer-events: none;
          animation: apkRingPulse 2.2s ease-out infinite;
        }
        @keyframes apkRingPulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        @media (max-width: 480px) {
          .apk-download-line1 { font-size: 9px; }
          .apk-download-line2 { font-size: 14px; }
          .apk-download-icon { width: 28px; height: 28px; }
        }
      `}</style>
    </div>
  )
}
