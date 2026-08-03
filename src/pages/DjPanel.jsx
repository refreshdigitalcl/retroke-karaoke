import { Component, useEffect, useRef, useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import { useAuth } from '../contexts/AuthContext'
import { checkYoutubeEmbeddable } from '../components/YouTubePlayer'
import SimilarTrackSearch from '../components/SimilarTrackSearch'
import WorkspaceSelector, { useMyBars } from '../components/WorkspaceSelector'
import ThemeToggle from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'

function ProfileTab(props) {
  var auth = props.auth
  var workspacePlan = props.workspacePlan
  var onBack = props.onBack
  var session = useKaraokeSession()
  var workspaceType = session.workspaceType

  var loadingState = useState(true)
  var loading = loadingState[0]
  var setLoading = loadingState[1]

  var savingState = useState(false)
  var saving = savingState[0]
  var setSaving = savingState[1]

  var savedState = useState(false)
  var saved = savedState[0]
  var setSaved = savedState[1]

  var avatarUrlState = useState('')
  var avatarUrl = avatarUrlState[0]
  var setAvatarUrl = avatarUrlState[1]

  var displayNameState = useState('')
  var displayName = displayNameState[0]
  var setDisplayName = displayNameState[1]

  var addressState = useState('')
  var address = addressState[0]
  var setAddress = addressState[1]

  var phoneState = useState('')
  var phone = phoneState[0]
  var setPhone = phoneState[1]

  var uploadingState = useState(false)
  var uploadingAvatar = uploadingState[0]
  var setUploadingAvatar = uploadingState[1]

  var profileErrorState = useState('')
  var profileError = profileErrorState[0]
  var setProfileError = profileErrorState[1]

  useEffect(function () {
    if (!auth.session) return
    supabase
      .from('profiles')
      .select('avatar_url, display_name, address, phone')
      .eq('id', auth.session.user.id)
      .maybeSingle()
      .then(function (result) {
        var p = result.data
        if (p) {
          setAvatarUrl(p.avatar_url || '')
          setDisplayName(p.display_name || '')
          setAddress(p.address || '')
          setPhone(p.phone || '')
        }
        setLoading(false)
      })
  }, [auth.session])

  function handleAvatarChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    setProfileError('')
    var ext = file.name.split('.').pop()
    var path = auth.session.user.id + '-' + Date.now() + '.' + ext
    supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
      .then(function (result) {
        if (result.error) {
          setUploadingAvatar(false)
          setProfileError('No se pudo subir la foto: ' + result.error.message)
          return
        }
        var publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
        setAvatarUrl(publicUrl)
        var chain = supabase
          .from('profiles')
          .upsert({ id: auth.session.user.id, avatar_url: publicUrl })

        // La foto de perfil funciona a la vez como logo del local en la
        // sala de espera, para no tener dos lugares distintos donde
        // subir "lo mismo".
        if (workspaceType === 'BAR' && session.hasFeature('custom_branding')) {
          chain = chain.then(function () {
            return session.updateLogo(publicUrl)
          })
        }

        return chain
      })
      .then(function (saveResult) {
        setUploadingAvatar(false)
        if (saveResult && saveResult.error) {
          setProfileError('La foto se subió pero no se pudo guardar: ' + saveResult.error.message)
        }
      })
      .catch(function (err) {
        setUploadingAvatar(false)
        setProfileError('Error inesperado: ' + (err && err.message ? err.message : ''))
      })
  }

  function handleSave() {
    setSaving(true)
    setSaved(false)
    setProfileError('')
    supabase
      .from('profiles')
      .upsert({
        id: auth.session.user.id,
        avatar_url: avatarUrl || null,
        display_name: displayName.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null
      })
      .then(function (result) {
        setSaving(false)
        if (result.error) {
          setProfileError('No se pudo guardar: ' + result.error.message)
          return
        }
        setSaved(true)
        setTimeout(function () { setSaved(false) }, 2000)
      })
  }

  var planLabel = workspacePlan === 'PREMIUM' ? '👑 PREMIUM' : workspacePlan === 'PRO' ? '⭐ PRO' : 'FREE'
  var planColor =
    workspacePlan === 'PREMIUM' ? '#F4D03F' :
    workspacePlan === 'PRO' ? '#8B5CF6' :
    'var(--text-muted)'
  var planBg =
    workspacePlan === 'PREMIUM' ? 'rgba(244, 208, 63, 0.14)' :
    workspacePlan === 'PRO' ? 'rgba(139, 92, 246, 0.14)' :
    'var(--bg-card-alt)'

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="text-sm mb-6 underline"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Volver al panel
        </button>

        <div className="rounded-2xl border p-6 mb-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}>
          <p className="text-xs uppercase tracking-wide mb-4" style={{ color: 'var(--accent-yellow)' }}>
            Mi perfil
          </p>

          {loading ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-2">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-3xl shrink-0"
                  style={{ background: 'var(--accent-purple)' }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    '🎧'
                  )}
                </div>
                <label
                  className="text-sm cursor-pointer font-medium px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--accent-purple)' }}
                >
                  {uploadingAvatar ? 'Guardando foto...' : avatarUrl ? 'Cambiar foto' : '📷 Subir foto'}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="hidden" />
                </label>
              </div>
              {workspaceType === 'BAR' && session.hasFeature('custom_branding') && (
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Esta imagen también se usa como logo de tu local en la sala de espera.
                </p>
              )}
              {workspaceType === 'BAR' && !session.hasFeature('custom_branding') && (
                <p className="text-xs mb-2" style={{ color: 'var(--accent-yellow)' }}>
                  Con el plan PRO, esta imagen se muestra también como logo de tu local en la sala de espera.
                </p>
              )}

              {profileError && (
                <p className="text-xs mb-4" style={{ color: 'var(--accent-magenta)' }}>{profileError}</p>
              )}

              <div className="flex flex-col gap-3 mt-4">
                <input
                  type="text"
                  value={displayName}
                  onChange={function (e) { setDisplayName(e.target.value) }}
                  placeholder="Tu nombre"
                  className="h-11 rounded-lg px-3 border outline-none"
                  style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <input
                  type="text"
                  value={address}
                  onChange={function (e) { setAddress(e.target.value) }}
                  placeholder="Dirección"
                  className="h-11 rounded-lg px-3 border outline-none"
                  style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <input
                  type="text"
                  value={phone}
                  onChange={function (e) { setPhone(e.target.value) }}
                  placeholder="Teléfono"
                  className="h-11 rounded-lg px-3 border outline-none"
                  style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Correo: {auth.session.user.email}
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 mt-5 rounded-xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
              >
                {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>

        <div className="rounded-2xl border p-6 text-center" style={{ background: planBg, borderColor: planColor }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Plan actual
          </p>
          <p className="text-3xl font-extrabold" style={{ color: planColor }}>
            {planLabel}
          </p>
        </div>
      </div>
    </div>
  )
}


function VocalScoreBadge(props) {
  var queueEntryId = props.queueEntryId

  var resultState = useState(null)
  var result = resultState[0]
  var setResult = resultState[1]

  useEffect(function () {
    if (!queueEntryId) return
    setResult(null)
    var cancelled = false
    var attempts = 0

    function tryFetch() {
      supabase
        .from('vocal_results')
        .select('final_score, pitch_score, rhythm_score, stability_score, energy_score, feedback')
        .eq('queue_entry_id', queueEntryId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(function (res) {
          if (cancelled) return
          if (res.data) {
            setResult(res.data)
          } else if (attempts < 15) {
            attempts++
            setTimeout(tryFetch, 2000)
          }
        })
    }
    tryFetch()

    return function () { cancelled = true }
  }, [queueEntryId])

  if (!result) {
    return (
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        🎙️ Esperando puntaje Retroke...
      </p>
    )
  }

  return (
    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.35)' }}>
      <span className="text-sm font-bold" style={{ color: '#F4D03F' }}>⭐ {result.final_score}/100</span>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        🎯{result.pitch_score} 🥁{result.rhythm_score} 🎵{result.stability_score} 🔥{result.energy_score}
      </span>
    </div>
  )
}

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
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Panel del DJ
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Ingresa tu correo para recibir tu link de acceso
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
            {error && (
              <p className="text-sm mt-3" style={{ color: 'var(--accent-magenta)' }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

function StartSessionGate(props) {
  var barName = props.barName
  var barIsActive = props.barIsActive
  var startSession = props.startSession
  var workspaceType = props.workspaceType
  var workspacePlan = props.workspacePlan
  var workspaceId = props.workspaceId
  var auth = useAuth()

  var isDjFree = workspaceType === 'DJ' && workspacePlan === 'FREE'
  var DJ_FREE_MONTHLY_LIMIT = 2

  var monthlyCountState = useState(null)
  var monthlyCount = monthlyCountState[0]
  var setMonthlyCount = monthlyCountState[1]

  useEffect(function () {
    if (!isDjFree || !auth.session) {
      setMonthlyCount(0)
      return
    }
    var now = new Date()
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', auth.session.user.id)
      .gte('created_at', monthStart)
      .then(function (result) {
        setMonthlyCount(result.count || 0)
      })
  }, [isDjFree, auth.session, workspaceId])

  var limitReached = isDjFree && monthlyCount !== null && monthlyCount >= DJ_FREE_MONTHLY_LIMIT

  var nameState = useState('Karaoke ' + new Date().toLocaleDateString('es-CL', { weekday: 'long' }))
  var name = nameState[0]
  var setName = nameState[1]

  var pinState = useState('')
  var pin = pinState[0]
  var setPin = pinState[1]

  var loadingState = useState(false)
  var loading = loadingState[0]
  var setLoading = loadingState[1]

  var errorState = useState('')
  var error = errorState[0]
  var setError = errorState[1]

  if (!barIsActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--accent-magenta)' }}>
            Servicio desactivado
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Este bar esta desactivado en la plataforma. Contacta al administrador de Retroke para reactivarlo.
          </p>
        </div>
      </div>
    )
  }

  function handleStart(e) {
    e.preventDefault()
    if (!name.trim()) return
    if (pin && !/^\d{4}$/.test(pin)) {
      setError('El PIN debe tener exactamente 4 numeros')
      return
    }
    setLoading(true)
    setError('')
    startSession(name.trim(), pin || null).then(function (result) {
      setLoading(false)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  if (limitReached) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-yellow)', boxShadow: '0 2px 20px -6px rgba(244,208,63,0.3)' }}>
          <p className="text-3xl mb-3">🔒</p>
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Ya usaste tus {DJ_FREE_MONTHLY_LIMIT} eventos gratis este mes
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            El plan DJ Free incluye {DJ_FREE_MONTHLY_LIMIT} eventos al mes. Sube a DJ PRO para eventos ilimitados,
            o espera al próximo mes para seguir usando el plan gratis.
          </p>
          <a
            href="/precios"
            className="inline-flex items-center justify-center w-full h-12 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
          >
            ⭐ Ver plan DJ PRO
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-sm w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
        <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          No existe una sesion activa
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Dale un nombre a la sesion de esta noche para empezar
        </p>
        {isDjFree && monthlyCount !== null && (
          <p className="text-xs mb-4 font-medium" style={{ color: 'var(--accent-yellow)' }}>
            Evento {monthlyCount + 1} de {DJ_FREE_MONTHLY_LIMIT} este mes en el plan Free
          </p>
        )}

        <form onSubmit={handleStart}>
          <input
            type="text"
            value={name}
            onChange={function (e) { setName(e.target.value) }}
            placeholder="Ej: Karaoke Viernes"
            required
            className="w-full mb-3 h-11 rounded-lg px-3 border outline-none"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={function (e) { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)) }}
            placeholder="PIN de 4 digitos (opcional, se genera solo)"
            className="w-full mb-3 h-11 rounded-lg px-3 border outline-none text-center tracking-[6px]"
            style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-magenta)' }}
          >
            {loading ? 'Iniciando...' : 'Iniciar sesion'}
          </button>
          {error && (
            <p className="text-sm mt-3" style={{ color: 'var(--accent-magenta)' }}>{error}</p>
          )}
        </form>
        <button
          onClick={function () {
            auth.signOut().then(function () { window.location.href = '/' })
          }}
          className="text-xs mt-5 underline"
          style={{ color: 'var(--text-muted)' }}
        >
          🚪 Salir de Retroke
        </button>
      </div>
    </div>
  )
}

function HistoryPanel(props) {
  var sessions = props.sessions

  function formatDate(iso) {
    if (!iso) return ''
    var d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
  }

  return (
    <section
      className="rounded-2xl border p-5 mt-6"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}
    >
      <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
        Historial de sesiones
      </p>
      {sessions.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Aun no hay sesiones cerradas.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {sessions.map(function (s) {
          return (
            <div key={s.id} className="rounded-lg p-3" style={{ background: 'var(--bg-card-alt)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {s.name} — {formatDate(s.startedAt)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {s.songCount} canciones · {s.ratingCount} votos
                {s.average ? ' · Promedio ' + s.average : ''}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function NightEndedPanel(props) {
  var barName = props.barName
  var lastClosedSession = props.lastClosedSession
  var loadSessionLeaderboard = props.loadSessionLeaderboard
  var onStartNew = props.onStartNew
  var onCloseAllRooms = props.onCloseAllRooms
  var closingAllRooms = props.closingAllRooms
  var onSignOut = props.onSignOut

  var listState = useState(null)
  var list = listState[0]
  var setList = listState[1]

  useEffect(function () {
    if (!lastClosedSession) return
    loadSessionLeaderboard(lastClosedSession.id).then(setList)
  }, [lastClosedSession, loadSessionLeaderboard])

  var top3 = (list || []).slice(0, 3)

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-md w-full rounded-3xl border p-8 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}>
        <p className="text-4xl mb-2">🏁</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{barName}</p>
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Noche finalizada
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {lastClosedSession.name}
        </p>

        {top3.length > 0 && (
          <div className="flex flex-col gap-2 mb-6 text-left">
            {top3.map(function (entry, i) {
              var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: 'var(--bg-card-alt)' }}
                >
                  <span className="text-xl shrink-0">{medal}</span>
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-base shrink-0"
                    style={{ background: 'var(--accent-purple)' }}
                  >
                    {entry.photo ? (
                      <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      entry.avatar
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{entry.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{entry.song}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: 'var(--accent-yellow)' }}>
                    {entry.average.toFixed(1)}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={function () { window.location.href = '/' }}
            className="h-12 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
          >
            🏠 Ir a selección de salas (este dispositivo)
          </button>
          <button
            onClick={onStartNew}
            className="h-11 rounded-xl font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            🎤 Iniciar otra noche aquí
          </button>
          <button
            onClick={onCloseAllRooms}
            disabled={closingAllRooms}
            className="h-11 rounded-xl font-medium border disabled:opacity-50"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            {closingAllRooms ? 'Cerrando...' : '🔒 Cerrar todas mis sesiones'}
          </button>
          <button
            onClick={onSignOut}
            className="h-11 rounded-xl font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            🚪 Salir de Retroke
          </button>
        </div>
      </div>
    </div>
  )
}

function DjPanelInner() {
  var auth = useAuth()
  var myBars = useMyBars(auth)

  var session = useKaraokeSession()
  var barName = session.barName
  var workspacePlan = session.workspacePlan
  var workspaceType = session.workspaceType
  var currentBarId = session.barId
  var currentWorkspaceId = session.workspaceId

  var addBarOpenState = useState(false)
  var addBarOpen = addBarOpenState[0]
  var setAddBarOpen = addBarOpenState[1]

  var newBarNameState = useState('')
  var newBarName = newBarNameState[0]
  var setNewBarName = newBarNameState[1]

  var addingBarState = useState(false)
  var addingBar = addingBarState[0]
  var setAddingBar = addingBarState[1]

  var addBarErrorState = useState('')
  var addBarError = addBarErrorState[0]
  var setAddBarError = addBarErrorState[1]

  var newBarLogoFileState = useState(null)
  var newBarLogoFile = newBarLogoFileState[0]
  var setNewBarLogoFile = newBarLogoFileState[1]

  var newBarLogoPreviewState = useState(null)
  var newBarLogoPreview = newBarLogoPreviewState[0]
  var setNewBarLogoPreview = newBarLogoPreviewState[1]

  function handleNewBarLogoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    setNewBarLogoFile(file)
    setNewBarLogoPreview(URL.createObjectURL(file))
  }

  function slugifyBarName(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  var deleteBarOpenState = useState(false)
  var deleteBarOpen = deleteBarOpenState[0]
  var setDeleteBarOpen = deleteBarOpenState[1]

  var deletingBarState = useState(false)
  var deletingBar = deletingBarState[0]
  var setDeletingBar = deletingBarState[1]

  var deleteBarErrorState = useState('')
  var deleteBarError = deleteBarErrorState[0]
  var setDeleteBarError = deleteBarErrorState[1]

  function handleDeleteBar() {
    if (!currentBarId) return
    setDeletingBar(true)
    setDeleteBarError('')
    supabase
      .from('bars')
      .update({ is_active: false })
      .eq('id', currentBarId)
      .then(function (result) {
        if (result.error) throw result.error
        window.location.href = '/dj'
      })
      .catch(function (err) {
        setDeletingBar(false)
        setDeleteBarError('No se pudo eliminar el local: ' + (err && err.message ? err.message : 'error desconocido'))
      })
  }

  function handleAddBar() {
    if (!newBarName.trim() || !currentWorkspaceId) return
    setAddingBar(true)
    setAddBarError('')

    var slug = slugifyBarName(newBarName) + '-' + Math.random().toString(36).slice(2, 6)
    var userId = auth.session.user.id
    var createdBar = null

    supabase
      .from('bars')
      .insert({ name: newBarName.trim(), slug: slug, workspace_id: currentWorkspaceId, is_active: true })
      .select()
      .single()
      .then(function (result) {
        if (result.error) throw result.error
        createdBar = result.data

        var chain = supabase.from('bar_members').insert({ bar_id: createdBar.id, user_id: userId, role: 'OWNER' })

        if (currentBarId) {
          chain = chain.then(function () {
            return supabase
              .from('bar_members')
              .select('id')
              .eq('bar_id', currentBarId)
              .eq('user_id', userId)
              .maybeSingle()
              .then(function (existing) {
                if (existing.data) return null
                return supabase.from('bar_members').insert({ bar_id: currentBarId, user_id: userId, role: 'OWNER' })
              })
          })
        }

        return chain
      })
      .then(function () {
        if (!newBarLogoFile || !createdBar) return
        var ext = newBarLogoFile.name.split('.').pop()
        var path = 'logo-' + Date.now() + '.' + ext
        return supabase.storage
          .from('logos')
          .upload(path, newBarLogoFile, { upsert: true })
          .then(function (result) {
            if (result.error) return
            var publicUrl = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl
            return supabase.from('bars').update({ logo_url: publicUrl }).eq('id', createdBar.id)
          })
      })
      .then(function () {
        window.location.href = '/dj'
      })
      .catch(function (err) {
        setAddingBar(false)
        setAddBarError('No se pudo crear el local: ' + (err && err.message ? err.message : 'error desconocido'))
      })
  }
  var workspaceId = session.workspaceId

  var subExpiryState = useState(null)
  var subExpiry = subExpiryState[0]
  var setSubExpiry = subExpiryState[1]

  var startingTrialState = useState(false)
  var startingTrial = startingTrialState[0]
  var setStartingTrial = startingTrialState[1]

  var trialJustEndedState = useState(false)
  var trialJustEnded = trialJustEndedState[0]
  var setTrialJustEnded = trialJustEndedState[1]

  function loadSubscription() {
    if (!workspaceId) return
    supabase
      .from('subscriptions')
      .select('id, expires_at, status, trial_used, plan_id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(function (result) {
        setSubExpiry(result.data || null)
      })
  }

  useEffect(function () {
    loadSubscription()
  }, [workspaceId])

  function startProTrial() {
    if (!subExpiry || !workspaceId || !workspaceType) return
    setStartingTrial(true)
    supabase
      .from('plans')
      .select('id')
      .eq('workspace_type', workspaceType)
      .eq('code', 'PRO')
      .maybeSingle()
      .then(function (planResult) {
        var proPlan = planResult.data
        if (!proPlan) throw new Error('No se encontro el plan PRO para este tipo')
        var expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        return supabase
          .from('subscriptions')
          .update({
            plan_id: proPlan.id,
            status: 'trial',
            expires_at: expiresAt,
            trial_used: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', subExpiry.id)
          .then(function () {
            return supabase.from('workspaces').update({ plan: 'PRO' }).eq('id', workspaceId)
          })
      })
      .then(function () {
        setStartingTrial(false)
        loadSubscription()
        window.location.reload()
      })
      .catch(function () {
        setStartingTrial(false)
      })
  }

  function upgradeToRealPro() {
    if (!subExpiry) return
    setStartingTrial(true)
    fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subExpiry.id })
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.init_point) {
          window.location.href = data.init_point
        } else {
          setStartingTrial(false)
        }
      })
      .catch(function () {
        setStartingTrial(false)
      })
  }
  var barIsActive = session.barIsActive
  var barLoading = session.barLoading
  var sessionCode = session.sessionCode
  var activeSessionPin = session.activeSessionPin
  var spaceParam = session.spaceParam
  var hasActiveSession = session.hasActiveSession
  var lastClosedSession = session.lastClosedSession
  var loadSessionLeaderboard = session.loadSessionLeaderboard
  var activeSessionName = session.activeSessionName
  var queue = session.queue
  var currentSinger = session.currentSinger

  // En modo Home, el DJ no deberia poder iniciar la presentacion hasta que
  // la persona ya haya permitido el microfono en su celular (mic_ready=true
  // en queue_entries). Esto se pierde a veces al pasar de "queue" a
  // "currentSinger" en el estado, asi que lo consultamos en vivo aparte.
  var calledMicReadyState = useState(null)
  var calledMicReady = calledMicReadyState[0]
  var setCalledMicReady = calledMicReadyState[1]

  var micReadyToastState = useState('')
  var micReadyToast = micReadyToastState[0]
  var setMicReadyToast = micReadyToastState[1]
  var wasMicReadyRef = useRef(false)

  useEffect(function () {
    if (workspaceType !== 'HOME' || !currentSinger || screenMode !== 'called') {
      setCalledMicReady(null)
      wasMicReadyRef.current = false
      return
    }
    var cancelled = false
    setCalledMicReady(null)
    wasMicReadyRef.current = false

    function checkReady() {
      supabase
        .from('queue_entries')
        .select('mic_ready')
        .eq('id', currentSinger.id)
        .maybeSingle()
        .then(function (result) {
          if (cancelled) return
          var ready = !!(result.data && result.data.mic_ready)
          setCalledMicReady(ready)
          if (ready && !wasMicReadyRef.current) {
            var audio = new Audio('/sounds/vote-start.mp3')
            audio.volume = 0.4
            audio.play().catch(function () {})
            setMicReadyToast(currentSinger.name + ' ya está listo para cantar 🎤')
            setTimeout(function () { setMicReadyToast('') }, 6000)
          }
          wasMicReadyRef.current = ready
        })
    }
    checkReady()
    var interval = setInterval(checkReady, 2000)
    return function () {
      cancelled = true
      clearInterval(interval)
    }
  }, [workspaceType, currentSinger ? currentSinger.id : null, screenMode])
  var screenMode = session.screenMode
  var removeFromQueue = session.removeFromQueue
  var setQueueEntryVideo = session.setQueueEntryVideo
  var callSinger = session.callSinger
  var setCurrentSingerVideo = session.setCurrentSingerVideo
  var setCurrentSingerArtist = session.setCurrentSingerArtist

  var artistInputState = useState('')
  var artistInput = artistInputState[0]
  var setArtistInput = artistInputState[1]

  useEffect(function () {
    setArtistInput((currentSinger && currentSinger.artistName) || '')
  }, [currentSinger && currentSinger.id])

  function saveArtistInput() {
    if (!currentSinger) return
    if ((currentSinger.artistName || '') === artistInput.trim()) return
    setCurrentSingerArtist(artistInput.trim())
  }
  var startPlaying = session.startPlaying
  var finishCurrentSong = session.finishCurrentSong
  var submitRating = session.submitRating
  var closeVoting = session.closeVoting
  var returnToQueue = session.returnToQueue
  var ratings = session.ratings
  var startSession = session.startSession
  var closeSession = session.closeSession
  var loadPastSessions = session.loadPastSessions
  var hasFeature = session.hasFeature
  var logoUrl = session.logoUrl
  var updateLogo = session.updateLogo

  var showHistoryState = useState(false)
  var showHistory = showHistoryState[0]
  var setShowHistory = showHistoryState[1]

  var pastSessionsState = useState([])
  var pastSessions = pastSessionsState[0]
  var setPastSessions = pastSessionsState[1]

  var closingState = useState(false)
  var closing = closingState[0]
  var setClosing = closingState[1]

  var forceNewSessionState = useState(false)
  var forceNewSession = forceNewSessionState[0]
  var setForceNewSession = forceNewSessionState[1]

  var showProfileState = useState(false)
  var showProfile = showProfileState[0]
  var setShowProfile = showProfileState[1]

  var djAvatarUrlState = useState('')
  var djAvatarUrl = djAvatarUrlState[0]
  var setDjAvatarUrl = djAvatarUrlState[1]

  var vocalResultsState = useState([])
  var vocalResults = vocalResultsState[0]
  var setVocalResults = vocalResultsState[1]

  useEffect(function () {
    if (workspaceType !== 'HOME' || !session.sessionId) return

    function loadVocalResults() {
      supabase
        .from('vocal_results')
        .select('*, queue_entries(name, song, avatar, photo)')
        .eq('session_id', session.sessionId)
        .order('created_at', { ascending: false })
        .then(function (result) {
          if (result.data) setVocalResults(result.data)
        })
    }

    loadVocalResults()
    var intervalId = setInterval(loadVocalResults, 8000)
    return function () { clearInterval(intervalId) }
  }, [workspaceType, session.sessionId])

  useEffect(function () {
    if (!auth.session) return
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', auth.session.user.id)
      .maybeSingle()
      .then(function (result) {
        if (result.data) setDjAvatarUrl(result.data.avatar_url || '')
      })
  }, [auth.session, showProfile])

  useEffect(function () {
    if (hasActiveSession) setForceNewSession(false)
  }, [hasActiveSession])

  var checkStatusState = useState('idle')
  var checkStatus = checkStatusState[0]
  var setCheckStatus = checkStatusState[1]

  function handleCheckVideo() {
    if (!currentSinger || !currentSinger.videoId) return
    setCheckStatus('checking')
    checkYoutubeEmbeddable(currentSinger.videoId).then(function (ok) {
      setCheckStatus(ok ? 'ok' : 'blocked')
    })
  }

  function handleSelectSimilar(videoUrl, videoId) {
    setCurrentSingerVideo(videoUrl, videoId).then(function () {
      setCheckStatus('checking')
      checkYoutubeEmbeddable(videoId).then(function (ok) {
        setCheckStatus(ok ? 'ok' : 'blocked')
      })
    })
  }

  useEffect(function () {
    setCheckStatus('idle')
  }, [currentSinger ? currentSinger.id : null])

  function handleStartPresentation() {
    if (!currentSinger) return
    startPlaying()
  }

  function handleToggleHistory() {
    if (!showHistory) {
      loadPastSessions().then(function (data) {
        setPastSessions(data)
      })
    }
    setShowHistory(!showHistory)
  }

  function handleCloseSession() {
    if (!window.confirm('Finalizar la noche de karaoke? Se mostrara el podio final y no se aceptaran mas canciones.')) return
    setClosing(true)
    closeSession().then(function () {
      setClosing(false)
    })
  }

  var closingAllState = useState(false)
  var closingAll = closingAllState[0]
  var setClosingAll = closingAllState[1]

  function handleCloseAllMyRooms() {
    if (!window.confirm('Esto finaliza la noche activa en TODOS tus locales, no solo el actual. ¿Estas seguro?')) return
    setClosingAll(true)
    supabase
      .from('bar_members')
      .select('bar_id')
      .eq('user_id', auth.session.user.id)
      .then(function (result) {
        var barIds = (result.data || []).map(function (r) { return r.bar_id })
        // Bar: cierra por bar_id (locales del dueño). DJ/Home: las sesiones
        // se ligan por workspace_id en vez de bar_id, asi que cubrimos ambos
        // caminos para que el boton funcione sin importar la modalidad.
        var orParts = []
        if (barIds.length > 0) {
          orParts.push('bar_id.in.(' + barIds.join(',') + ')')
        }
        if (workspaceId) {
          orParts.push('workspace_id.eq.' + workspaceId)
        }
        if (orParts.length === 0) {
          setClosingAll(false)
          return
        }
        return supabase
          .from('sessions')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .or(orParts.join(','))
          .eq('status', 'active')
          .then(function () {
            setClosingAll(false)
            window.location.href = '/dj'
          })
      })
      .catch(function () {
        setClosingAll(false)
      })
  }

  if (auth.loading || barLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (!auth.session) {
    return <LoginGate />
  }

  if (showProfile) {
    return (
      <ProfileTab
        auth={auth}
        workspacePlan={workspacePlan}
        onBack={function () { setShowProfile(false) }}
      />
    )
  }

  var urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  var barSlugParam = urlParams ? urlParams.get('bar') : null
  var wsParam = urlParams ? urlParams.get('ws') : null

  if (wsParam) {
    // Modo Workspace directo (DJ Pro / Home): el contexto ya resuelve todo, no pasar por el selector de bares
  } else {

  if (myBars === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  if (myBars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta no esta asignada a ningun bar todavia. Pide al administrador que te agregue.
        </p>
      </div>
    )
  }

  var currentBarInList = barSlugParam
    ? myBars.find(function (b) { return b.slug === barSlugParam })
    : null

  if (barSlugParam && !currentBarInList) {
    return <WorkspaceSelector bars={myBars} notice="No tienes acceso a ese bar. Elige uno de los tuyos." />
  }

  if (!barSlugParam && myBars.length > 1) {
    return <WorkspaceSelector bars={myBars} />
  }

  if (!barSlugParam && myBars.length === 1) {
    if (typeof window !== 'undefined') {
      var only = myBars[0]
      window.location.href = only.kind === 'bar' ? '/dj?bar=' + only.slug : '/dj?ws=' + only.workspaceId
    }
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  } // fin del bloque exclusivo para modo bar (no aplica cuando viene con ?ws=)

  if (!hasActiveSession) {
    if (lastClosedSession && !forceNewSession) {
      return (
        <NightEndedPanel
          barName={barName}
          lastClosedSession={lastClosedSession}
          loadSessionLeaderboard={loadSessionLeaderboard}
          onStartNew={function () { setForceNewSession(true) }}
          onCloseAllRooms={handleCloseAllMyRooms}
          closingAllRooms={closingAll}
          onSignOut={function () { auth.signOut().then(function () { window.location.href = '/' }) }}
        />
      )
    }
    return <StartSessionGate barName={barName} barIsActive={barIsActive} startSession={startSession} workspaceType={workspaceType} workspacePlan={workspacePlan} workspaceId={workspaceId} />
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {micReadyToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
          style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', color: '#fff', boxShadow: '0 8px 30px -8px rgba(233,30,140,0.7)' }}
        >
          🎤 {micReadyToast}
        </div>
      )}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />
      <div
        className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: '#E91E8C' }}
      />
      <div
        className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: '#8B5CF6' }}
      />
      <div className="relative max-w-6xl mx-auto">
      <header
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 rounded-2xl border p-4 sm:p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(233,30,140,0.06))',
          borderColor: 'rgba(139,92,246,0.35)',
          boxShadow: '0 0 24px -8px rgba(139,92,246,0.5)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #E91E8C)',
              boxShadow: '0 0 0 2px var(--bg-page), 0 0 0 4px #F4D03F, 0 0 18px 2px rgba(244, 208, 63, 0.55)'
            }}
          >
            {(workspaceType === 'BAR' ? session.logoUrl : djAvatarUrl) ? (
              <img
                src={workspaceType === 'BAR' ? session.logoUrl : djAvatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              '🎧'
            )}
          </div>
          <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {barName} · {activeSessionName}
            </p>
            {workspacePlan && (
              <span
                className="text-xs font-bold px-3 py-1 rounded-full tracking-wide"
                style={{
                  background:
                    workspacePlan === 'PREMIUM' ? 'rgba(244, 208, 63, 0.18)' :
                    workspacePlan === 'PRO' ? 'rgba(139, 92, 246, 0.18)' :
                    'rgba(255, 255, 255, 0.08)',
                  color:
                    workspacePlan === 'PREMIUM' ? '#F4D03F' :
                    workspacePlan === 'PRO' ? '#8B5CF6' :
                    'var(--text-muted)',
                  border: '2px solid ' + (
                    workspacePlan === 'PREMIUM' ? 'rgba(244, 208, 63, 0.4)' :
                    workspacePlan === 'PRO' ? 'rgba(139, 92, 246, 0.4)' :
                    'var(--border)'
                  )
                }}
              >
                {workspacePlan === 'PREMIUM' ? '👑 PREMIUM' : workspacePlan === 'PRO' ? '⭐ PRO' : 'FREE'}
              </span>
            )}
          </div>
          <p className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            Panel del DJ
          </p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {activeSessionPin && (
            <span
              className="text-sm px-3 h-9 rounded-lg font-bold flex items-center gap-1.5"
              style={{ background: 'rgba(244, 208, 63, 0.12)', color: '#F4D03F', border: '1px solid rgba(244, 208, 63, 0.4)' }}
              title="Comparte este PIN con la gente para que pueda entrar desde la seleccion de salas"
            >
              🔑 PIN: <span className="tracking-[3px]">{activeSessionPin}</span>
            </span>
          )}
          <button
            onClick={function () {
              var url = window.location.origin + '/?' + spaceParam
              window.open(url, '_blank')
            }}
            className="text-sm px-3 py-2 min-h-9 rounded-lg font-medium text-white leading-tight text-center"
            style={{ background: 'var(--accent-purple)' }}
          >
            🖥️ Sala de espera
          </button>
          <button
            onClick={handleCloseSession}
            disabled={closing}
            className="text-sm px-3 py-2 min-h-9 rounded-lg border disabled:opacity-50 leading-tight text-center"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            {closing ? 'Finalizando...' : '🏁 Finalizar noche'}
          </button>
          <button
            onClick={function () {
              var proceed = hasActiveSession
                ? closeSession()
                : Promise.resolve()
              proceed.then(function () {
                auth.signOut().then(function () {
                  window.location.href = '/'
                })
              })
            }}
            className="text-sm px-3 h-9 rounded-lg border whitespace-nowrap"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            🚪 Salir de Retroke
          </button>
          <button
            onClick={function () { setShowProfile(true) }}
            className="text-sm px-3 h-9 rounded-lg border whitespace-nowrap"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            👤 Mi perfil
          </button>
          {workspaceType === 'BAR' && workspacePlan === 'PRO' && (
            <button
              onClick={function () { setAddBarOpen(true) }}
              className="text-sm px-3 h-9 rounded-lg border whitespace-nowrap font-medium"
              style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
            >
              ➕ Agregar local
            </button>
          )}
          {workspaceType === 'BAR' && myBars && myBars.length > 1 && (
            <button
              onClick={function () { setDeleteBarOpen(true) }}
              className="text-sm px-3 h-9 rounded-lg border whitespace-nowrap font-medium"
              style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
            >
              🗑️ Eliminar local
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {deleteBarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              ¿Eliminar "{barName}"?
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Este local dejará de aparecer en tu lista y nadie podrá anotarse a cantar
              ahí. El historial de noches pasadas se conserva — si más adelante quieres
              recuperarlo, pídeselo al administrador.
            </p>
            {deleteBarError && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent-magenta)' }}>{deleteBarError}</p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={function () { setDeleteBarOpen(false); setDeleteBarError('') }}
                disabled={deletingBar}
                className="flex-1 h-11 rounded-lg border font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBar}
                disabled={deletingBar}
                className="flex-1 h-11 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent-magenta)' }}
              >
                {deletingBar ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {addBarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Agregar otro local
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Incluido en tu plan Bar Pro — administra varios locales desde una sola cuenta.
            </p>
            <input
              type="text"
              value={newBarName}
              onChange={function (e) { setNewBarName(e.target.value) }}
              placeholder="Nombre del nuevo local"
              className="w-full h-11 rounded-lg px-3 border outline-none mb-3"
              style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <label
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer mb-4"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card-alt)' }}
            >
              {newBarLogoPreview ? (
                <img src={newBarLogoPreview} alt="Logo" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>📷</span>
              )}
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {newBarLogoPreview ? 'Logo seleccionado' : 'Subir logo del local (opcional)'}
              </span>
              <input type="file" accept="image/*" onChange={handleNewBarLogoChange} className="hidden" />
            </label>
            {addBarError && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent-magenta)' }}>{addBarError}</p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={function () { setAddBarOpen(false); setAddBarError('') }}
                disabled={addingBar}
                className="flex-1 h-11 rounded-lg border font-medium disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddBar}
                disabled={addingBar || !newBarName.trim()}
                className="flex-1 h-11 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent-purple)' }}
              >
                {addingBar ? 'Creando...' : 'Crear local'}
              </button>
            </div>
          </div>
        </div>
      )}

      {workspacePlan === 'FREE' && subExpiry && subExpiry.status === 'active' && !subExpiry.trial_used && (
        <div
          className="relative z-10 rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'linear-gradient(90deg, rgba(233,30,140,0.14), rgba(139,92,246,0.14))', border: '1.5px solid rgba(244,208,63,0.5)' }}
        >
          <div>
            <p className="text-base font-bold" style={{ color: '#F4D03F' }}>🎁 Prueba PRO gratis por 1 día</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Desbloquea todas las funciones PRO por 24 horas, sin costo. Puedes hacerlo una sola vez.
            </p>
          </div>
          <button
            onClick={startProTrial}
            disabled={startingTrial}
            className="h-11 px-6 rounded-xl font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
          >
            {startingTrial ? 'Activando...' : 'Probar PRO ahora'}
          </button>
        </div>
      )}

      {subExpiry && subExpiry.status === 'trial' && (function () {
        var days = Math.ceil((new Date(subExpiry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        var hoursLeft = Math.max(0, Math.ceil((new Date(subExpiry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)))
        return (
          <div
            className="relative z-10 rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3"
            style={{ background: 'rgba(126,217,87,0.1)', border: '1.5px solid rgba(126,217,87,0.5)' }}
          >
            <div>
              <p className="text-base font-bold" style={{ color: 'var(--accent-green)' }}>✨ Estás probando PRO</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Te quedan {hoursLeft} {hoursLeft === 1 ? 'hora' : 'horas'}. Cuando termine, vuelves a FREE automáticamente.
              </p>
            </div>
            <button
              onClick={upgradeToRealPro}
              disabled={startingTrial}
              className="h-11 px-6 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              {startingTrial ? 'Cargando...' : 'Quedarme en PRO'}
            </button>
          </div>
        )
      })()}

      <button
        onClick={handleToggleHistory}
        className="text-xs mb-6 underline"
        style={{ color: 'var(--text-muted)' }}
      >
        {showHistory ? 'Ocultar historial' : 'Ver historial de sesiones'}
      </button>

      {showHistory && <HistoryPanel sessions={pastSessions} />}

      <section
        className="rounded-2xl border p-5 mb-6 mt-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}
      >
        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
          Estado actual
        </p>

        {currentSinger ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl overflow-hidden"
                style={{ background: 'var(--accent-magenta)' }}
              >
                {currentSinger.photo ? (
                  <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
                ) : (
                  currentSinger.avatar
                )}
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentSinger.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {currentSinger.song} · pantalla: {screenLabel(screenMode)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Artista:</span>
                  <input
                    type="text"
                    value={artistInput}
                    onChange={function (e) { setArtistInput(e.target.value) }}
                    onBlur={saveArtistInput}
                    placeholder="Confirma el artista real"
                    className="text-xs h-7 px-2 rounded-lg border outline-none w-48"
                    style={{ background: 'var(--bg-card-alt)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                {screenMode === 'called' && !currentSinger.videoId && (
                  <p className="text-xs mt-1" style={{ color: 'var(--accent-magenta)' }}>
                    ⚠️ Video no seleccionado
                  </p>
                )}
                {screenMode === 'called' && checkStatus === 'ok' && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--accent-green)' }}>
                    ✅ Video verificado, listo para reproducir
                  </p>
                )}
                {screenMode === 'called' && checkStatus === 'blocked' && (
                  <div className="mt-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--accent-magenta)' }}>
                      ❌ Este video no se puede reproducir aqui. Cambia el link.
                    </p>
                    <SimilarTrackSearch query={currentSinger.song} onSelect={handleSelectSimilar} />
                  </div>
                )}
                {currentSinger.videoError && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--accent-magenta)' }}>
                    ⚠️ Este video no se puede reproducir aqui. Cancela y cambia el link.
                  </p>
                )}
                {workspaceType === 'HOME' && (screenMode === 'rating' || screenMode === 'reactions') && (
                  <VocalScoreBadge queueEntryId={currentSinger.id} />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {screenMode === 'called' && currentSinger.videoId && (
                <button
                  onClick={handleCheckVideo}
                  disabled={checkStatus === 'checking'}
                  className="px-4 h-10 rounded-lg text-sm font-medium border disabled:opacity-60"
                  style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)' }}
                >
                  {checkStatus === 'checking' ? 'Verificando...' : 'Verificar video'}
                </button>
              )}
              {screenMode === 'called' && workspaceType === 'HOME' && !calledMicReady && (
                <div className="flex items-center gap-2">
                  <span
                    className="px-4 h-10 flex items-center gap-1.5 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.4)', color: '#F4D03F' }}
                  >
                    ⏳ Esperando que {currentSinger.name} permita el micrófono...
                  </span>
                  <button
                    onClick={handleStartPresentation}
                    className="px-3 h-10 rounded-lg text-xs font-medium border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    title="Usar solo si la persona ya esta lista pero la señal no llego"
                  >
                    Iniciar igual
                  </button>
                </div>
              )}
              {screenMode === 'called' && (workspaceType !== 'HOME' || calledMicReady) && (
                <button
                  onClick={handleStartPresentation}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--accent-magenta)' }}
                >
                  Iniciar presentacion
                </button>
              )}
              {screenMode === 'countdown' && (
                <span className="px-4 h-10 flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cuenta regresiva en curso...
                </span>
              )}
              {screenMode === 'reactions' && (
                <button
                  onClick={finishCurrentSong}
                  className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--accent-purple)' }}
                >
                  Terminar cancion, pedir votos
                </button>
              )}
              {screenMode === 'rating' && (
                <>
                  <DjRatingShortcut submitRating={submitRating} />
                  <button
                    onClick={closeVoting}
                    className="px-4 h-10 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'var(--accent-purple)' }}
                  >
                    Cerrar votacion
                  </button>
                </>
              )}
              {screenMode === 'result' && (
                <span className="px-4 h-10 flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Mostrando resultado en pantalla
                </span>
              )}
              <button
                onClick={returnToQueue}
                className="px-4 h-10 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {screenMode === 'called' ? 'Cancelar' : screenMode === 'result' ? 'Siguiente cantante' : 'Volver a la cola'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Nadie esta cantando ahora mismo.</p>
        )}
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--accent-yellow)' }}>
            Cola ({queue.length})
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {queue.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay nadie esperando. Comparte el QR para que la gente se anote.
            </p>
          )}
          {queue.map(function (entry, index) {
            return (
              <QueueRowAdmin
                key={entry.id}
                entry={entry}
                index={index}
                canCall={!currentSinger}
                callSinger={callSinger}
                removeFromQueue={removeFromQueue}
                setQueueEntryVideo={setQueueEntryVideo}
                videoPreviewEnabled={hasFeature('video_preview')}
                showPresence={workspaceType === 'HOME'}
              />
            )
          })}
        </div>
      </section>

      {workspaceType === 'HOME' && vocalResults.length > 0 && (
        <section
          className="rounded-2xl border-2 p-5 mt-6 relative overflow-hidden"
          style={{
            borderColor: 'rgba(244,208,63,0.5)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(233,30,140,0.08))',
            boxShadow: '0 0 30px -8px rgba(244,208,63,0.5)'
          }}
        >
          <p className="text-xs uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: '#F4D03F' }}>
            ⭐ Retroke Scores de esta sesión
          </p>
          <div className="flex flex-col gap-2.5">
            {vocalResults.map(function (r) {
              var entry = r.queue_entries
              var scoreColor = r.final_score >= 80 ? '#7ED957' : r.final_score >= 55 ? '#F4D03F' : '#E9544A'
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base overflow-hidden shrink-0"
                    style={{ background: 'var(--accent-purple)' }}
                  >
                    {entry && entry.photo ? (
                      <img src={entry.photo} alt="" className="w-full h-full object-cover" />
                    ) : entry ? (
                      entry.avatar
                    ) : (
                      '🎤'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry ? entry.name : 'Cantante'}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      🎯{r.pitch_score} 🥁{r.rhythm_score} 🎵{r.stability_score} 🔥{r.energy_score}
                    </p>
                  </div>
                  <div
                    className="shrink-0 text-lg font-extrabold px-3 py-1 rounded-full"
                    style={{ color: scoreColor, border: '2px solid ' + scoreColor, boxShadow: '0 0 10px -2px ' + scoreColor }}
                  >
                    {r.final_score}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {ratings.length > 0 && (
        <section
          className="rounded-2xl border p-5 mt-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}
        >
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--accent-yellow)' }}>
            Calificaciones de esta sesion
          </p>
          <div className="flex flex-col gap-1.5">
            {ratings.map(function (r, i) {
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {r.name} — {r.song}
                  </span>
                  <span style={{ color: 'var(--accent-yellow)' }}>{r.score}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {subExpiry && (function () {
        var isFree = workspacePlan === 'FREE'
        var hasExpiry = subExpiry.expires_at
        var days = hasExpiry ? Math.ceil((new Date(subExpiry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
        var color = !hasExpiry ? 'var(--accent-green)' : days < 0 ? 'var(--accent-magenta)' : days <= 5 ? '#F4D03F' : 'var(--accent-green)'
        var planWord = subExpiry.status === 'trial' ? 'prueba PRO' : workspacePlan
        return (
          <section
            className="rounded-2xl border p-5 mt-6 flex items-center justify-between flex-wrap gap-3"
            style={{ background: 'var(--bg-card)', borderColor: color, boxShadow: '0 2px 20px -6px rgba(139,92,246,0.25)' }}
          >
            <div>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                Estado de tu suscripcion
              </p>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Plan {planWord}
              </p>
            </div>
            <div className="text-right">
              {!hasExpiry ? (
                <p className="text-sm font-semibold" style={{ color: color }}>✓ Sin vencimiento</p>
              ) : (
                <p className="text-2xl font-extrabold" style={{ color: color }}>
                  {days < 0 ? 'Vencido' : days === 0 ? 'Vence hoy' : days + (days === 1 ? ' dia' : ' dias')}
                </p>
              )}
              {hasExpiry && days >= 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>restantes</p>
              )}
            </div>
          </section>
        )
      })()}
      </div>
    </div>
  )
}

function extractYoutubeId(url) {
  if (!url) return null
  var match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function QueueRowAdmin(props) {
  var entry = props.entry
  var index = props.index
  var canCall = props.canCall
  var callSinger = props.callSinger
  var removeFromQueue = props.removeFromQueue
  var setQueueEntryVideo = props.setQueueEntryVideo
  var videoPreviewEnabled = props.videoPreviewEnabled
  var showPresence = props.showPresence

  var presenceStatus = null
  if (showPresence) {
    if (!entry.lastSeenAt) {
      presenceStatus = 'red'
    } else {
      var secondsAgo = (Date.now() - new Date(entry.lastSeenAt).getTime()) / 1000
      presenceStatus = secondsAgo < 30 ? 'green' : secondsAgo < 90 ? 'yellow' : 'red'
    }
  }

  var openState = useState(false)
  var open = openState[0]
  var setOpen = openState[1]

  var urlState = useState(entry.videoUrl || '')
  var url = urlState[0]
  var setUrl = urlState[1]

  var savedState = useState(false)
  var saved = savedState[0]
  var setSaved = savedState[1]

  var previewState = useState(null)
  var preview = previewState[0]
  var setPreview = previewState[1]

  function commitSave(videoUrl) {
    setQueueEntryVideo(entry.id, videoUrl).then(function () {
      setSaved(true)
      setPreview(null)
      setTimeout(function () { setSaved(false) }, 1500)
    })
  }

  function handleSave() {
    var videoId = extractYoutubeId(url.trim())
    if (videoPreviewEnabled && videoId) {
      setPreview({ url: url.trim(), videoId: videoId })
      return
    }
    commitSave(url.trim())
  }

  function handleSelectSimilar(videoUrl, videoId) {
    setUrl(videoUrl)
    if (videoPreviewEnabled) {
      setPreview({ url: videoUrl, videoId: videoId })
      return
    }
    commitSave(videoUrl)
  }

  return (
    <div className="rounded-lg py-2.5 px-3" style={{ background: 'var(--bg-card-alt)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-sm w-5 shrink-0" style={{ color: 'var(--text-muted)' }}>
            {index + 1}
          </span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-base overflow-hidden shrink-0"
            style={{ background: 'var(--accent-purple)' }}
          >
            {entry.photo ? (
              <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
              entry.avatar
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              {showPresence && (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: presenceStatus === 'green' ? '#7ED957' : presenceStatus === 'yellow' ? '#F4D03F' : '#E9544A',
                    boxShadow: '0 0 6px 1px ' + (presenceStatus === 'green' ? 'rgba(126,217,87,0.7)' : presenceStatus === 'yellow' ? 'rgba(244,208,63,0.7)' : 'rgba(233,84,74,0.7)')
                  }}
                  title={presenceStatus === 'green' ? 'Conectado' : presenceStatus === 'yellow' ? 'Reconectando' : 'Desconectado'}
                />
              )}
              {entry.name}
              {showPresence && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide"
                  style={{
                    color: entry.micReady ? '#7ED957' : '#F4D03F',
                    border: '1px solid ' + (entry.micReady ? 'rgba(126,217,87,0.5)' : 'rgba(244,208,63,0.5)'),
                    background: entry.micReady ? 'rgba(126,217,87,0.1)' : 'rgba(244,208,63,0.1)'
                  }}
                >
                  {entry.micReady ? '✅ Listo' : '⏳ Preparando'}
                </span>
              )}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {entry.song}
            </p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2 pl-7 sm:pl-0">
          <button
            onClick={function () { setOpen(!open) }}
            className="text-xs px-2.5 py-1 rounded shrink-0"
            style={{ color: entry.videoId ? 'var(--accent-green)' : 'var(--text-muted)' }}
          >
            {entry.videoId ? 'Video listo' : 'Agregar video'}
          </button>
          {canCall && (
            <button
              onClick={function () { callSinger(entry.id) }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white shrink-0"
              style={{ background: 'var(--accent-magenta)' }}
            >
              Llamar
            </button>
          )}
          <button
            onClick={function () { removeFromQueue(entry.id) }}
            className="text-xs px-2.5 py-1 rounded shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            Quitar
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2.5 pl-3 sm:pl-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={url}
              onChange={function (e) { setUrl(e.target.value) }}
              placeholder="Pega el link de YouTube"
              className="w-full sm:flex-1 h-9 rounded-lg px-3 border outline-none text-sm min-w-0"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={handleSave}
              className="h-9 px-3 rounded-lg text-sm font-medium text-white w-full sm:w-auto shrink-0"
              style={{ background: 'var(--accent-magenta)' }}
            >
              {saved ? 'Guardado' : videoPreviewEnabled ? 'Previsualizar' : 'Guardar'}
            </button>
          </div>
          <SimilarTrackSearch
            query={entry.song}
            onSelect={handleSelectSimilar}
          />

          {preview && (
            <VideoPreviewModal
              videoId={preview.videoId}
              entryName={entry.name}
              onCancel={function () { setPreview(null) }}
              onConfirm={function () { commitSave(preview.url) }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function VideoPreviewModal(props) {
  var videoId = props.videoId
  var entryName = props.entryName
  var onCancel = props.onCancel
  var onConfirm = props.onConfirm

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-2xl border-2 overflow-hidden preview-modal-in"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-purple)' }}
        onClick={function (e) { e.stopPropagation() }}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Vista previa
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              Para {entryName}
            </p>
          </div>
          <button onClick={onCancel} className="text-xl leading-none px-2" style={{ color: 'var(--text-muted)' }}>
            ×
          </button>
        </div>

        <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
          <iframe
            key={videoId}
            src={'https://www.youtube.com/embed/' + videoId + '?autoplay=1'}
            title="Vista previa del video"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
          />
        </div>

        <div className="flex gap-2 p-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-sm font-medium border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
          >
            ✅ Usar esta pista
          </button>
        </div>
      </div>

      <style>{`
        .preview-modal-in {
          animation: previewModalIn 0.2s ease-out;
        }
        @keyframes previewModalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function screenLabel(mode) {
  if (mode === 'reactions') return 'reacciones en vivo'
  if (mode === 'rating') return 'calificacion'
  return 'cola'
}

function DjRatingShortcut(props) {
  return (
    <button
      onClick={function () { props.submitRating(8) }}
      className="px-4 h-10 rounded-lg text-sm border"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      title="Solo para pruebas"
    >
      Simular voto de prueba
    </button>
  )
}

class DjPanelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error: error }
  }

  componentDidCatch(error, info) {
    console.error('DjPanel crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
          <div className="max-w-lg w-full rounded-2xl border-2 p-6" style={{ borderColor: '#E9544A', background: '#1a1010' }}>
            <p className="text-lg font-bold mb-2" style={{ color: '#E9544A' }}>
              ⚠️ Ocurrió un error en el panel
            </p>
            <p className="text-sm mb-4" style={{ color: '#ddd' }}>
              Copia este mensaje y compártelo para poder arreglarlo:
            </p>
            <pre className="text-xs p-3 rounded-lg overflow-auto" style={{ background: '#000', color: '#F4D03F', whiteSpace: 'pre-wrap' }}>
              {String(this.state.error && this.state.error.message)}
              {'\n\n'}
              {String(this.state.error && this.state.error.stack)}
            </pre>
            <button
              onClick={function () { window.location.reload() }}
              className="mt-4 h-11 px-5 rounded-xl font-bold text-white"
              style={{ background: '#8B5CF6' }}
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function DjPanel() {
  return (
    <DjPanelErrorBoundary>
      <DjPanelInner />
    </DjPanelErrorBoundary>
  )
}
