import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRetrokeFont } from '../lib/fonts'
import RetroNeonBg from '../components/RetroNeonBg'
import RetrokeEmptyState from '../components/retroke/RetrokeEmptyState'
import RetrokeSkeleton from '../components/retroke/RetrokeSkeleton'
import RetrokeIcon from '../components/retroke/RetrokeIcon'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'
import RetrokeNavbar from '../components/RetrokeNavbar'
import SelectionHero from '../components/SelectionHero'
import RoomExperienceCard from '../components/RoomExperienceCard'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingHeroFigure from '../components/FloatingHeroFigure'

// SessionHub -- rediseño maestro de la pantalla de seleccion (retroke.cl
// sin ?bar/?ws) y de la navegacion global. Ver conversacion "REDISEÑO
// MAESTRO DE EXPERIENCIA" -- transformacion visual, sin regresion
// funcional: toda la logica de abajo (useActiveSessions, PinGate,
// saveRoom, el sonido de bienvenida, el boton de descarga del APK) sigue
// siendo exactamente la misma que ya funcionaba, solo cambia la capa
// visual que la envuelve, ahora conectada al mismo sistema (Retroke
// Visual System 2.0 / tokens --rk-*) que ya usa Retroke World, en vez de
// tener su propio lenguaje aislado.

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

export default function SessionHub() {
  var sessions = useActiveSessions()

  useRetrokeFont()

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

  var activeCount = sessions === null ? null : sessions.length

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center px-5 sm:px-8 lg:px-14 pt-28 sm:pt-32 pb-12" style={{ background: 'var(--rk-bg-gradient, #05030a)' }}>
      <style>{RETROKE_STYLES}</style>
      <RetroNeonBg />
      <RetroEqualizer />

      <RetrokeNavbar active={null} />

      <div className="rk-hub-page">
        <div className="rk-hub-hero-wrap">
          <FloatingHeroFigure />
          <SelectionHero activeCount={activeCount} />
        </div>

        <div className="relative w-full flex flex-col items-center" style={{ zIndex: 1 }}>
          {sessions === null && (
            <div className="w-full max-w-sm">
              <RetrokeSkeleton lines={3} />
            </div>
          )}

          {sessions !== null && sessions.length > 0 && (
            <div className="w-full max-w-md mb-7">
              <div className="rk-hub-search">
                <RetrokeIcon name="search" size={16} className="rk-hub-search-icon" />
                <input
                  type="text"
                  value={query}
                  onChange={function (e) { setQuery(e.target.value) }}
                  placeholder="Ingresa el nombre de tu sala para ingresar"
                />
              </div>
            </div>
          )}

          {sessions !== null && sessions.length === 0 && (
            <div className="w-full max-w-sm">
              <RetrokeEmptyState
                icon={<RetrokeIcon name="mic" size={30} glow />}
                message="No hay ninguna sala activa en este momento. Cuando un DJ inicie una sesion, va a aparecer aqui automaticamente."
              />
            </div>
          )}

          {sessions !== null && sessions.length > 0 && filteredSessions.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--rk-text-faint)' }}>No encontramos ninguna sala con ese nombre.</p>
          )}

          {filteredSessions !== null && filteredSessions.length > 0 && (
            <div
              className={'rk-hub-grid' + (filteredSessions.length > 1 ? ' has-multiple' : '')}
            >
              {filteredSessions.map(function (s, i) {
                return (
                  <RoomExperienceCard
                    key={s.id}
                    session={s}
                    index={i}
                    variant={filteredSessions.length === 1 ? 'hero' : 'default'}
                    onSelect={handlePick}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

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
        .rk-hub-page {
          position: relative;
          width: 100%;
          max-width: 1280px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .rk-hub-hero-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 860px;
          min-height: 420px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-bottom: 36px;
        }
        @media (min-width: 1024px) {
          .rk-hub-hero-wrap { max-width: 980px; min-height: 520px; padding-bottom: 44px; }
        }

        .rk-hub-grid {
          width: 100%;
          max-width: 1180px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          padding-bottom: 16px;
        }
        .rk-hub-grid:not(.has-multiple) {
          max-width: 560px;
        }
        @media (min-width: 640px) {
          .rk-hub-grid.has-multiple { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .rk-hub-grid.has-multiple { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1440px) {
          .rk-hub-grid.has-multiple { grid-template-columns: repeat(4, 1fr); }
        }

        .rk-hub-search {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rk-hub-search-icon {
          position: absolute;
          left: 18px;
          color: var(--rk-text-faint, rgba(255,255,255,0.4));
          pointer-events: none;
        }
        .rk-hub-search input {
          width: 100%;
          height: 48px;
          border-radius: var(--rk-radius-pill, 999px);
          padding: 0 20px 0 44px;
          font-size: 14px;
          outline: none;
          color: #fff;
          background: var(--rk-surface, rgba(255,255,255,0.045));
          border: 1px solid var(--rk-border-strong, rgba(255,255,255,0.18));
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .rk-hub-search input::placeholder {
          color: var(--rk-text-faint, rgba(255,255,255,0.4));
        }
        .rk-hub-search input:focus {
          border-color: rgba(139,92,246,0.6);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.18);
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
