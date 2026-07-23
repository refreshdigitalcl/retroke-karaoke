import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ThemeToggle from '../components/ThemeToggle'

function LoginGate() {
  var auth = useAuth()
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]
  var sentState = useState(false)
  var sent = sentState[0]
  var setSent = sentState[1]
  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return
    auth.signInWithEmail(email.trim()).then(function (result) {
      if (result.error) {
        setError('No se pudo enviar el link. Intenta de nuevo.')
      } else {
        setSent(true)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Retroke Admin</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Ingresa tu correo de administrador
        </p>
        {sent ? (
          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>
            Revisa tu correo y haz clic en el link para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={function (e) { setEmail(e.target.value) }}
              placeholder="tu@correo.com"
              required
              className="w-full mb-3 h-11 rounded-lg px-3 border outline-none"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="w-full h-11 rounded-lg font-medium text-white"
              style={{ background: 'var(--accent-magenta)' }}
            >
              Enviar link de acceso
            </button>
            {error && <p className="text-sm mt-3" style={{ color: 'var(--accent-magenta)' }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Acceso restringido</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta no tiene permisos de administrador de la plataforma.
        </p>
      </div>
    </div>
  )
}

function Card(props) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {props.children}
    </div>
  )
}

function Dashboard(props) {
  var stats = props.stats
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>Bares activos</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.activeBars}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>Bares inactivos</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.inactiveBars}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>Sesiones activas</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.activeSessions}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>DJs asignados</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.djCount}</p>
      </Card>
    </div>
  )
}

function NewBarForm(props) {
  var onCreated = props.onCreated
  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]
  var slugState = useState('')
  var slug = slugState[0]
  var setSlug = slugState[1]
  var cityState = useState('')
  var city = cityState[0]
  var setCity = cityState[1]
  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  function handleNameChange(e) {
    var v = e.target.value
    setName(v)
    setSlug(
      v
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !slug.trim()) return
    supabase
      .from('bars')
      .insert({ name: name.trim(), slug: slug.trim(), city: city.trim(), is_active: true })
      .then(function (result) {
        if (result.error) {
          setError(result.error.message)
        } else {
          setName('')
          setSlug('')
          setCity('')
          onCreated()
        }
      })
  }

  return (
    <Card>
      <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>Nuevo bar</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Nombre del bar"
          required
          className="h-10 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <input
          type="text"
          value={slug}
          onChange={function (e) { setSlug(e.target.value) }}
          placeholder="identificador-unico"
          required
          className="h-10 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <input
          type="text"
          value={city}
          onChange={function (e) { setCity(e.target.value) }}
          placeholder="Ciudad (opcional)"
          className="h-10 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          className="h-10 rounded-lg font-medium text-white"
          style={{ background: 'var(--accent-magenta)' }}
        >
          Crear bar
        </button>
        {error && <p className="text-sm" style={{ color: 'var(--accent-magenta)' }}>{error}</p>}
      </form>
    </Card>
  )
}

function BarsList(props) {
  var bars = props.bars
  var onToggleActive = props.onToggleActive
  var onSelect = props.onSelect

  return (
    <Card>
      <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>Todos los bares</p>
      <div className="flex flex-col gap-2">
        {bars.map(function (b) {
          return (
            <div key={b.id} className="flex items-center justify-between rounded-lg py-2.5 px-3" style={{ background: 'var(--bg-card-alt)' }}>
              <button onClick={function () { onSelect(b) }} className="text-left flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.slug} {b.city ? '· ' + b.city : ''}</p>
              </button>
              <button
                onClick={function () { onToggleActive(b) }}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: b.is_active ? 'var(--accent-green)' : 'var(--border)',
                  color: b.is_active ? '#0a0a0a' : 'var(--text-muted)'
                }}
              >
                {b.is_active ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AddDjForm(props) {
  var barId = props.barId
  var onAdded = props.onAdded
  var emailState = useState('')
  var email = emailState[0]
  var setEmail = emailState[1]
  var roleState = useState('dj')
  var role = roleState[0]
  var setRole = roleState[1]

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    supabase
      .from('bar_members')
      .insert({ bar_id: barId, invited_email: email.trim(), role: role })
      .then(function () {
        setEmail('')
        onAdded()
      })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
      <input
        type="email"
        value={email}
        onChange={function (e) { setEmail(e.target.value) }}
        placeholder="correo del DJ"
        required
        className="flex-1 h-10 rounded-lg px-3 border outline-none"
        style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      />
      <select
        value={role}
        onChange={function (e) { setRole(e.target.value) }}
        className="h-10 rounded-lg px-3 border outline-none"
        style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        <option value="dj">DJ</option>
        <option value="bar_admin">Admin del bar</option>
      </select>
      <button type="submit" className="h-10 px-4 rounded-lg font-medium text-white" style={{ background: 'var(--accent-magenta)' }}>
        Agregar
      </button>
    </form>
  )
}

function BarDetail(props) {
  var bar = props.bar
  var onBack = props.onBack

  var membersState = useState([])
  var members = membersState[0]
  var setMembers = membersState[1]

  var sessionsState = useState([])
  var sessions = sessionsState[0]
  var setSessions = sessionsState[1]

  function loadMembers() {
    supabase
      .from('bar_members')
      .select('*')
      .eq('bar_id', bar.id)
      .then(function (result) {
        setMembers(result.data || [])
      })
  }

  function loadSessions() {
    supabase
      .from('sessions')
      .select('*')
      .eq('bar_id', bar.id)
      .order('started_at', { ascending: false })
      .limit(30)
      .then(function (result) {
        setSessions(result.data || [])
      })
  }

  useEffect(function () {
    loadMembers()
    loadSessions()
  }, [bar.id])

  function removeMember(id) {
    supabase
      .from('bar_members')
      .delete()
      .eq('id', id)
      .then(function () {
        loadMembers()
      })
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-sm self-start" style={{ color: 'var(--accent-purple)' }}>
        ← Volver a todos los bares
      </button>

      <Card>
        <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>{bar.slug}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{bar.name}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Estado: {bar.is_active ? 'Activo' : 'Inactivo'} {bar.city ? '· ' + bar.city : ''}
        </p>
      </Card>

      <Card>
        <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>DJs asignados</p>
        <AddDjForm barId={bar.id} onAdded={loadMembers} />
        <div className="flex flex-col gap-2">
          {members.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin DJs asignados todavia.</p>
          )}
          {members.map(function (m) {
            return (
              <div key={m.id} className="flex items-center justify-between rounded-lg py-2 px-3" style={{ background: 'var(--bg-card-alt)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{m.invited_email || m.user_id}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {m.role} {m.user_id ? '· vinculado' : '· invitacion pendiente'}
                  </p>
                </div>
                <button onClick={function () { removeMember(m.id) }} className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>
                  Quitar
                </button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>Sesiones</p>
        <div className="flex flex-col gap-2">
          {sessions.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aun no hay sesiones registradas.</p>
          )}
          {sessions.map(function (s) {
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg py-2 px-3" style={{ background: 'var(--bg-card-alt)' }}>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(s.started_at)}</p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: s.status === 'active' ? 'var(--accent-green)' : 'var(--border)',
                    color: s.status === 'active' ? '#0a0a0a' : 'var(--text-muted)'
                  }}
                >
                  {s.status}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default function AdminPanel() {
  var auth = useAuth()

  var barsState = useState([])
  var bars = barsState[0]
  var setBars = barsState[1]

  var statsState = useState({ activeBars: 0, inactiveBars: 0, activeSessions: 0, djCount: 0 })
  var stats = statsState[0]
  var setStats = statsState[1]

  var selectedBarState = useState(null)
  var selectedBar = selectedBarState[0]
  var setSelectedBar = selectedBarState[1]

  function loadEverything() {
    supabase
      .from('bars')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function (result) {
        var data = result.data || []
        setBars(data)
        var active = data.filter(function (b) { return b.is_active }).length
        setStats(function (prev) {
          return { ...prev, activeBars: active, inactiveBars: data.length - active }
        })
      })

    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then(function (result) {
        setStats(function (prev) {
          return { ...prev, activeSessions: result.count || 0 }
        })
      })

    supabase
      .from('bar_members')
      .select('id', { count: 'exact', head: true })
      .then(function (result) {
        setStats(function (prev) {
          return { ...prev, djCount: result.count || 0 }
        })
      })
  }

  useEffect(function () {
    if (auth.session && auth.isGlobalAdmin) {
      loadEverything()
    }
  }, [auth.session, auth.isGlobalAdmin])

  function toggleActive(bar) {
    supabase
      .from('bars')
      .update({ is_active: !bar.is_active })
      .eq('id', bar.id)
      .then(function () {
        loadEverything()
      })
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!auth.session) {
    return <LoginGate />
  }

  if (!auth.isGlobalAdmin) {
    return <NotAuthorized />
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      <header className="flex items-center justify-between mb-6">
        <p className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Retroke Admin</p>
        <div className="flex items-center gap-3">
          <button
            onClick={function () { auth.signOut() }}
            className="text-sm px-3 h-9 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Salir
          </button>
          <ThemeToggle />
        </div>
      </header>

      {selectedBar ? (
        <BarDetail bar={selectedBar} onBack={function () { setSelectedBar(null); loadEverything() }} />
      ) : (
        <div className="flex flex-col gap-6">
          <Dashboard stats={stats} />
          <NewBarForm onCreated={loadEverything} />
          <BarsList bars={bars} onToggleActive={toggleActive} onSelect={setSelectedBar} />
        </div>
      )}
    </div>
  )
}
