import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useMyBars(auth) {
  var barsState = useState(null)
  var bars = barsState[0]
  var setBars = barsState[1]

  useEffect(function () {
    if (!auth.session) {
      setBars(null)
      return
    }
    var cancelled = false

    Promise.all([
      supabase
        .from('bar_members')
        .select('role, bars(id, slug, name, is_active)')
        .eq('user_id', auth.session.user.id),
      supabase
        .from('workspace_members')
        .select('role, workspaces(id, name, type, status)')
        .eq('user_id', auth.session.user.id)
    ]).then(function (results) {
      if (cancelled) return
      var barRows = results[0].data || []
      var wsRows = results[1].data || []

      var seen = {}
      var list = []

      barRows.forEach(function (r) {
        if (!r.bars) return
        if (seen[r.bars.id]) return
        seen[r.bars.id] = true
        list.push({
          id: r.bars.id,
          slug: r.bars.slug,
          name: r.bars.name,
          isActive: r.bars.is_active,
          role: r.role,
          kind: 'bar'
        })
      })

      wsRows.forEach(function (r) {
        if (!r.workspaces) return
        if (r.workspaces.type === 'BAR') return
        var key = 'ws-' + r.workspaces.id
        if (seen[key]) return
        seen[key] = true
        list.push({
          id: r.workspaces.id,
          workspaceId: r.workspaces.id,
          name: r.workspaces.name,
          isActive: r.workspaces.status === 'ACTIVE',
          role: r.role,
          kind: r.workspaces.type === 'HOME' ? 'home' : 'dj'
        })
      })

      setBars(list)
    })

    return function () { cancelled = true }
  }, [auth.session])

  return bars
}

export default function WorkspaceSelector(props) {
  var bars = props.bars
  var notice = props.notice

  function goTo(bar) {
    if (bar.kind === 'bar') {
      window.location.href = '/dj?bar=' + bar.slug
    } else {
      window.location.href = '/dj?ws=' + bar.workspaceId
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-7 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Selecciona tu espacio
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Perteneces a mas de un espacio en Retroke
        </p>

        {notice && (
          <p className="text-xs mb-4" style={{ color: 'var(--accent-magenta)' }}>
            {notice}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {bars.map(function (bar) {
            var icon = bar.kind === 'dj' ? '🎧' : bar.kind === 'home' ? '🏠' : '🎤'
            return (
              <button
                key={bar.id}
                onClick={function () { goTo(bar) }}
                className="w-full h-14 rounded-xl border-2 flex items-center justify-between px-4"
                style={{ borderColor: 'var(--accent-purple)', background: 'var(--bg-card-alt)' }}
              >
                <span>
                  <p className="text-sm font-medium text-left" style={{ color: 'var(--text-primary)' }}>
                    {icon} {bar.name}
                  </p>
                  <p className="text-xs text-left" style={{ color: 'var(--text-muted)' }}>
                    {bar.role}
                  </p>
                </span>
                <span style={{ color: 'var(--accent-purple)' }}>→</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
