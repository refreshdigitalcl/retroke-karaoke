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
  var debugInfo = props.debugInfo
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-lg w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Acceso restringido</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta no tiene permisos de administrador de la plataforma.
        </p>
        {debugInfo && (
          <div className="text-left text-xs rounded-lg p-3 mt-4 break-all" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-muted)' }}>
            <p>userId: {debugInfo.userId}</p>
            <p>userEmail: {debugInfo.userEmail}</p>
            <p>rawData: {debugInfo.rawData}</p>
            <p>rawError: {debugInfo.rawError}</p>
          </div>
        )}
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
            <option value="PREMIUM">PREMIUM</option>
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

var PLAN_OPTIONS = ['FREE', 'PRO', 'PREMIUM']

function WorkspaceRow(props) {
  var ws = props.ws
  var onChanged = props.onChanged

  var expiresState = useState(ws.expires_at ? ws.expires_at.slice(0, 10) : '')
  var expiresValue = expiresState[0]
  var setExpiresValue = expiresState[1]

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
    supabase
      .from('workspaces')
      .update({ expires_at: expiresValue ? expiresValue : null })
      .eq('id', ws.id)
      .then(function () { onChanged() })
  }

  function handleDelete() {
    if (!window.confirm('Eliminar "' + ws.name + '" para siempre? Esto no se puede deshacer.')) return
    setDeleteError('')
    setDeleting(true)

    supabase
      .from('bars')
      .select('id')
      .eq('workspace_id', ws.id)
      .then(function (barResult) {
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
        if (info.barId) {
          return supabase.from('bars').delete().eq('id', info.barId)
        }
        return { error: null }
      })
      .then(function (barDeleteResult) {
        if (barDeleteResult && barDeleteResult.error) {
          throw barDeleteResult.error
        }
        return supabase.from('workspaces').delete().eq('id', ws.id)
      })
      .then(function (wsDeleteResult) {
        setDeleting(false)
        if (wsDeleteResult && wsDeleteResult.error) {
          setDeleteError('No se pudo eliminar: ' + wsDeleteResult.error.message)
          return
        }
        onChanged()
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
          return
        }
        var publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
        var updates = [
          supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', ws.id),
          supabase.from('bars').update({ logo_url: publicUrl }).eq('workspace_id', ws.id)
        ]
        return Promise.all(updates)
      })
      .then(function () {
        setUploadingLogo(false)
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
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Vence:</span>
          <input
            type="date"
            value={expiresValue}
            onChange={function (e) { setExpiresValue(e.target.value) }}
            onBlur={saveExpiration}
            className="text-xs px-2 py-1 rounded-lg border outline-none"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
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
              {ws.owner_id ? 'Dueño vinculado (ID de usuario)' : 'Correo del dueño (pendiente de vincular)'}
            </label>
            {ws.owner_id ? (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                {ws.owner_id}
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
    return <NotAuthorized debugInfo={auth.debugInfo} />
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
          <WorkspacesList workspaces={workspaces} onChanged={loadEverything} />
          <NewWorkspaceForm onCreated={loadEverything} />
        </div>
      )}
    </div>
  )
}
