import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LEVELS, computeLevel } from '../lib/gamification'
import { getOrCreateParticipant, touchParticipantProfile, updateParticipantPhoto, updateInstagramSettings, signInWithGoogle, signOutParticipant } from '../lib/participant'
import { getGlobalXpRank } from '../lib/ranking'
import { loadReceivedChallenges } from '../lib/challenges'
import { loadFollowCounts, loadFollowingList, loadFollowersList } from '../lib/follows'
import { loadStatuses, createStatus, deleteStatus, STATUS_MAX_LENGTH } from '../lib/statuses'
import ShareButton from '../components/share/ShareButton'
import ShareModal from '../components/share/ShareModal'
import ShareRankCard from '../components/share/ShareRankCard'
import ShareAchievementCard from '../components/share/ShareAchievementCard'
import RetrokeSection from '../components/retroke/RetrokeSection'
import RetrokeScore from '../components/retroke/RetrokeScore'
import RetrokeIcon from '../components/retroke/RetrokeIcon'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'

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
  var [followCounts, setFollowCounts] = useState(null)
  var [followingList, setFollowingList] = useState(null)
  var [followersList, setFollowersList] = useState(null)
  var [statuses, setStatuses] = useState(null)
  var [statusDraft, setStatusDraft] = useState('')
  var [postingStatus, setPostingStatus] = useState(false)
  var [statusError, setStatusError] = useState(null)
  var [editingInstagram, setEditingInstagram] = useState(false)
  var [instagramDraft, setInstagramDraft] = useState('')
  var [showInstagramDraft, setShowInstagramDraft] = useState(false)
  var [savingInstagram, setSavingInstagram] = useState(false)
  // Fase 14 ("Viralidad"): null | { type: 'rank' } | { type: 'achievement', achievement }
  var [shareModal, setShareModal] = useState(null)
  var shareCardRef = useRef(null)

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
          loadReceivedChallenges(supabase, p.id),
          loadFollowCounts(supabase, p.id),
          loadFollowingList(supabase, p.id),
          loadFollowersList(supabase, p.id),
          loadStatuses(supabase, p.id, p.id)
        ]).then(function (results) {
          var statsResult = results[0]
          var achievementsResult = results[1]
          var unlockedResult = results[2]
          var performancesResult = results[3]
          var receivedChallenges = results[4] || []

          setFollowCounts(results[5])
          setFollowingList(results[6] || [])
          setFollowersList(results[7] || [])
          setStatuses(results[8] || [])

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

  // Fase 9: "Estados" -- texto libre corto, solo con Google conectado (ver
  // lib/statuses.js). Sin edicion: si algo esta mal, se borra y se publica
  // de nuevo.
  function handlePostStatus() {
    if (!participant) return
    setStatusError(null)
    setPostingStatus(true)
    createStatus(supabase, participant.id, statusDraft).then(function (result) {
      setPostingStatus(false)
      if (result.error) {
        setStatusError(result.error)
        return
      }
      setStatusDraft('')
      loadStatuses(supabase, participant.id, participant.id).then(setStatuses)
    })
  }

  function handleDeleteStatus(statusId) {
    deleteStatus(supabase, statusId).then(function (result) {
      if (!result.error) {
        setStatuses(function (prev) { return (prev || []).filter(function (s) { return s.id !== statusId }) })
      }
    })
  }

  // Fase 10: puente opcional a Instagram, apagado por defecto (ver
  // lib/participant.js). Solo un link de referencia, no una conexion real
  // con la API de Instagram.
  function startEditInstagram() {
    setInstagramDraft(participant && participant.instagram_handle ? participant.instagram_handle : '')
    setShowInstagramDraft(!!(participant && participant.show_instagram))
    setEditingInstagram(true)
  }

  function saveInstagram() {
    if (!participant) return
    setSavingInstagram(true)
    updateInstagramSettings(supabase, participant.id, instagramDraft, showInstagramDraft).then(function (result) {
      setSavingInstagram(false)
      if (!result.error) {
        var cleanHandle = instagramDraft.trim().replace(/^@/, '')
        setParticipant(function (prev) {
          return prev ? { ...prev, instagram_handle: cleanHandle || null, show_instagram: !!showInstagramDraft && !!cleanHandle } : prev
        })
        setEditingInstagram(false)
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--rk-bg-gradient)', color: 'var(--rk-text)' }}>
        Cargando tu perfil...
      </div>
    )
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: 'var(--rk-bg-gradient)', color: 'var(--rk-text)' }}>
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
    <div className="min-h-screen px-5 py-8" style={{ background: 'var(--rk-bg-gradient)', color: 'var(--rk-text)' }}>
      <style>{RETROKE_STYLES}{`
        .profile-wrap { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; position: relative; z-index: var(--rk-z-content); }
        .profile-banner { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-radius: var(--rk-radius-lg); padding: 12px 16px; text-decoration: none; color: var(--rk-text); }
        .profile-banner-world { background: linear-gradient(90deg, rgba(233,30,140,0.16), rgba(139,92,246,0.16)); border: 1px solid var(--rk-border-strong); }
        .profile-banner-challenge { background: rgba(244,208,63,0.12); border: 1px solid rgba(244,208,63,0.4); }
        .profile-banner-text { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
        .profile-avatar-btn { width: 84px; height: 84px; border-radius: var(--rk-radius-pill); font-size: 40px; display: flex; align-items: center; justify-content: center; background: rgba(233,30,140,0.15); border: 2px solid rgba(244,208,79,0.55); cursor: pointer; overflow: hidden; padding: 0; flex-shrink: 0; }
        .profile-avatar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; }
        .profile-avatar-option { font-size: 26px; padding: 8px; border-radius: var(--rk-radius-md); background: var(--rk-surface); text-align: center; cursor: pointer; border: none; }
        .profile-name-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); border-radius: var(--rk-radius-sm); padding: 8px 12px; color: var(--rk-text); font-size: 18px; font-weight: 700; }
        .profile-progress-track { width: 100%; height: 10px; border-radius: var(--rk-radius-pill); background: rgba(255,255,255,0.1); overflow: hidden; margin-top: 8px; }
        .profile-progress-fill { height: 100%; background: linear-gradient(90deg, var(--rk-magenta), var(--rk-purple)); }
        .profile-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 16px; }
        .profile-achv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 10px; }
        .profile-achv {
          border-radius: var(--rk-radius-md); padding: 14px 10px; text-align: center;
          background: var(--rk-surface); border: 1px solid var(--rk-border);
          transition: transform 0.15s ease;
        }
        .profile-achv.unlocked {
          border-color: rgba(244,208,63,0.4);
          background: linear-gradient(160deg, rgba(244,208,63,0.1), rgba(233,30,140,0.06));
          box-shadow: 0 0 0 1px rgba(244,208,63,0.15), 0 6px 18px -8px rgba(244,208,63,0.35);
        }
        .profile-achv.locked { opacity: 0.4; filter: grayscale(0.6); }
        .profile-achv-icon-wrap {
          width: 42px; height: 42px; margin: 0 auto; border-radius: var(--rk-radius-pill);
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
        }
        .profile-achv.unlocked .profile-achv-icon-wrap { background: rgba(244,208,63,0.15); }
        .profile-achv-icon { font-size: 22px; }
        .profile-achv-name { font-size: 12px; font-weight: 700; margin-top: 8px; }
        .profile-achv-date { font-size: 10px; color: var(--rk-text-soft); margin-top: 2px; }
        .profile-achv-date.unlocked-date { color: var(--rk-yellow); font-weight: 600; }
        .profile-achv-share-btn { margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 3px 9px; cursor: pointer; }
        .profile-history-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--rk-border); }
        .profile-history-row:last-child { border-bottom: none; }
        .profile-history-art { width: 44px; height: 44px; border-radius: var(--rk-radius-sm); object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; }
        .profile-history-text { min-width: 0; flex: 1; }
        .profile-history-song { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-history-meta { font-size: 12px; color: var(--rk-text-soft); }
        .profile-history-nota { font-family: var(--rk-font-display); font-weight: 800; color: var(--rk-yellow); flex-shrink: 0; }
        .profile-connect-banner { border-radius: var(--rk-radius-lg); padding: 14px 16px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.4); display: flex; flex-direction: column; gap: 8px; }
        .profile-avatar-photo { width: 100%; height: 100%; object-fit: cover; border-radius: var(--rk-radius-pill); }
        .profile-photo-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--rk-purple); cursor: pointer; background: none; border: none; }
        .profile-follow-subtitle { font-size: 11.5px; font-weight: 700; color: var(--rk-text-soft); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .profile-follow-empty { font-size: 12.5px; color: var(--rk-text-faint); padding: 2px 0 4px; }
        .profile-follow-link { color: var(--rk-yellow); text-decoration: underline; }
        .profile-follow-list { display: flex; flex-direction: column; gap: 2px; }
        .profile-follow-row { display: flex; align-items: center; gap: 10px; padding: 7px 4px; border-radius: var(--rk-radius-sm); text-decoration: none; color: inherit; }
        .profile-follow-row:hover { background: var(--rk-surface-hover); }
        .profile-follow-avatar { font-size: 19px; flex-shrink: 0; }
        .profile-follow-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .profile-status-input {
          width: 100%; resize: none; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
          border-radius: var(--rk-radius-md); padding: 10px 12px; color: var(--rk-text); font-size: 13.5px; font-family: inherit;
        }
        .profile-status-post-btn {
          font-size: 12.5px; font-weight: 700; color: #fff; padding: 7px 16px; border-radius: var(--rk-radius-pill); border: none; cursor: pointer;
          background: linear-gradient(90deg, var(--rk-magenta), var(--rk-purple));
        }
        .profile-status-post-btn:disabled { opacity: 0.4; cursor: default; }
        .profile-status-card { padding: 10px 12px; border-radius: var(--rk-radius-md); background: var(--rk-surface); border: 1px solid var(--rk-border); }
        .profile-status-text { font-size: 13px; line-height: 1.5; word-break: break-word; }
        .profile-status-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; }
        .profile-status-date { font-size: 10.5px; color: var(--rk-text-faint); }
        .profile-status-delete { font-size: 11px; color: var(--rk-text-faint); background: none; border: none; cursor: pointer; text-decoration: underline; }
      `}</style>

      <div className="profile-wrap">
        <Link to="/world" className="profile-banner profile-banner-world">
          <span className="profile-banner-text">
            <RetrokeIcon name="globe" size={15} />
            Retroke World — rankings, desafíos y quién está cantando ahora
          </span>
          <span style={{ fontSize: 13, color: 'var(--rk-yellow)' }}>→</span>
        </Link>

        {pendingChallengeCount > 0 && (
          <Link to="/desafios" className="profile-banner profile-banner-challenge">
            <span className="profile-banner-text">
              <RetrokeIcon name="fire" size={15} glow />
              {pendingChallengeCount === 1 ? 'Te desafiaron a superar una nota' : 'Te desafiaron ' + pendingChallengeCount + ' veces a superar una nota'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--rk-yellow)' }}>→</span>
          </Link>
        )}

        <RetrokeSection variant="hero" eyebrow="Tu perfil" title={<><RetrokeIcon name="mic" size={16} glow /> Identidad</>}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
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
                  <button type="button" onClick={saveName} style={{ color: 'var(--rk-yellow)', fontWeight: 700 }}>Guardar</button>
                </div>
              ) : (
                <div onClick={startEditName} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>
                  {participant.display_name || 'Cantante Retroke'} <RetrokeIcon name="edit" size={13} className="rk-icon" style={{ color: 'var(--rk-text-faint)' }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--rk-text-soft)' }}>
                  <RetrokeIcon name="medal" size={13} /> {levelInfo.name}
                </span>
                {rank && (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: 'var(--rk-yellow)',
                      background: 'rgba(244,208,63,0.12)',
                      border: '1px solid rgba(244,208,63,0.4)',
                      borderRadius: 999,
                      padding: '2px 9px'
                    }}
                  >
                    #{rank.rank} de {rank.total} en Retroke
                  </span>
                )}
                {rank && (
                  <button
                    type="button"
                    onClick={function () { setShareModal({ type: 'rank' }) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 999, padding: '2px 9px', cursor: 'pointer'
                    }}
                  >
                    <RetrokeIcon name="share" size={11} /> Compartir
                  </button>
                )}
                {followCounts && (
                  <span style={{ fontSize: 12, color: 'var(--rk-text-soft)' }}>
                    <strong style={{ color: 'var(--rk-text)' }}>{followCounts.followers}</strong> seguidores · <strong style={{ color: 'var(--rk-text)' }}>{followCounts.following}</strong> siguiendo
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <label className="profile-photo-btn">
                  <RetrokeIcon name="camera" size={13} />
                  {uploadingPhoto ? 'Subiendo...' : participant.photo_url ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
                </label>
                {participant.photo_url && (
                  <button type="button" onClick={handleRemovePhoto} className="profile-photo-btn" style={{ color: 'var(--rk-text-soft)' }}>
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>
        </RetrokeSection>

        <RetrokeSection accent="magenta" eyebrow="Conexiones" title={<><RetrokeIcon name="camera" size={16} glow /> Instagram</>}>
          {!editingInstagram && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: 'var(--rk-text-soft)' }}>
                {participant.show_instagram && participant.instagram_handle ? (
                  <a
                    href={'https://instagram.com/' + participant.instagram_handle}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--rk-yellow)' }}
                  >
                    @{participant.instagram_handle} · visible en tu perfil público
                  </a>
                ) : participant.instagram_handle ? (
                  '@' + participant.instagram_handle + ' · oculto de tu perfil público'
                ) : (
                  'No has agregado tu Instagram todavía (opcional).'
                )}
              </div>
              <button type="button" onClick={startEditInstagram} className="profile-photo-btn">Editar</button>
            </div>
          )}
          {editingInstagram && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="profile-name-input"
                style={{ fontSize: 14, fontWeight: 500 }}
                value={instagramDraft}
                onChange={function (e) { setInstagramDraft(e.target.value) }}
                placeholder="tu_usuario"
                autoFocus
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--rk-text-soft)' }}>
                <input
                  type="checkbox"
                  checked={showInstagramDraft}
                  onChange={function (e) { setShowInstagramDraft(e.target.checked) }}
                />
                Mostrar en mi perfil público (apagado por defecto)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={saveInstagram} disabled={savingInstagram} style={{ color: 'var(--rk-yellow)', fontWeight: 700 }}>
                  {savingInstagram ? 'Guardando…' : 'Guardar'}
                </button>
                <button type="button" onClick={function () { setEditingInstagram(false) }} style={{ color: 'var(--rk-text-soft)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </RetrokeSection>

        {pickingAvatar && !participant.photo_url && (
          <RetrokeSection eyebrow="Personalizar" title="Elige tu avatar">
            <div className="profile-avatar-grid">
              {AVATAR_OPTIONS.map(function (emoji) {
                return (
                  <button key={emoji} type="button" className="profile-avatar-option" onClick={function () { chooseAvatar(emoji) }}>
                    {emoji}
                  </button>
                )
              })}
            </div>
          </RetrokeSection>
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
              style={{ background: 'linear-gradient(90deg, var(--rk-magenta), var(--rk-purple))' }}
            >
              Conectar con Google {connectState && '· ' + connectState}
            </button>
          </div>
        )}

        {authUser && (
          <div style={{ fontSize: 13, color: 'var(--rk-text-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Conectado como {authUser.email}</span>
            <button type="button" onClick={handleSignOut} className="underline">Cerrar sesión</button>
          </div>
        )}

        {authUser && (
          <RetrokeSection accent="purple" eyebrow="Comunidad" title={<><RetrokeIcon name="chat" size={16} glow /> Tus estados</>}>
            <textarea
              className="profile-status-input"
              value={statusDraft}
              onChange={function (e) { setStatusDraft(e.target.value) }}
              placeholder="¿Qué está pasando? (sin comentarios ni DMs, solo reacciones)"
              maxLength={STATUS_MAX_LENGTH}
              rows={2}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--rk-text-faint)' }}>{statusDraft.length}/{STATUS_MAX_LENGTH}</span>
              <button
                type="button"
                onClick={handlePostStatus}
                disabled={postingStatus || !statusDraft.trim()}
                className="profile-status-post-btn"
              >
                {postingStatus ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
            {statusError && <div style={{ fontSize: 11.5, color: '#FF6B6B', marginTop: 6 }}>{statusError}</div>}

            {statuses === null && <div style={{ fontSize: 13, color: 'var(--rk-text-faint)', marginTop: 12 }}>Cargando…</div>}
            {statuses !== null && statuses.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--rk-text-faint)', marginTop: 12 }}>Todavía no has publicado nada.</div>
            )}
            {statuses !== null && statuses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {statuses.map(function (s) {
                  return (
                    <div key={s.id} className="profile-status-card">
                      <div className="profile-status-text">{s.text}</div>
                      <div className="profile-status-footer">
                        <span className="profile-status-date">
                          {formatDate(s.createdAt)}{s.totalReactions > 0 ? ' · ' + s.totalReactions + (s.totalReactions === 1 ? ' reacción' : ' reacciones') : ''}
                        </span>
                        <button type="button" className="profile-status-delete" onClick={function () { handleDeleteStatus(s.id) }}>Borrar</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </RetrokeSection>
        )}

        <RetrokeSection accent="yellow" eyebrow="Progreso" title={<><RetrokeIcon name="star" size={16} glow /> Tu Experiencia</>}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{xp} XP</span>
            <span style={{ color: 'var(--rk-text-soft)' }}>{nextLevel ? nextLevel.minXp + ' XP para ' + nextLevel.name : 'Nivel máximo 🎉'}</span>
          </div>
          <div className="profile-progress-track">
            <div className="profile-progress-fill" style={{ width: progressPct + '%' }} />
          </div>

          <div className="profile-stats-grid">
            <RetrokeScore value={stats ? stats.total_performances || 0 : 0} label="Presentaciones" size="md" color="purple" />
            <RetrokeScore
              value={stats && stats.best_score !== null && stats.best_score !== undefined ? stats.best_score : '—'}
              label="Mejor puntaje"
              size="md"
              color="yellow"
            />
            <RetrokeScore value={stats ? stats.current_streak || 0 : 0} label="Racha actual" size="md" color="magenta" />
            <RetrokeScore value={stats ? stats.best_streak || 0 : 0} label="Mejor racha" size="md" color="green" />
          </div>
        </RetrokeSection>

        <RetrokeSection
          accent="yellow"
          eyebrow="Colección"
          title={<><RetrokeIcon name="trophy" size={16} glow /> Logros {achievements.length > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--rk-text-faint)' }}>· {Object.keys(unlockedMap).length}/{achievements.length}</span>}</>}
        >
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
                    <>
                      <div className="profile-achv-date unlocked-date">{formatDate(unlockedAt)}</div>
                      <button
                        type="button"
                        onClick={function (e) { e.stopPropagation(); setShareModal({ type: 'achievement', achievement: a }) }}
                        className="profile-achv-share-btn"
                      >
                        <RetrokeIcon name="share" size={10} /> Compartir
                      </button>
                    </>
                  ) : (
                    <div className="profile-achv-date">Bloqueado</div>
                  )}
                </div>
              )
            })}
            {achievements.length === 0 && <div style={{ fontSize: 13, color: 'var(--rk-text-soft)' }}>Aún no hay logros configurados.</div>}
          </div>
        </RetrokeSection>

        <RetrokeSection accent="purple" eyebrow="Tu música" title={<><RetrokeIcon name="music" size={16} glow /> Historial</>}>
          {performances.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--rk-text-soft)' }}>
              Todavía no has cantado — ¡anímate la próxima vez que veas el QR!
            </div>
          )}
          {performances.map(function (p) {
            return (
              <div key={p.id} className="profile-history-row">
                {p.artwork_url ? (
                  <img src={p.artwork_url} alt="" className="profile-history-art" />
                ) : (
                  <div className="profile-history-art"><RetrokeIcon name="music" size={16} /></div>
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
        </RetrokeSection>

        <RetrokeSection accent="green" eyebrow="Red" title={<><RetrokeIcon name="users" size={16} glow /> Comunidad</>}>
          <div className="profile-follow-subtitle">Sigues a</div>
          {followingList === null && <div style={{ fontSize: 13, color: 'var(--rk-text-faint)' }}>Cargando…</div>}
          {followingList !== null && followingList.length === 0 && (
            <div className="profile-follow-empty">
              Todavía no sigues a nadie. Ve al <Link to="/ranking" className="profile-follow-link">Ranking Retroke</Link> y sigue a alguien.
            </div>
          )}
          {followingList !== null && followingList.length > 0 && (
            <div className="profile-follow-list">
              {followingList.map(function (f) {
                return (
                  <Link key={f.participantId} to={'/u/' + f.participantId} className="profile-follow-row">
                    <span className="profile-follow-avatar">{f.avatar}</span>
                    <span className="profile-follow-name">{f.name}</span>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="profile-follow-subtitle" style={{ marginTop: 16 }}>Te siguen</div>
          {followersList === null && <div style={{ fontSize: 13, color: 'var(--rk-text-faint)' }}>Cargando…</div>}
          {followersList !== null && followersList.length === 0 && (
            <div className="profile-follow-empty">Todavía nadie te sigue.</div>
          )}
          {followersList !== null && followersList.length > 0 && (
            <div className="profile-follow-list">
              {followersList.map(function (f) {
                return (
                  <Link key={f.participantId} to={'/u/' + f.participantId} className="profile-follow-row">
                    <span className="profile-follow-avatar">{f.avatar}</span>
                    <span className="profile-follow-name">{f.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </RetrokeSection>

        <Link to={backToRegistroHref} className="text-center text-sm underline" style={{ color: 'var(--rk-text-soft)' }}>
          Volver a Retroke — inscríbete para cantar
        </Link>
      </div>

      {shareModal && shareModal.type === 'rank' && rank && (
        <ShareModal onClose={function () { setShareModal(null) }}>
          <ShareRankCard
            ref={shareCardRef}
            name={participant.display_name}
            avatar={participant.avatar}
            photoUrl={participant.photo_url}
            levelName={levelInfo.name}
            rank={rank.rank}
            total={rank.total}
            xp={stats ? stats.xp || 0 : 0}
          />
          <div className="share-modal-actions">
            <ShareButton
              mode="image"
              cardRef={shareCardRef}
              filename={'retroke-ranking-' + (participant.display_name || 'yo') + '.png'}
              title="Mi ranking en Retroke"
              text={'🌎 Estoy #' + rank.rank + ' de ' + rank.total + ' en el Ranking Retroke 🔥'}
            />
          </div>
        </ShareModal>
      )}

      {shareModal && shareModal.type === 'achievement' && (
        <ShareModal onClose={function () { setShareModal(null) }}>
          <ShareAchievementCard
            ref={shareCardRef}
            name={participant.display_name}
            avatar={participant.avatar}
            photoUrl={participant.photo_url}
            levelName={levelInfo.name}
            icon={shareModal.achievement.icon}
            achievementName={shareModal.achievement.name}
            description={shareModal.achievement.description}
          />
          <div className="share-modal-actions">
            <ShareButton
              mode="image"
              cardRef={shareCardRef}
              filename={'retroke-logro-' + shareModal.achievement.code + '.png'}
              title="Logro desbloqueado en Retroke"
              text={'🏆 Desbloqueé "' + shareModal.achievement.name + '" en Retroke 🎤'}
            />
          </div>
        </ShareModal>
      )}
    </div>
  )
}
