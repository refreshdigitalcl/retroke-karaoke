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

export default function SessionHub() {
  var sessions = useActiveSessions()

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
              <a
                key={s.id}
                href={s.href}
                className="hub-card rounded-2xl border-2 border-purple-500 bg-neutral-950/85 px-6 py-6 flex items-center gap-4 no-underline"
                style={{ animationDelay: (i * 0.08) + 's' }}
              >
                <span className="text-4xl shrink-0">{icon}</span>
                <span className="min-w-0">
                  <p className="text-lg font-extrabold text-white truncate">{s.placeName}</p>
                  <p className="text-sm text-yellow-400 truncate">{s.name}</p>
                </span>
                <span className="ml-auto text-2xl text-purple-400 shrink-0">→</span>
              </a>
            )
          })}
        </div>
      )}

      <style>{`
        .hub-card {
          animation: hubCardIn 0.4s ease-out both;
          transition: transform 0.15s, box-shadow 0.15s;
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
