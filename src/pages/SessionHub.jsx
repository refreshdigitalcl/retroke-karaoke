import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'

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

  function handlePick(s) {
    if (s.pin) {
      setSelected(s)
    } else {
      window.location.href = s.href
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 py-12 bg-black">
      <RetroEqualizer />
      <FloatingDecor />

      <p className="relative z-10 text-xs tracking-[8px] uppercase text-purple-400 mb-3">
        Retroke Karaoke
      </p>
      <h1 className="relative z-10 text-3xl md:text-5xl font-extrabold text-white mb-2 text-center">
        Elige la sala para mostrar
      </h1>
      <p className="relative z-10 text-sm text-neutral-400 mb-10 text-center">
        Toca una sala activa para abrir su pantalla aqui
      </p>

      {sessions === null && (
        <p className="relative z-10 text-neutral-500">Buscando salas activas...</p>
      )}

      {sessions !== null && sessions.length === 0 && (
        <div className="relative z-10 max-w-sm rounded-3xl border-2 border-purple-500/40 bg-neutral-950/70 px-8 py-8 text-center">
          <p className="text-4xl mb-3">🎤</p>
          <p className="text-neutral-300">
            No hay ninguna sala activa en este momento. Cuando un DJ inicie una sesion, va a aparecer aqui automaticamente.
          </p>
        </div>
      )}

      {sessions !== null && sessions.length > 0 && (
        <div className="relative z-10 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sessions.map(function (s, i) {
            var icon = s.kind === 'home' ? '🏠' : s.kind === 'dj' ? '🎧' : '🎤'
            return (
              <button
                key={s.id}
                onClick={function () { handlePick(s) }}
                className="hub-card rounded-2xl border-2 border-purple-500 bg-neutral-950/85 px-6 py-6 flex items-center gap-4 text-left"
                style={{ animationDelay: (i * 0.08) + 's' }}
              >
                <span className="text-4xl shrink-0">{icon}</span>
                <span className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold text-white truncate">{s.placeName}</p>
                  <p className="text-sm text-yellow-400 truncate">{s.name}</p>
                </span>
                {s.pin && <span className="text-lg shrink-0">🔒</span>}
                <span className="text-2xl text-purple-400 shrink-0">→</span>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <PinGate session={selected} onCancel={function () { setSelected(null) }} />
      )}

      <style>{`
        .hub-card {
          animation: hubCardIn 0.4s ease-out both;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .hub-card:hover, .hub-card:focus {
          transform: scale(1.02);
          box-shadow: 0 0 24px 4px rgba(139, 92, 246, 0.4);
        }
        @keyframes hubCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
