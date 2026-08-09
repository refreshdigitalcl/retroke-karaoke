import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LEVELS, computeLevel } from '../lib/gamification'
import { getOrCreateParticipant, touchParticipantProfile, updateParticipantPhoto, signInWithGoogle, signOutParticipant } from '../lib/participant'
import { getGlobalXpRank } from '../lib/ranking'
import { loadReceivedChallenges } from '../lib/challenges'

// Misma tecnica que resizeToSquareJpeg en RegisterForm.jsx (PNG en vez de
// JPEG a proposito: algunos Smart TV con Chrome embebido decodifican mal el
// JPEG que genera el canvas del celular y la foto sale con tono verde).
function resizeToSquarePng(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        var size = 240
        var canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        var ctx = canvas.getContext('2d')
        var side = Math.min(img.width, img.height)
        var sx = (img.width - side) / 2
        var sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// "Esto soy yo, esto he logrado" — el perfil propio del participante.
// Funciona igual sin login (identidad por dispositivo, Fase B) o con Google
// conectado (Fase "comunidad") — la unica diferencia es de donde sale el
// participant_id, todo lo demas se lee/muestra exactamente igual.

var AVATAR_OPTIONS = ['🎤', '🎸', '🎧', '🌟', '🔥', '👑', '😎', '🦄', '💥', '🎶', '🥳', '💃']

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch (e) {
    return ''
  }
}

export default function Profile() {
  // El local/workspace activo viaja en el query string (?bar=... o
  // ?ws=...). Lo propagamos de vuelta al link de "volver" para no perder
  // el contexto de la sesion — si no, volver desde el perfil mandaba
  // siempre al bar por defecto en vez de al que realmente estaba cantando.
  var location = useLocation()
  var backToRegistroHref = '/registro' + (location.search || '')

  var [loading, setLoading] = useState(true)
  var [authUser, setAuthUser] = useState(null)
  var [participant, setParticipant] = useState(null)
  var [stats, setStats] = useState(null)
  var [achievements, setAchievements] = useState([])
  var [unlockedMap, setUnlockedMap] = useState({})
  var [performances, setPerformances] = useState([])
  var [editingName, setEditingName] = useState(false)
  var [nameDraft, setNameDraft] = useState('')
  var [pickingAvatar, setPickingAvatar] = useState(false)
  var [connectState, setConnectState] = useState('')
  var [uploadingPhoto, setUploadingPhoto] = useState(false)
  var [rank, setRank] = useState(null)
  var [pendingChallengeCount, setPendingChallengeCount] = useState(0)

  var load = useCallback(function () {
    setLoading(true)
    var userResult
    supabase.auth.getUser()
      .then(function (result) {
        userResult = result.data && result.data.user ? result.data.user : null
        setAuthUser(userResult)
        return getOrCreateParticipant(supabase, null, null)
      })
      .then(function (p) {
        setParticipant(p)
        if (!p) {
          setLoading(false)
          return
        }
        return Promise.all([
          supabase.from('participant_stats').select('*').eq('participant_id', p.id).maybeSingle(),
          supabase.from('achievements').select('*').order('sort_order', { ascending: true }),
          supabase.from('participant_achievements').select('achievement_code, unlocked_at').eq('participant_id', p.id),
          supabase.from('performances').select('id, song, artist_name, artwork_url, nota_final, vocal_score, created_at').eq('participant_id', p.id).order('created_at', { ascending: false }).limit(50),
          loadReceivedChallenges(supabase, p.id)
        ]).then(function (results) {
          var statsResult = results[0]
          var achievementsResult = results[1]
          var unlockedResult = results[2]
          var performancesResult = results[3]
          var receivedChallenges = results[4] || []

          setStats(statsResult.data || null)
          setAchievements(achievementsResult.data || [])
          // Solo mostramos posicion si ya existe una fila real en
          // participant_stats -- sin eso, "rankear" a alguien que nunca
          // canto daba numeros absurdos como "#5 de 4" (peor posicion que
          // el total de gente rankeada).
          if (statsResult.data) {
            getGlobalXpRank(supabase, statsResult.data.xp).then(setRank)
          } else {
            setRank(null)
          }

          // Fase 5: cuantos desafios 1 a 1 todavia no supera -- "superado"
          // se calcula al vuelo comparando con su mejor nota real, no se
          // guarda un estado aparte (ver lib/challenges.js).
          var myBestScore = statsResult.data && statsResult.data.best_score !== null && statsResult.data.best_score !== undefined
            ? Number(statsResult.data.best_score)
            : null
          var pending = receivedChallenges.filter(function (c) {
            return !(myBestScore !== null && myBestScore >= Number(c.targetScore))
          }).length
          setPendingChallengeCount(pending)

          var map = {}
          ;(unlockedResult.data || []).forEach(function (row) {
            map[row.achievement_code] = row.unlocked_at
          })
          setUnlockedMap(map)
          setPerformances(performancesResult.data || [])
          setLoading(false)
        })
      })
      .catch(function () {
        setLoading(false)
      })
  }, [])

  useEffect(function () {
    load()
    // Si vuelve de Google recien autenticado, la sesion puede llegar un
    // instante despues del primer render — este listener recarga todo el
    // perfil apenas eso pasa, sin que la persona tenga que recargar a mano.
    var subscription = supabase.auth.onAuthStateChange(function () {
      load()
    })
    return function () {
      if (subscription && subscription.data && subscription.data.subscription) {
        subscription.data.subscription.unsubscribe()
      }
    }
  }, [load])

  function handleConnectGoogle() {
    setConnectState('Redirigiendo...')
    signInWithGoogle(supabase).then(function (result) {
      if (result.error) setConnectState('No se pudo conectar: ' + result.error)
    })
  }

  function handleSignOut() {
    signOutParticipant(supabase).then(function () {
      load()
    })
  }

  function startEditName() {
    setNameDraft(participant ? (participant.display_name || '') : '')
    setEditingName(true)
  }

  function saveName() {
    if (!participant) return
    var trimmed = nameDraft.trim()
    if (!trimmed) {
      setEditingName(false)
      return
    }
    touchParticipantProfile(supabase, participant.id, trimmed, participant.avatar).then(function () {
      setParticipant(function (prev) { return prev ? { ...prev, display_name: trimmed } : prev })
      setEditingName(false)
    })
  }

  function chooseAvatar(emoji) {
    if (!participant) return
    touchParticipantProfile(supabase, participant.id, participant.display_name, emoji).then(function () {
      setParticipant(function (prev) { return prev ? { ...prev, avatar: emoji } : prev })
      setPickingAvatar(false)
    })
  }

  function handlePhotoChange(e) {
    var file = e.target.files && e.target.files[0]
    if (!file || !participant) return
    setUploadingPhoto(true)
    resizeToSquarePng(file)
      .then(function (dataUrl) {
        return updateParticipantPhoto(supabase, participant.id, dataUrl).then(function (result) {
          setUploadingPhoto(false)
          if (!result.error) {
            setParticipant(function (prev) { return prev ? { ...prev, photo_url: dataUrl } : prev })
          }
        })
      })
      .catch(function () {
        setUploadingPhoto(false)
      })
  }

  function handleRemovePhoto() {
    if (!participant) return
    updateParticipantPhoto(supabase, participant.id, null).then(function (result) {
      if (!result.error) {
        setParticipant(function (prev) { return prev ? { ...prev, photo_url: null } : prev })
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)', color: '#fff' }}>
        Cargando tu perfil...
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: 'var(--bg-page)', color: '#fff' }}>
        <p>No pudimos cargar tu perfil.</p>
        <Link to={backToRegistroHref} className="underline">Ir a Retroke</Link>
      </div>
    )
  }

  var xp = stats ? stats.xp || 0 : 0
  var levelInfo = computeLevel(xp)
  var levelIndex = LEVELS.findIndex(function (l) { return l.level === levelInfo.level })
  var nextLevel = levelIndex >= 0 && levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null
  var progressPct = nextLevel
    ? Math.max(0, Math.min(100, ((xp - levelInfo.minXp) / (nextLevel.minXp - levelInfo.minXp)) * 100))
    : 100

  return (
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--bg-page)', color: '#fff' }}>
      <style>{`
        .profile-wrap { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
        .profile-card { border-radius: 20px; padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); }
        .profile-avatar-btn { width: 84px; height: 84px; border-radius: 9999px; font-size: 40px; display: flex; align-items: center; justify-content: center; background: rgba(233,30,140,0.15); border: 2px solid rgba(244,208,79,0.55); cursor: pointer; }
        .profile-avatar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; }
        .profile-avatar-option { font-size: 26px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.06); text-align: center; cursor: pointer; border: none; }
        .profile-name-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; padding: 8px 12px; color: #fff; font-size: 18px; font-weight: 700; }
        .profile-progress-track { width: 100%; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden; margin-top: 8px; }
        .profile-progress-fill { height: 100%; background: linear-gradient(90deg, #E91E8C, #8B5CF6); }
        .profile-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
        .profile-stat-box { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.05); }
        .profile-stat-label { font-size: 11px; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.05em; }
        .profile-stat-value { font-size: 20px; font-weight: 700; margin-top: 2px; color: #F4D03F; }
        .profile-achv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px; }
        .profile-achv {
          border-radius: 16px; padding: 14px 10px; text-align: center;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.15s ease;
        }
        .profile-achv.unlocked {
          border-color: rgba(244,208,63,0.4);
          background: linear-gradient(160deg, rgba(244,208,63,0.1), rgba(233,30,140,0.06));
          box-shadow: 0 0 0 1px rgba(244,208,63,0.15), 0 6px 18px -8px rgba(244,208,63,0.35);
        }
        .profile-achv.locked { opacity: 0.4; filter: grayscale(0.6); }
        .profile-achv-icon-wrap {
          width: 42px; height: 42px; margin: 0 auto; border-radius: 9999px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
        }
        .profile-achv.unlocked .profile-achv-icon-wrap { background: rgba(244,208,63,0.15); }
        .profile-achv-icon { font-size: 22px; }
        .profile-achv-name { font-size: 12px; font-weight: 700; margin-top: 8px; }
        .profile-achv-date { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; }
        .profile-achv-date.unlocked-date { color: #F4D03F; font-weight: 600; }
        .profile-history-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .profile-history-art { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .profile-history-text { min-width: 0; flex: 1; }
        .profile-history-song { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-history-meta { font-size: 12px; color: rgba(255,255,255,0.5); }
        .profile-history-nota { font-weight: 700; color: #F4D03F; flex-shrink: 0; }
        .profile-connect-banner { border-radius: 16px; padding: 14px 16px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.4); display: flex; flex-direction: column; gap: 8px; }
        .profile-avatar-btn { overflow: hidden; padding: 0; }
        .profile-avatar-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 9999px; }
        .profile-photo-btn { font-size: 12px; font-weight: 600; color: #8B5CF6; cursor: pointer; }
      `}</style>

      <div className="profile-wrap">
        <Link
          to="/world"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            borderRadius: 16,
            padding: '12px 16px',
            background: 'linear-gradient(90deg, rgba(233,30,140,0.16), rgba(139,92,246,0.16))',
            border: '1px solid rgba(139,92,246,0.4)',
            textDecoration: 'none',
            color: '#fff'
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>🌐 Retroke World — rankings, desafíos y quién está cantando ahora</span>
          <span style={{ fontSize: 13, color: '#F4D03F' }}>→</span>
        </Link>

        {pendingChallengeCount > 0 && (
          <Link
            to="/desafios"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              borderRadius: 16,
              padding: '12px 16px',
              background: 'rgba(244,208,63,0.12)',
              border: '1px solid rgba(244,208,63,0.4)',
              textDecoration: 'none',
              color: '#fff'
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              🥊 {pendingChallengeCount === 1 ? 'Te desafiaron a superar una nota' : 'Te desafiaron ' + pendingChallengeCount + ' veces a superar una nota'}
            </span>
            <span style={{ fontSize: 13, color: '#F4D03F' }}>→</span>
          </Link>
        )}

        <div className="profile-card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            type="button"
            className="profile-avatar-btn"
            onClick={function () { if (!participant.photo_url) setPickingAvatar(!pickingAvatar) }}
          >
            {participant.photo_url ? (
              <img src={participant.photo_url} alt="" className="profile-avatar-photo" />
            ) : (
              participant.avatar || '🎤'
            )}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="profile-name-input"
                  value={nameDraft}
                  onChange={function (e) { setNameDraft(e.target.value) }}
                  autoFocus
                />
                <button type="button" onClick={saveName} style={{ color: '#F4D03F', fontWeight: 700 }}>Guardar</button>
              </div>
            ) : (
              <div onClick={startEditName} style={{ fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>
                {participant.display_name || 'Cantante Retroke'} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>✏️</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>🏅 {levelInfo.name}</span>
              {rank && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#F4D03F',
                    background: 'rgba(244,208,63,0.12)',
                    border: '1px solid rgba(244,208,63,0.4)',
                    borderRadius: 999,
                    padding: '2px 9px'
                  }}
                >
                  #{rank.rank} de {rank.total} en Retroke
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <label className="profile-photo-btn">
                {uploadingPhoto ? 'Subiendo...' : participant.photo_url ? '📷 Cambiar foto' : '📷 Subir foto'}
                <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
              </label>
              {participant.photo_url && (
                <button type="button" onClick={handleRemovePhoto} className="profile-photo-btn" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>

        {pickingAvatar && !participant.photo_url && (
          <div className="profile-card">
            <div className="profile-avatar-grid">
              {AVATAR_OPTIONS.map(function (emoji) {
                return (
                  <button key={emoji} type="button" className="profile-avatar-option" onClick={function () { chooseAvatar(emoji) }}>
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!authUser && (
          <div className="profile-connect-banner">
            <div style={{ fontWeight: 700 }}>Conecta tu cuenta para no perder tu progreso</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Hoy tu perfil vive solo en este celular. Si conectas Google, lo vas a poder recuperar aunque cambies de dispositivo.
            </div>
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="w-full h-11 rounded-xl font-bold text-white"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Conectar con Google {connectState && '· ' + connectState}
            </button>
          </div>
        )}

        {authUser && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Conectado como {authUser.email}</span>
            <button type="button" onClick={handleSignOut} className="underline">Cerrar sesión</button>
          </div>
        )}

        <div className="profile-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{xp} XP</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{nextLevel ? nextLevel.minXp + ' XP para ' + nextLevel.name : 'Nivel máximo 🎉'}</span>
          </div>
          <div className="profile-progress-track">
            <div className="profile-progress-fill" style={{ width: progressPct + '%' }} />
          </div>

          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <div className="profile-stat-label">Presentaciones</div>
              <div className="profile-stat-value">{stats ? stats.total_performances || 0 : 0}</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-label">Mejor puntaje</div>
              <div className="profile-stat-value">{stats && stats.best_score !== null && stats.best_score !== undefined ? stats.best_score + '/100' : '—'}</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-label">Racha actual</div>
              <div className="profile-stat-value">{stats ? stats.current_streak || 0 : 0} 🔥</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-label">Mejor racha</div>
              <div className="profile-stat-value">{stats ? stats.best_streak || 0 : 0}</div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            🏅 Logros {achievements.length > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>· {Object.keys(unlockedMap).length}/{achievements.length}</span>}
          </div>
          <div className="profile-achv-grid">
            {achievements.map(function (a) {
              var unlockedAt = unlockedMap[a.code]
              return (
                <div key={a.code} className={'profile-achv' + (unlockedAt ? ' unlocked' : ' locked')} title={a.description || ''}>
                  <div className="profile-achv-icon-wrap">
                    <span className="profile-achv-icon">{a.icon || '🏅'}</span>
                  </div>
                  <div className="profile-achv-name">{a.name}</div>
                  {unlockedAt ? (
                    <div className="profile-achv-date unlocked-date">{formatDate(unlockedAt)}</div>
                  ) : (
                    <div className="profile-achv-date">Bloqueado</div>
                  )}
                </div>
              )
            })}
            {achievements.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Aún no hay logros configurados.</div>}
          </div>
        </div>

        <div className="profile-card">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Historial</div>
          {performances.length === 0 && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
              Todavía no has cantado — ¡anímate la próxima vez que veas el QR!
            </div>
          )}
          {performances.map(function (p) {
            return (
              <div key={p.id} className="profile-history-row">
                {p.artwork_url ? (
                  <img src={p.artwork_url} alt="" className="profile-history-art" />
                ) : (
                  <div className="profile-history-art">🎵</div>
                )}
                <div className="profile-history-text">
                  <div className="profile-history-song">{p.song || 'Canción'}</div>
                  <div className="profile-history-meta">
                    {p.artist_name ? p.artist_name + ' · ' : ''}{formatDate(p.created_at)}
                  </div>
                </div>
                <div className="profile-history-nota">
                  {p.nota_final !== null && p.nota_final !== undefined ? Number(p.nota_final).toFixed(1) : '—'}
                </div>
              </div>
            )
          })}
        </div>

        <Link to={backToRegistroHref} className="text-center text-sm underline" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Volver a Retroke — inscríbete para cantar
        </Link>
      </div>
    </div>
  )
}
