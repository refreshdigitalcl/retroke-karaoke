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

function NotAuthorized(props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-lg w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Acceso restringido</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
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

function NewWorkspaceForm(props) {
  var onCreated = props.onCreated
  var typeState = useState('BAR')
  var type = typeState[0]
  var setType = typeState[1]
  var nameState = useState('')
  var name = nameState[0]
  var setName = nameState[1]
  var slugState = useState('')
  var slug = slugState[0]
  var setSlug = slugState[1]
  var cityState = useState('')
  var city = cityState[0]
  var setCity = cityState[1]
  var planState = useState('FREE')
  var plan = planState[0]
  var setPlan = planState[1]
  var ownerEmailState = useState('')
  var ownerEmail = ownerEmailState[0]
  var setOwnerEmail = ownerEmailState[1]
  var logoFileState = useState(null)
  var logoFile = logoFileState[0]
  var setLogoFile = logoFileState[1]
  var logoPreviewState = useState(null)
  var logoPreview = logoPreviewState[0]
  var setLogoPreview = logoPreviewState[1]
  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  function handleLogoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function uploadLogoIfNeeded(workspaceId, barId) {
    if (!logoFile) return Promise.resolve()
    var ext = logoFile.name.split('.').pop()
    var path = 'logo-' + Date.now() + '.' + ext
    return supabase.storage
      .from('logos')
      .upload(path, logoFile, { upsert: true })
      .then(function (result) {
        if (result.error) return
        var publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
        var updates = [supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', workspaceId)]
        if (barId) updates.push(supabase.from('bars').update({ logo_url: publicUrl }).eq('id', barId))
        return Promise.all(updates)
      })
  }

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
    if (!name.trim()) return
    if (type === 'BAR' && !slug.trim()) return

    var normalizedSlug = slug
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    var settings = ownerEmail.trim() ? { pending_owner_email: ownerEmail.trim() } : {}

    supabase
      .from('workspaces')
      .insert({ type: type, name: name.trim(), plan: plan, status: 'ACTIVE', settings: settings })
      .select()
      .single()
      .then(function (wsResult) {
        if (wsResult.error) {
          setError(wsResult.error.message)
          return
        }
        if (type !== 'BAR') {
          uploadLogoIfNeeded(wsResult.data.id, null).then(function () {
            setName('')
            setOwnerEmail('')
            setLogoFile(null)
            setLogoPreview(null)
            onCreated()
          })
          return
        }
        supabase
          .from('bars')
          .insert({
            name: name.trim(),
            slug: normalizedSlug,
            city: city.trim(),
            is_active: true,
            workspace_id: wsResult.data.id
          })
          .select()
          .single()
          .then(function (barResult) {
            if (barResult.error) {
              setError('Workspace creado, pero el bar fallo: ' + barResult.error.message)
              return
            }
            uploadLogoIfNeeded(wsResult.data.id, barResult.data.id).then(function () {
              setName('')
              setSlug('')
              setCity('')
              setOwnerEmail('')
              setLogoFile(null)
              setLogoPreview(null)
              onCreated()
            })
          })
      })
  }

  return (
    <Card>
      <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>
        Nuevo Workspace
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={function (e) { setType(e.target.value) }}
            className="h-10 rounded-lg px-3 border outline-none"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="BAR">Bar</option>
            <option value="DJ">DJ Pro</option>
            <option value="HOME">Home</option>
          </select>
          <select
            value={plan}
            onChange={function (e) { setPlan(e.target.value) }}
            className="h-10 rounded-lg px-3 border outline-none"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
          </select>
        </div>
        <input
          type="text"
          value={name}
          onChange={type === 'BAR' ? handleNameChange : function (e) { setName(e.target.value) }}
          placeholder={type === 'BAR' ? 'Nombre del bar' : 'Nombre (ej: Carlos DJ Pro)'}
          required
          className="h-10 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        {type === 'BAR' && (
          <>
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
          </>
        )}
        <input
          type="email"
          value={ownerEmail}
          onChange={function (e) { setOwnerEmail(e.target.value) }}
          placeholder="Correo del dueño (opcional, vincular despues)"
          className="h-10 rounded-lg px-3 border outline-none"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <label
          className="flex items-center gap-3 h-10 rounded-lg px-3 border cursor-pointer"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)' }}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
          ) : (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>📷</span>
          )}
          <span className="text-sm truncate" style={{ color: logoFile ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {logoFile ? logoFile.name : 'Logo (opcional)'}
          </span>
          <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg font-medium text-white"
          style={{ background: 'var(--accent-purple)' }}
        >
          Crear Workspace
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

var PLAN_OPTIONS = ['FREE', 'PRO']

function daysUntil(dateStr) {
  if (!dateStr) return null
  var diffMs = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function WorkspaceRow(props) {
  var ws = props.ws
  var onChanged = props.onChanged
  var auth = useAuth()

  var ownerEmailRealState = useState(null)
  var ownerEmailReal = ownerEmailRealState[0]
  var setOwnerEmailReal = ownerEmailRealState[1]

  function callAdminUsersApi(action, userId) {
    var token = auth.session ? auth.session.access_token : ''
    return fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ action: action, user_id: userId })
    }).then(function (res) { return res.json() })
  }

  useEffect(function () {
    if (!ws.owner_id) return
    callAdminUsersApi('get_email', ws.owner_id).then(function (data) {
      setOwnerEmailReal(data && data.email ? data.email : null)
    })
  }, [ws.owner_id])

  var subscriptionState = useState(undefined)
  var subscription = subscriptionState[0]
  var setSubscription = subscriptionState[1]

  var expiresState = useState('')
  var expiresValue = expiresState[0]
  var setExpiresValue = expiresState[1]

  useEffect(function () {
    supabase
      .from('subscriptions')
      .select('id, status, expires_at, renews_at, provider')
      .eq('workspace_id', ws.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(function (result) {
        setSubscription(result.data || null)
        setExpiresValue(result.data && result.data.expires_at ? result.data.expires_at.slice(0, 10) : '')
      })
  }, [ws.id])

  var uploadingLogoState = useState(false)
  var uploadingLogo = uploadingLogoState[0]
  var setUploadingLogo = uploadingLogoState[1]

  var deletingState = useState(false)
  var deleting = deletingState[0]
  var setDeleting = deletingState[1]

  var deleteErrorState = useState('')
  var deleteError = deleteErrorState[0]
  var setDeleteError = deleteErrorState[1]

  function changePlan(newPlan) {
    supabase
      .from('workspaces')
      .update({ plan: newPlan })
      .eq('id', ws.id)
      .then(function () { onChanged() })
  }

  function toggleStatus() {
    var nextStatus = ws.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    supabase
      .from('workspaces')
      .update({ status: nextStatus })
      .eq('id', ws.id)
      .then(function () { onChanged() })
  }

  function saveExpiration() {
    if (!subscription) return
    supabase
      .from('subscriptions')
      .update({ expires_at: expiresValue ? expiresValue : null })
      .eq('id', subscription.id)
      .then(function () { onChanged() })
  }

  function handleDelete() {
    setDeleteError('')

    supabase
      .from('subscriptions')
      .select('id, status')
      .eq('workspace_id', ws.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(function (subResult) {
        var currentSub = subResult.data
        var hasLiveSub = currentSub && (currentSub.status === 'active' || currentSub.status === 'trial')
        var message = hasLiveSub
          ? 'Este cliente tiene una suscripcion ' + (currentSub.status === 'trial' ? 'de prueba' : 'ACTIVA') + ' en "' + ws.name + '". Si lo eliminas, pierde el acceso de inmediato y no se puede deshacer. Quieres eliminarlo de todas formas?'
          : 'Eliminar "' + ws.name + '" para siempre? Esto no se puede deshacer.'

        if (!window.confirm(message)) return null

        setDeleting(true)

        return supabase
          .from('subscriptions')
          .select('id')
          .eq('workspace_id', ws.id)
          .then(function (allSubsResult) {
            var subIds = (allSubsResult.data || []).map(function (s) { return s.id })
            var subCleanup = []
            if (subIds.length > 0) {
              subCleanup.push(supabase.from('payment_transactions').delete().in('subscription_id', subIds))
              subCleanup.push(supabase.from('billing_events').delete().in('subscription_id', subIds))
            }
            return Promise.all(subCleanup)
          })
          .then(function () {
            return supabase.from('licenses').delete().eq('workspace_id', ws.id)
          })
          .then(function () {
            return supabase.from('subscriptions').delete().eq('workspace_id', ws.id)
          })
          .then(function () {
            return supabase.from('workspace_members').delete().eq('workspace_id', ws.id)
          })
          .then(function () {
            return supabase
              .from('bars')
              .select('id')
              .eq('workspace_id', ws.id)
          })
      })
      .then(function (barResult) {
        if (!barResult) return null
        var barId = barResult.data && barResult.data[0] ? barResult.data[0].id : null
        var sessionQuery = barId
          ? supabase.from('sessions').select('id').eq('bar_id', barId)
          : supabase.from('sessions').select('id').eq('workspace_id', ws.id)

        return sessionQuery.then(function (sessionResult) {
          var sessionIds = (sessionResult.data || []).map(function (s) { return s.id })
          if (sessionIds.length === 0) return { barId: barId, error: null }

          return supabase.from('queue_entries').select('id').in('session_id', sessionIds).then(function (qeResult) {
            var entryIds = (qeResult.data || []).map(function (q) { return q.id })
            var cleanup = [
              supabase.from('ratings').delete().in('session_id', sessionIds),
              supabase.from('reactions').delete().in('session_id', sessionIds)
            ]
            if (entryIds.length > 0) {
              cleanup.push(supabase.from('vocal_results').delete().in('queue_entry_id', entryIds))
            }
            return Promise.all(cleanup)
              .then(function () {
                return supabase.from('queue_entries').delete().in('session_id', sessionIds)
              })
              .then(function () {
                return supabase.from('sessions').delete().in('id', sessionIds)
              })
              .then(function () {
                return { barId: barId, error: null }
              })
          })
        })
      })
      .then(function (info) {
        if (!info) return null
        if (info.barId) {
          return supabase.from('bars').delete().eq('id', info.barId)
        }
        return { error: null }
      })
      .then(function (barDeleteResult) {
        if (!barDeleteResult) return null
        if (barDeleteResult.error) {
          throw barDeleteResult.error
        }
        return supabase.from('workspaces').delete().eq('id', ws.id)
      })
      .then(function (wsDeleteResult) {
        if (!wsDeleteResult) {
          setDeleting(false)
          return
        }
        if (wsDeleteResult.error) {
          setDeleting(false)
          setDeleteError('No se pudo eliminar: ' + wsDeleteResult.error.message)
          return
        }
        if (ws.owner_id) {
          return callAdminUsersApi('delete_user', ws.owner_id).then(function () {
            setDeleting(false)
            onChanged()
          })
        }
        setDeleting(false)
        onChanged()
      })
      .catch(function (err) {
        setDeleting(false)
        setDeleteError('No se pudo eliminar: ' + (err && err.message ? err.message : 'error desconocido'))
      })
      .catch(function (err) {
        setDeleting(false)
        setDeleteError('No se pudo eliminar: ' + (err && err.message ? err.message : 'error desconocido'))
      })
  }

  function handleLogoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setUploadingLogo(true)
    var ext = file.name.split('.').pop()
    var path = 'logo-' + ws.id + '-' + Date.now() + '.' + ext
    supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })
      .then(function (result) {
        if (result.error) {
          setUploadingLogo(false)
          setDeleteError('No se pudo subir la imagen: ' + result.error.message)
          return
        }
        var publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
        // Este logo es el de la MARCA del workspace, no el de un local puntual.
        // Cada local (bar) administra su propio logo por separado, para que
        // varios locales bajo el mismo workspace no queden todos iguales.
        return supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', ws.id)
      })
      .then(function (result) {
        setUploadingLogo(false)
        if (result && result.error) {
          setDeleteError('No se pudo guardar el logo: ' + result.error.message)
          return
        }
        onChanged()
      })
  }

  var createdLabel = ws.created_at ? new Date(ws.created_at).toLocaleDateString('es-CL') : '—'

  var showDetailState = useState(false)
  var showDetail = showDetailState[0]
  var setShowDetail = showDetailState[1]

  var nameValueState = useState(ws.name)
  var nameValue = nameValueState[0]
  var setNameValue = nameValueState[1]

  var ownerEmailValueState = useState(ws.settings && ws.settings.pending_owner_email ? ws.settings.pending_owner_email : '')
  var ownerEmailValue = ownerEmailValueState[0]
  var setOwnerEmailValue = ownerEmailValueState[1]

  var savingDetailState = useState(false)
  var savingDetail = savingDetailState[0]
  var setSavingDetail = savingDetailState[1]

  function saveDetails() {
    setSavingDetail(true)
    var newSettings = Object.assign({}, ws.settings || {})
    if (ownerEmailValue.trim()) {
      newSettings.pending_owner_email = ownerEmailValue.trim()
    } else {
      delete newSettings.pending_owner_email
    }
    supabase
      .from('workspaces')
      .update({ name: nameValue.trim() || ws.name, settings: newSettings })
      .eq('id', ws.id)
      .then(function () {
        setSavingDetail(false)
        onChanged()
      })
  }

  return (
    <div className="rounded-lg py-3 px-3" style={{ background: 'var(--bg-card-alt)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm shrink-0"
            style={{ background: 'var(--accent-purple)' }}
          >
            {ws.logo_url ? (
              <img src={ws.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              '🎤'
            )}
          </div>
          <div>
            <button
              onClick={function () { setShowDetail(!showDetail) }}
              className="text-sm font-medium underline decoration-dotted"
              style={{ color: 'var(--text-primary)' }}
            >
              {ws.name}
            </button>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {ws.type}
              {' · '}
              <span style={{ color: ws.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--accent-magenta)' }}>
                {ws.status}
              </span>
              {' · creado ' + createdLabel}
              {!ws.owner_id && ws.settings && ws.settings.pending_owner_email && (
                <span style={{ color: 'var(--accent-yellow)' }}>
                  {' · dueño pendiente: ' + ws.settings.pending_owner_email}
                </span>
              )}
              {!ws.owner_id && (!ws.settings || !ws.settings.pending_owner_email) && (
                <span style={{ color: 'var(--text-muted)' }}> · sin dueño asignado</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PLAN_OPTIONS.map(function (p) {
            var isCurrent = ws.plan === p || ws.plan === p.toLowerCase()
            return (
              <button
                key={p}
                onClick={function () { changePlan(p) }}
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: isCurrent ? 'var(--accent-magenta)' : 'var(--border)',
                  background: isCurrent ? 'var(--accent-magenta)' : 'transparent',
                  color: isCurrent ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={toggleStatus}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {ws.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2.5 py-1 rounded-full border disabled:opacity-50"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            {deleting ? 'Eliminando...' : '🗑️ Eliminar'}
          </button>
        </div>
      </div>

      {deleteError && (
        <p className="text-xs mt-2" style={{ color: 'var(--accent-magenta)' }}>{deleteError}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        {subscription === undefined && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cargando suscripción...</span>
        )}

        {subscription === null && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin suscripción registrada</span>
        )}

        {subscription && !subscription.expires_at && (
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(126,217,87,0.12)', color: 'var(--accent-green)' }}>
            ✓ Plan gratis, sin vencimiento
          </span>
        )}

        {subscription && subscription.expires_at && (function () {
          var days = daysUntil(subscription.expires_at)
          var color = days === null ? 'var(--text-muted)' : days < 0 ? 'var(--accent-magenta)' : days <= 5 ? '#F4D03F' : 'var(--accent-green)'
          var label = days === null ? '' : days < 0 ? 'Vencida hace ' + Math.abs(days) + ' días' : days === 0 ? 'Vence hoy' : 'Vence en ' + days + ' días'
          return (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: color, border: '1px solid ' + color }}>
              {new Date(subscription.expires_at).toLocaleDateString('es-CL')} · {label}
            </span>
          )
        })()}

        {subscription && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ajustar:</span>
            <input
              type="date"
              value={expiresValue}
              onChange={function (e) { setExpiresValue(e.target.value) }}
              onBlur={saveExpiration}
              className="text-xs px-2 py-1 rounded-lg border outline-none"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        <label
          className="text-xs cursor-pointer font-medium px-2.5 py-1 rounded-full border"
          style={{ borderColor: 'var(--border)', color: 'var(--accent-purple)' }}
        >
          {uploadingLogo ? 'Subiendo logo...' : ws.logo_url ? 'Cambiar logo' : '📷 Agregar logo'}
          <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo} className="hidden" />
        </label>
      </div>

      {showDetail && (
        <div className="flex flex-col gap-2.5 mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--accent-yellow)' }}>
            Detalle del cliente
          </p>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Nombre</label>
            <input
              type="text"
              value={nameValue}
              onChange={function (e) { setNameValue(e.target.value) }}
              className="w-full h-9 rounded-lg px-3 border outline-none text-sm"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
              {ws.owner_id ? 'Correo del dueño' : 'Correo del dueño (pendiente de vincular)'}
            </label>
            {ws.owner_id ? (
              <p className="text-sm px-3 py-2 rounded-lg font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {ownerEmailReal === null ? 'Cargando...' : ownerEmailReal || 'No se pudo obtener el correo'}
              </p>
            ) : (
              <input
                type="email"
                value={ownerEmailValue}
                onChange={function (e) { setOwnerEmailValue(e.target.value) }}
                placeholder="correo@ejemplo.com"
                className="w-full h-9 rounded-lg px-3 border outline-none text-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            )}
          </div>
          <button
            onClick={saveDetails}
            disabled={savingDetail}
            className="h-9 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-purple)' }}
          >
            {savingDetail ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}

function PlanRow(props) {
  var plan = props.plan
  var onChanged = props.onChanged

  var priceState = useState(plan.price_monthly)
  var price = priceState[0]
  var setPrice = priceState[1]

  var trialState = useState(plan.trial_days)
  var trial = trialState[0]
  var setTrial = trialState[1]

  var savingState = useState(false)
  var saving = savingState[0]
  var setSaving = savingState[1]

  function save() {
    setSaving(true)
    supabase
      .from('plans')
      .update({ price_monthly: Number(price) || 0, trial_days: Number(trial) || 0 })
      .eq('id', plan.id)
      .then(function () {
        setSaving(false)
        onChanged()
      })
  }

  function toggleActive() {
    supabase
      .from('plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id)
      .then(function () { onChanged() })
  }

  return (
    <div className="rounded-lg py-2.5 px-3 flex items-center gap-3 flex-wrap" style={{ background: 'var(--bg-card-alt)' }}>
      <p className="text-sm font-medium w-28 shrink-0" style={{ color: 'var(--text-primary)' }}>
        {plan.name}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>$</span>
        <input
          type="number"
          value={price}
          onChange={function (e) { setPrice(e.target.value) }}
          className="w-24 h-8 rounded-lg px-2 text-xs border outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/mes</span>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={trial}
          onChange={function (e) { setTrial(e.target.value) }}
          className="w-14 h-8 rounded-lg px-2 text-xs border outline-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>dias prueba</span>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="text-xs px-3 py-1.5 rounded-full font-medium text-white disabled:opacity-50"
        style={{ background: 'var(--accent-purple)' }}
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        onClick={toggleActive}
        className="text-xs px-3 py-1.5 rounded-full border"
        style={{ borderColor: 'var(--border)', color: plan.is_active ? 'var(--accent-green)' : 'var(--text-muted)' }}
      >
        {plan.is_active ? '✓ Visible en precios' : 'Oculto'}
      </button>
    </div>
  )
}

var STORE_CATEGORIES = [
  { id: 'microfonos', label: '🎤 Micrófonos' },
  { id: 'parlantes', label: '🔊 Parlantes y sets' },
  { id: 'luces', label: '✨ Luces' }
]

function formatCLP(digitsOnly) {
  if (!digitsOnly) return ''
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

var MAX_PRODUCT_IMAGES = 10

function StoreProductForm(props) {
  var editing = props.editing
  var onSaved = props.onSaved
  var onCancel = props.onCancel

  var nameState = useState(editing ? editing.name : '')
  var name = nameState[0]
  var setName = nameState[1]

  var descState = useState(editing ? (editing.description || '') : '')
  var description = descState[0]
  var setDescription = descState[1]

  var longDescState = useState(editing ? (editing.long_description || '') : '')
  var longDescription = longDescState[0]
  var setLongDescription = longDescState[1]

  // El precio se guarda como numero puro (389000), pero se muestra
  // siempre formateado con puntos de miles (389.000) para que no se
  // confunda con decimales al escribir.
  var priceDigitsState = useState(editing ? String(editing.price) : '')
  var priceDigits = priceDigitsState[0]
  var setPriceDigits = priceDigitsState[1]

  function handlePriceChange(e) {
    var digitsOnly = e.target.value.replace(/[^0-9]/g, '')
    setPriceDigits(digitsOnly)
  }

  var categoryState = useState(editing ? editing.category : 'microfonos')
  var category = categoryState[0]
  var setCategory = categoryState[1]

  var inStockState = useState(editing ? editing.in_stock : true)
  var inStock = inStockState[0]
  var setInStock = inStockState[1]

  var imagesState = useState(editing && editing.images && editing.images.length ? editing.images : (editing && editing.image_url ? [editing.image_url] : []))
  var images = imagesState[0]
  var setImages = imagesState[1]

  var specsState = useState(editing && editing.specs ? editing.specs : [])
  var specs = specsState[0]
  var setSpecs = specsState[1]

  var highlightsState = useState(editing && editing.highlights ? editing.highlights : [])
  var highlights = highlightsState[0]
  var setHighlights = highlightsState[1]

  var mlUrlState = useState('')
  var mlUrl = mlUrlState[0]
  var setMlUrl = mlUrlState[1]

  var pastedTextState = useState('')
  var pastedText = pastedTextState[0]
  var setPastedText = pastedTextState[1]

  function handleParseText() {
    if (!pastedText.trim()) return
    setError('')

    var rawLines = pastedText
      .split(/\r?\n|\s*\|\s*|\s*·\s*/)
      .map(function (l) { return l.trim() })
      .filter(Boolean)

    var parsedSpecs = []
    var parsedHighlights = []
    var i = 0
    while (i < rawLines.length) {
      var line = rawLines[i]
      var colonIdx = line.indexOf(':')
      if (colonIdx > 0 && colonIdx < 60) {
        var label = line.slice(0, colonIdx).trim()
        var value = line.slice(colonIdx + 1).trim()
        if (value) {
          parsedSpecs.push({ label: label, value: value, group: null })
          i += 1
          continue
        }
      }
      // Sin ":" en la misma linea: puede ser un par label/value en dos
      // lineas seguidas (comun al copiar tablas), o una frase suelta
      // (la tratamos como punto destacado).
      var next = rawLines[i + 1]
      if (next && line.length < 40 && !/^[✔️•\-]/.test(line) && next.length < 60) {
        parsedSpecs.push({ label: line, value: next, group: null })
        i += 2
        continue
      }
      if (line.length > 3 && line.length < 140) {
        parsedHighlights.push(line.replace(/^[✔️•\-]\s*/, ''))
      }
      i += 1
    }

    if (parsedSpecs.length === 0 && parsedHighlights.length === 0) {
      setError('No logramos reconocer nada en ese texto. Prueba copiando directamente el bloque de "Características" de la página.')
      return
    }

    if (parsedSpecs.length > 0) {
      setSpecs(function (prev) { return [...prev, ...parsedSpecs] })
    }
    if (parsedHighlights.length > 0) {
      setHighlights(function (prev) { return [...prev, ...parsedHighlights].slice(0, 12) })
    }
    setPastedText('')
  }

  var importingState = useState(false)
  var importing = importingState[0]
  var setImporting = importingState[1]

  var uploadingState = useState(false)
  var uploading = uploadingState[0]
  var setUploading = uploadingState[1]

  var savingState = useState(false)
  var saving = savingState[0]
  var setSaving = savingState[1]

  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  function handleImagesChange(e) {
    var files = Array.from(e.target.files || [])
    if (!files.length) return
    var room = MAX_PRODUCT_IMAGES - images.length
    if (room <= 0) {
      setError('Máximo ' + MAX_PRODUCT_IMAGES + ' fotos por producto.')
      return
    }
    files = files.slice(0, room)
    setUploading(true)
    setError('')
    Promise.all(
      files.map(function (file) {
        var ext = file.name.split('.').pop()
        var path = 'product-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext
        return supabase.storage.from('products').upload(path, file, { upsert: true }).then(function (result) {
          if (result.error) return null
          return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
        })
      })
    ).then(function (urls) {
      setUploading(false)
      var valid = urls.filter(Boolean)
      setImages(function (prev) { return [...prev, ...valid].slice(0, MAX_PRODUCT_IMAGES) })
    })
  }

  function removeImage(idx) {
    setImages(function (prev) { return prev.filter(function (_, i) { return i !== idx }) })
  }

  function addSpecRow() {
    setSpecs(function (prev) { return [...prev, { label: '', value: '' }] })
  }
  function updateSpecRow(idx, field, val) {
    setSpecs(function (prev) { return prev.map(function (s, i) { return i === idx ? { ...s, [field]: val } : s }) })
  }
  function removeSpecRow(idx) {
    setSpecs(function (prev) { return prev.filter(function (_, i) { return i !== idx }) })
  }

  function addHighlightRow() {
    setHighlights(function (prev) { return [...prev, ''] })
  }
  function updateHighlightRow(idx, val) {
    setHighlights(function (prev) { return prev.map(function (h, i) { return i === idx ? val : h }) })
  }
  function removeHighlightRow(idx) {
    setHighlights(function (prev) { return prev.filter(function (_, i) { return i !== idx }) })
  }

  function handleImportFromML() {
    if (!mlUrl.trim()) return
    setImporting(true)
    setError('')
    fetch('/api/import-mercadolibre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: mlUrl.trim() })
    })
      .then(function (r) { return r.json() })
      .then(function (data) {
        setImporting(false)
        if (data.error) {
          setError(data.error)
          return
        }
        if (data.name) setName(data.name)
        if (data.description) setDescription(data.description.slice(0, 200))
        if (data.description) setLongDescription(data.description)
        if (data.images && data.images.length) {
          setImages(function (prev) {
            var merged = [...prev, ...data.images]
            var unique = merged.filter(function (u, i) { return merged.indexOf(u) === i })
            return unique.slice(0, MAX_PRODUCT_IMAGES)
          })
        }
        if (data.specs && data.specs.length) setSpecs(data.specs)
        if (typeof data.in_stock === 'boolean') setInStock(data.in_stock)
      })
      .catch(function () {
        setImporting(false)
        setError('No se pudo importar desde ese link.')
      })
  }

  function handleSubmit() {
    if (!name.trim() || !priceDigits) return
    setSaving(true)
    setError('')
    var payload = {
      name: name.trim(),
      description: description.trim() || null,
      long_description: longDescription.trim() || null,
      price: parseInt(priceDigits, 10) || 0,
      category: category,
      in_stock: inStock,
      images: images,
      image_url: images[0] || null,
      specs: specs.filter(function (s) { return s.label && s.value }),
      highlights: highlights.filter(function (h) { return h && h.trim() }),
      source_url: mlUrl.trim() || (editing ? editing.source_url : null) || null
    }
    var query = editing
      ? supabase.from('store_products').update(payload).eq('id', editing.id)
      : supabase.from('store_products').insert(payload)

    query.then(function (result) {
      setSaving(false)
      if (result.error) {
        setError('No se pudo guardar: ' + result.error.message)
        return
      }
      onSaved()
    })
  }

  return (
    <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--accent-purple)', background: 'var(--bg-card-alt)' }}>
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
        {editing ? 'Editar producto' : 'Nuevo producto'}
      </p>

      <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-card)', border: '1px dashed var(--accent-yellow)' }}>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--accent-yellow)' }}>
          ⚡ Importar desde Mercado Libre (link)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={mlUrl}
            onChange={function (e) { setMlUrl(e.target.value) }}
            placeholder="Pega el link del producto en MercadoLibre"
            className="h-9 flex-1 rounded-lg px-3 border outline-none text-xs"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleImportFromML}
            disabled={importing || !mlUrl.trim()}
            className="text-xs px-3 rounded-lg font-medium text-white disabled:opacity-50 whitespace-nowrap"
            style={{ background: 'var(--accent-yellow)', color: '#0a0a0a' }}
          >
            {importing ? 'Leyendo...' : 'Importar'}
          </button>
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Mercado Libre bloquea la lectura automática de sus páginas, así que esto puede fallar seguido. Si falla,
          usa la opción de pegar texto de abajo — es más confiable.
        </p>
      </div>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Trae nombre, fotos, descripción y ficha técnica automáticamente. Revisa y ajusta el precio de venta después.
        </p>
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-card)', border: '1px dashed var(--accent-purple)' }}>
        <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent-purple)' }}>
          📋 O pega el texto de "Características" (más confiable)
        </p>
        <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
          Mercado Libre bloquea la lectura automática por link, así que esta vía es más segura: en la página del
          producto, selecciona y copia el bloque de "Características del producto" completo, y pégalo aquí.
        </p>
        <textarea
          value={pastedText}
          onChange={function (e) { setPastedText(e.target.value) }}
          placeholder="Pega aquí el texto de características copiado desde MercadoLibre..."
          rows={3}
          className="w-full rounded-lg px-3 py-2 border outline-none text-xs resize-none mb-2"
          style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={handleParseText}
          disabled={!pastedText.trim()}
          className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent-purple)' }}
        >
          Analizar texto
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <input
          type="text"
          value={name}
          onChange={function (e) { setName(e.target.value) }}
          placeholder="Nombre del producto"
          className="h-10 rounded-lg px-3 border outline-none text-sm"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <textarea
          value={description}
          onChange={function (e) { setDescription(e.target.value) }}
          placeholder="Descripción corta (se muestra en la tarjeta del producto)"
          rows={2}
          className="rounded-lg px-3 py-2 border outline-none text-sm resize-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <textarea
          value={longDescription}
          onChange={function (e) { setLongDescription(e.target.value) }}
          placeholder="Descripción completa (se muestra en la ficha del producto)"
          rows={4}
          className="rounded-lg px-3 py-2 border outline-none text-sm resize-none"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />

        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCLP(priceDigits)}
                onChange={handlePriceChange}
                placeholder="Precio de venta"
                className="h-10 w-full rounded-lg pl-7 pr-3 border outline-none text-sm"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Precio final en pesos chilenos (CLP)</p>
          </div>
          <select
            value={category}
            onChange={function (e) { setCategory(e.target.value) }}
            className="h-10 rounded-lg px-3 border outline-none text-sm"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {STORE_CATEGORIES.map(function (c) {
              return <option key={c.id} value={c.id}>{c.label}</option>
            })}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={inStock} onChange={function (e) { setInStock(e.target.checked) }} />
          Con stock disponible
        </label>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Fotos ({images.length}/{MAX_PRODUCT_IMAGES}) — sube al menos 5 para una buena ficha
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {images.map(function (url, idx) {
              return (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={function () { removeImage(idx) }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
            {images.length < MAX_PRODUCT_IMAGES && (
              <label
                className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer text-xs"
                style={{ borderColor: 'var(--border)', color: 'var(--accent-purple)' }}
              >
                {uploading ? '...' : '📷 +'}
                <input type="file" accept="image/*" multiple onChange={handleImagesChange} disabled={uploading} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Puntos destacados (bullets junto al precio)</p>
            <button onClick={addHighlightRow} className="text-xs font-medium" style={{ color: 'var(--accent-purple)' }}>+ Agregar</button>
          </div>
          {highlights.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-1">
              {highlights.map(function (h, idx) {
                return (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      value={h}
                      onChange={function (e) { updateHighlightRow(idx, e.target.value) }}
                      placeholder="Ej: Hasta 15 horas de reproducción"
                      className="h-8 flex-1 rounded-md px-2 border outline-none text-xs"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={function () { removeHighlightRow(idx) }} className="text-xs px-1.5" style={{ color: 'var(--accent-magenta)' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ficha técnica</p>
            <button onClick={addSpecRow} className="text-xs font-medium" style={{ color: 'var(--accent-purple)' }}>+ Agregar</button>
          </div>
          {specs.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-1">
              {specs.map(function (s, idx) {
                return (
                  <div key={idx} className="flex gap-1.5">
                    <input
                      value={s.label}
                      onChange={function (e) { updateSpecRow(idx, 'label', e.target.value) }}
                      placeholder="Característica"
                      className="h-8 flex-1 rounded-md px-2 border outline-none text-xs"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <input
                      value={s.value}
                      onChange={function (e) { updateSpecRow(idx, 'value', e.target.value) }}
                      placeholder="Valor"
                      className="h-8 flex-1 rounded-md px-2 border outline-none text-xs"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={function () { removeSpecRow(idx) }} className="text-xs px-1.5" style={{ color: 'var(--accent-magenta)' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: 'var(--accent-magenta)' }}>{error}</p>}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 h-10 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading || !name.trim() || !priceDigits}
            className="flex-1 h-10 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-purple)' }}
          >
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StoreManager() {
  var productsState = useState(null)
  var products = productsState[0]
  var setProducts = productsState[1]

  var showFormState = useState(false)
  var showForm = showFormState[0]
  var setShowForm = showFormState[1]

  var editingState = useState(null)
  var editing = editingState[0]
  var setEditing = editingState[1]

  var whatsappState = useState('')
  var whatsapp = whatsappState[0]
  var setWhatsapp = whatsappState[1]

  var shippingFeeState = useState('')
  var shippingFee = shippingFeeState[0]
  var setShippingFee = shippingFeeState[1]

  var freeShippingState = useState('')
  var freeShippingThreshold = freeShippingState[0]
  var setFreeShippingThreshold = freeShippingState[1]

  var savingWhatsappState = useState(false)
  var savingWhatsapp = savingWhatsappState[0]
  var setSavingWhatsapp = savingWhatsappState[1]

  var ordersState = useState(null)
  var orders = ordersState[0]
  var setOrders = ordersState[1]

  var ORDER_STATUS_LABELS = { pending: '⏳ Pendiente', paid: '✅ Pagado', shipped: '📦 Enviado', cancelled: '✕ Cancelado' }

  function loadOrders() {
    supabase
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function (result) { setOrders(result.data || []) })
  }

  function handleUpdateOrderStatus(order, status) {
    supabase.from('store_orders').update({ status: status }).eq('id', order.id).then(loadOrders)
  }

  function load() {
    supabase
      .from('store_products')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false })
      .then(function (result) {
        setProducts(result.data || [])
      })
    supabase
      .from('store_settings')
      .select('whatsapp_number, shipping_flat_fee, free_shipping_threshold')
      .eq('id', 1)
      .maybeSingle()
      .then(function (result) {
        if (result.data) {
          setWhatsapp(result.data.whatsapp_number || '')
          setShippingFee(String(result.data.shipping_flat_fee))
          setFreeShippingThreshold(String(result.data.free_shipping_threshold))
        }
      })
    loadOrders()
  }

  useEffect(function () { load() }, [])

  function handleToggleActive(p) {
    supabase.from('store_products').update({ is_active: !p.is_active }).eq('id', p.id).then(load)
  }

  function handleDelete(p) {
    if (!window.confirm('¿Eliminar "' + p.name + '" para siempre? Esto no se puede deshacer.')) return
    supabase.from('store_products').delete().eq('id', p.id).then(load)
  }

  function handleSaveWhatsapp() {
    setSavingWhatsapp(true)
    supabase
      .from('store_settings')
      .update({
        whatsapp_number: whatsapp.trim(),
        shipping_flat_fee: parseInt(shippingFee, 10) || 0,
        free_shipping_threshold: parseInt(freeShippingThreshold, 10) || 0
      })
      .eq('id', 1)
      .then(function () { setSavingWhatsapp(false) })
  }


  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>WhatsApp y envío</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Los clientes usan este número para consultar por un producto desde /tienda.
        </p>
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            value={whatsapp}
            onChange={function (e) { setWhatsapp(e.target.value) }}
            placeholder="+56912345678"
            className="h-10 rounded-lg px-3 border outline-none text-sm"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2.5">
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Costo de envío (CLP)</p>
              <input
                type="number"
                value={shippingFee}
                onChange={function (e) { setShippingFee(e.target.value) }}
                className="h-10 w-full rounded-lg px-3 border outline-none text-sm"
                style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Envío gratis desde (CLP)</p>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={function (e) { setFreeShippingThreshold(e.target.value) }}
                className="h-10 w-full rounded-lg px-3 border outline-none text-sm"
                style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveWhatsapp}
            disabled={savingWhatsapp}
            className="h-10 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-purple)' }}
          >
            {savingWhatsapp ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>Pedidos ({orders ? orders.length : 0})</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Cuando un pedido queda "Pagado", cómpralo en Mercado Libre y despáchalo a la
          dirección del cliente. Marca "Enviado" cuando lo hayas hecho.
        </p>
        {orders === null ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Todavía no hay pedidos.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {orders.map(function (o) {
              return (
                <div key={o.id} className="rounded-lg p-3" style={{ background: 'var(--bg-card-alt)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{o.customer_name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                      {ORDER_STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {o.items.map(function (it) { return it.quantity + 'x ' + it.name }).join(', ')}
                  </p>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    📍 {o.shipping_address}, {o.shipping_city}, {o.shipping_region}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    📞 {o.customer_phone} {o.customer_email ? '· ' + o.customer_email : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: 'var(--accent-yellow)' }}>
                      ${o.total.toLocaleString('es-CL')}
                    </p>
                    {o.status === 'paid' && (
                      <button
                        onClick={function () { handleUpdateOrderStatus(o, 'shipped') }}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium text-white"
                        style={{ background: 'var(--accent-purple)' }}
                      >
                        Marcar enviado
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase" style={{ color: 'var(--accent-yellow)' }}>Productos ({products ? products.length : 0})</p>
          {!showForm && (
            <button
              onClick={function () { setEditing(null); setShowForm(true) }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
              style={{ background: 'var(--accent-purple)' }}
            >
              ➕ Agregar producto
            </button>
          )}
        </div>

        {showForm && (
          <StoreProductForm
            editing={editing}
            onCancel={function () { setShowForm(false); setEditing(null) }}
            onSaved={function () { setShowForm(false); setEditing(null); load() }}
          />
        )}

        {products === null ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        ) : products.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Todavía no tienes productos.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map(function (p) {
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg p-2.5" style={{ background: 'var(--bg-card-alt)' }}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                    {(p.images && p.images[0]) || p.image_url ? <img src={(p.images && p.images[0]) || p.image_url} alt="" className="w-full h-full object-cover" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      ${p.price.toLocaleString('es-CL')} · {STORE_CATEGORIES.find(function (c) { return c.id === p.category })?.label || p.category}
                      {!p.in_stock && ' · Sin stock'}
                    </p>
                  </div>
                  <button
                    onClick={function () { handleToggleActive(p) }}
                    className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                    style={{
                      background: p.is_active ? 'var(--accent-green)' : 'var(--border)',
                      color: p.is_active ? '#0a0a0a' : 'var(--text-muted)'
                    }}
                  >
                    {p.is_active ? 'Visible' : 'Oculto'}
                  </button>
                  <button
                    onClick={function () { setEditing(p); setShowForm(true) }}
                    className="text-xs px-2.5 py-1 rounded-lg border shrink-0"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={function () { handleDelete(p) }}
                    className="text-xs px-2.5 py-1 rounded-lg border shrink-0"
                    style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function PlansManager() {
  var plansState = useState(null)
  var plans = plansState[0]
  var setPlans = plansState[1]

  function load() {
    supabase
      .from('plans')
      .select('*')
      .order('workspace_type')
      .order('sort_order')
      .then(function (result) {
        setPlans(result.data || [])
      })
  }

  useEffect(function () {
    load()
  }, [])

  var groups = ['HOME', 'BAR', 'DJ']

  return (
    <Card>
      <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>
        💳 Planes y precios
      </p>
      {plans === null && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
      )}
      {plans !== null && (
        <div className="flex flex-col gap-5">
          {groups.map(function (type) {
            var items = plans.filter(function (p) { return p.workspace_type === type })
            if (items.length === 0) return null
            return (
              <div key={type}>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {type === 'HOME' ? '🏠 Home' : type === 'BAR' ? '🍹 Bar' : '🎧 DJ Pro'}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map(function (p) {
                    return <PlanRow key={p.id} plan={p} onChanged={load} />
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function WorkspacesList(props) {
  var workspaces = props.workspaces
  var onChanged = props.onChanged

  var groups = [
    { type: 'BAR', label: '🍹 Bares' },
    { type: 'DJ', label: '🎧 DJ Pro' },
    { type: 'HOME', label: '🏠 Home' }
  ]

  return (
    <Card>
      <p className="text-xs uppercase mb-3" style={{ color: 'var(--accent-yellow)' }}>
        Workspaces ({workspaces.length})
      </p>
      {workspaces.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aun no hay workspaces.</p>
      )}
      <div className="flex flex-col gap-6">
        {groups.map(function (g) {
          var items = workspaces.filter(function (ws) { return ws.type === g.type })
          if (items.length === 0) return null
          return (
            <div key={g.type}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                {g.label} ({items.length})
              </p>
              <div className="flex flex-col gap-2">
                {items.map(function (ws) {
                  return <WorkspaceRow key={ws.id} ws={ws} onChanged={onChanged} />
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
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

  var workspacesState = useState([])
  var workspaces = workspacesState[0]
  var setWorkspaces = workspacesState[1]

  var activeTabState = useState('resumen')
  var activeTab = activeTabState[0]
  var setActiveTab = activeTabState[1]

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

    supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function (result) {
        setWorkspaces(result.data || [])
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

  var TABS = [
    { id: 'resumen', label: '📊 Resumen' },
    { id: 'clientes', label: '👥 Clientes (' + workspaces.length + ')' },
    { id: 'planes', label: '💳 Planes' },
    { id: 'tienda', label: '🛍️ Tienda' },
    { id: 'nuevo', label: '➕ Nuevo' }
  ]

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
        <div>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {TABS.map(function (t) {
              var isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={function () { setActiveTab(t.id) }}
                  className="text-sm px-4 h-10 rounded-full font-medium transition-colors"
                  style={{
                    background: isActive ? 'var(--accent-purple)' : 'var(--bg-card)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid ' + (isActive ? 'var(--accent-purple)' : 'var(--border)')
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'resumen' && <Dashboard stats={stats} />}
          {activeTab === 'clientes' && <WorkspacesList workspaces={workspaces} onChanged={loadEverything} />}
          {activeTab === 'planes' && <PlansManager />}
          {activeTab === 'tienda' && <StoreManager />}
          {activeTab === 'nuevo' && <NewWorkspaceForm onCreated={function () { loadEverything(); setActiveTab('clientes') }} />}
        </div>
      )}
    </div>
  )
}
