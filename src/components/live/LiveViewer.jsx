import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Room, RoomEvent } from 'livekit-client'
import { supabase } from '../../lib/supabase'
import { getOrCreateParticipant, touchParticipantProfile } from '../../lib/participant'
import { validateComment } from '../../lib/profanityFilter'
import RetrokeIcon from '../retroke/RetrokeIcon'

// Retroke Live -- pantalla de espectador (Fase 4, MVP tecnico + chat/
// reacciones). Solo se suscribe: jamas pide camara/microfono propio, jamas
// puede publicar video/audio (el grant lo emite /api/live-viewer-token y
// siempre es subscribe-only). No hay ningun boton que lleve a /registro ni
// a la cola -- "ver en vivo" nunca es "entrar a cantar".
//
// Chat: los comentarios se publican via /api/live-comment (nunca insert
// directo a Supabase desde aca) -- ese endpoint es el que de verdad corre
// el filtro de garabotos, este componente solo da el aviso instantaneo.
// Reacciones: emojis flotantes vía Supabase Realtime Broadcast, efimero,
// sin escribir nada a la base de datos (igual patron ya evaluado en la
// arquitectura de Fase 2 para esta funcion).
var STATUS_LABEL = {
  offline: 'Sin transmision',
  starting: 'Preparando transmision...',
  active: 'En vivo',
  reconnecting: 'Reconexion en curso...',
  degraded: 'Calidad reducida por señal debil',
  audio_only: 'Solo audio -- video pausado por señal debil',
  ended: 'Transmision finalizada',
  error: 'No se pudo conectar'
}

var REACTION_EMOJIS = ['🔥', '👏', '❤️', '🎤', '😂']

function venueName(row) {
  if (row.bars && row.bars.name) return row.bars.name
  if (row.workspaces && row.workspaces.name) return row.workspaces.name
  return 'Escenario Retroke'
}

function timeAgo(iso) {
  var diffMs = Date.now() - new Date(iso).getTime()
  var mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return mins + ' min'
  var hours = Math.floor(mins / 60)
  return hours + ' h'
}

export default function LiveViewer(props) {
  var liveSessionId = props.liveSessionId

  // OJO: video y audio SIEMPRE estan montados en el DOM (nunca detras de un
  // if condicional) -- el track puede llegar por WebSocket antes de que
  // React termine de pintar el elemento, y si en ese momento el
  // <video>/<audio> todavia no existe, track.attach() no tiene donde
  // engancharse y queda en negro para siempre. Montar siempre y superponer
  // el mensaje de estado encima evita esa carrera.
  var videoRef = useRef(null)
  var audioRef = useRef(null)
  var roomRef = useRef(null)
  var commentsEndRef = useRef(null)
  var reactionChannelRef = useRef(null)
  var particleIdRef = useRef(0)

  var rowState = useState(null)
  var row = rowState[0]
  var setRow = rowState[1]

  var connStatusState = useState('connecting') // connecting | connected | ended | error
  var connStatus = connStatusState[0]
  var setConnStatus = connStatusState[1]

  var viewerCountState = useState(0)
  var viewerCount = viewerCountState[0]
  var setViewerCount = viewerCountState[1]

  var needsTapForSoundState = useState(false)
  var needsTapForSound = needsTapForSoundState[0]
  var setNeedsTapForSound = needsTapForSoundState[1]

  var participantState = useState(null)
  var participant = participantState[0]
  var setParticipant = participantState[1]

  var nameInputState = useState('')
  var nameInput = nameInputState[0]
  var setNameInput = nameInputState[1]

  var commentsState = useState([]) // null todavia no cargados; [] cargados sin comentarios
  var comments = commentsState[0]
  var setComments = commentsState[1]

  var commentDraftState = useState('')
  var commentDraft = commentDraftState[0]
  var setCommentDraft = commentDraftState[1]

  var commentErrorState = useState('')
  var commentError = commentErrorState[0]
  var setCommentError = commentErrorState[1]

  var sendingCommentState = useState(false)
  var sendingComment = sendingCommentState[0]
  var setSendingComment = sendingCommentState[1]

  var particlesState = useState([])
  var particles = particlesState[0]
  var setParticles = particlesState[1]

  // Identidad anonima (o cuenta conectada) -- misma infraestructura que ya
  // usa el resto de la app para inscribirse a cantar / comentar en World.
  useEffect(function () {
    getOrCreateParticipant(supabase).then(setParticipant).catch(function () { setParticipant(null) })
  }, [])

  useEffect(function () {
    if (!liveSessionId) return

    var cancelled = false

    supabase
      .from('live_sessions')
      .select('id,room_name,status,current_singer,bar_id,workspace_id,bars(name,city),workspaces(name,type)')
      .eq('id', liveSessionId)
      .maybeSingle()
      .then(function (result) {
        if (cancelled) return
        if (result.error || !result.data) {
          setConnStatus('error')
          return
        }
        setRow(result.data)
      })

    var channel = supabase
      .channel('live-viewer-' + liveSessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: 'id=eq.' + liveSessionId }, function (payload) {
        if (payload.new) setRow(function (prev) { return prev ? Object.assign({}, prev, payload.new) : payload.new })
      })
      .subscribe()

    return function () {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [liveSessionId])

  // Chat: carga los ultimos comentarios y se suscribe a los nuevos.
  useEffect(function () {
    if (!liveSessionId) return
    var cancelled = false

    supabase
      .from('live_comments')
      .select('id,display_name,avatar,text,created_at')
      .eq('live_session_id', liveSessionId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (result) {
        if (cancelled) return
        setComments((result.data || []).slice().reverse())
      })

    var chatChannel = supabase
      .channel('live-chat-' + liveSessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_comments', filter: 'live_session_id=eq.' + liveSessionId }, function (payload) {
        setComments(function (prev) { return prev.concat([payload.new]) })
      })
      .subscribe()

    return function () {
      cancelled = true
      supabase.removeChannel(chatChannel)
    }
  }, [liveSessionId])

  useEffect(function () {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ block: 'end' })
    }
  }, [comments])

  // Reacciones: canal de Broadcast efimero, sin escribir a la base de
  // datos. Cada tap manda un emoji; todos los que estan viendo lo reciben
  // y ven la animacion flotante.
  useEffect(function () {
    if (!liveSessionId) return
    var reactionChannel = supabase.channel('live-reactions-' + liveSessionId)
    reactionChannel
      .on('broadcast', { event: 'reaction' }, function (payload) {
        spawnParticle(payload.payload && payload.payload.emoji)
      })
      .subscribe()
    reactionChannelRef.current = reactionChannel

    return function () {
      supabase.removeChannel(reactionChannel)
      reactionChannelRef.current = null
    }
  }, [liveSessionId])

  function spawnParticle(emoji) {
    if (!emoji) return
    particleIdRef.current += 1
    var id = particleIdRef.current
    var left = 10 + Math.random() * 80
    setParticles(function (prev) { return prev.concat([{ id: id, emoji: emoji, left: left }]) })
    setTimeout(function () {
      setParticles(function (prev) { return prev.filter(function (p) { return p.id !== id } ) })
    }, 2200)
  }

  function handleReactionTap(emoji) {
    spawnParticle(emoji)
    if (reactionChannelRef.current) {
      reactionChannelRef.current.send({ type: 'broadcast', event: 'reaction', payload: { emoji: emoji } })
    }
  }

  useEffect(function () {
    if (!row || !row.room_name) return
    if (row.status === 'offline' || row.status === 'ended') {
      setConnStatus('ended')
      return
    }
    if (roomRef.current) return

    var cancelled = false

    fetch('/api/live-viewer-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live_session_id: liveSessionId })
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (cancelled) return
        if (data.error) throw new Error(data.error)

        var room = new Room()
        roomRef.current = room

        room.on(RoomEvent.TrackSubscribed, function (track) {
          if (track.kind === 'video' && videoRef.current) {
            track.attach(videoRef.current)
          }
          if (track.kind === 'audio' && audioRef.current) {
            track.attach(audioRef.current)
            var playPromise = audioRef.current.play()
            if (playPromise && playPromise.catch) {
              playPromise.catch(function () { setNeedsTapForSound(true) })
            }
          }
        })
        room.on(RoomEvent.TrackUnsubscribed, function (track) { track.detach() })
        room.on(RoomEvent.ParticipantConnected, function () { setViewerCount(room.numParticipants) })
        room.on(RoomEvent.ParticipantDisconnected, function () { setViewerCount(room.numParticipants) })
        room.on(RoomEvent.Disconnected, function () { setConnStatus('ended') })

        return room.connect(data.url, data.token).then(function () {
          if (cancelled) return
          setViewerCount(room.numParticipants)
          setConnStatus('connected')
        })
      })
      .catch(function () {
        if (!cancelled) setConnStatus('error')
      })

    return function () { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row && row.room_name, row && row.status])

  useEffect(function () {
    return function () {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
    }
  }, [])

  function handleEnableSound() {
    if (audioRef.current) {
      audioRef.current.muted = false
      audioRef.current.play().then(function () { setNeedsTapForSound(false) }).catch(function () {})
    }
  }

  function handleSaveName(e) {
    e.preventDefault()
    var name = nameInput.trim()
    if (!name || !participant) return
    touchParticipantProfile(supabase, participant.id, name, participant.avatar)
    setParticipant(Object.assign({}, participant, { display_name: name }))
  }

  function handleSendComment(e) {
    e.preventDefault()
    setCommentError('')
    var check = validateComment(commentDraft)
    if (!check.ok) {
      if (check.reason === 'profanity') setCommentError('Ese comentario tiene lenguaje que no dejamos publicar aca.')
      else if (check.reason === 'too_long') setCommentError('Muy largo -- maximo 220 caracteres.')
      return
    }
    setSendingComment(true)
    fetch('/api/live-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        live_session_id: liveSessionId,
        participant_id: participant ? participant.id : null,
        display_name: (participant && participant.display_name) || 'Espectador Retroke',
        avatar: participant ? participant.avatar : null,
        text: check.text
      })
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        setSendingComment(false)
        if (data.error) {
          setCommentError(data.message || 'No se pudo enviar el comentario.')
          return
        }
        setCommentDraft('')
        // No hace falta agregarlo a mano: llega solo por la suscripcion de
        // postgres_changes de arriba (igual patron que el resto de World).
      })
      .catch(function () {
        setSendingComment(false)
        setCommentError('No se pudo enviar el comentario.')
      })
  }

  var displayStatus = row ? row.status : 'starting'
  var showOverlay = connStatus !== 'connected'
  var needsName = participant && !participant.display_name

  return (
    <div className="rk-live-viewer">
      <style>{`
        .rk-live-viewer { max-width: 720px; margin: 0 auto; padding: 24px 16px 40px; color: #fff; }
        .rk-lv-video-wrap { position: relative; aspect-ratio: 16/9; border-radius: 22px; overflow: hidden; background: #0c0b10; border: 1px solid rgba(255,255,255,0.12); }
        .rk-lv-video-wrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rk-lv-badge { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; background: #e91e8c; padding: 4px 10px; border-radius: 999px; }
        .rk-lv-viewers { position: absolute; top: 14px; right: 14px; font-size: 12px; font-weight: 600; background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 999px; display: flex; align-items: center; gap: 6px; }
        .rk-lv-status-msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: rgba(255,255,255,0.7); font-size: 14px; background: rgba(5,3,10,0.55); z-index: 3; }
        .rk-lv-sound-btn { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1a0b2e; background: #fff; padding: 10px 18px; border: none; border-radius: 999px; z-index: 2; }

        .rk-lv-reactions-bar { position: absolute; right: 10px; bottom: 14px; display: flex; flex-direction: column; gap: 8px; z-index: 2; }
        .rk-lv-reaction-btn { width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.2); font-size: 17px; display: flex; align-items: center; justify-content: center; }
        .rk-lv-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
        .rk-lv-particle { position: absolute; bottom: 50px; font-size: 26px; animation: rkLvFloatUp 2.2s ease-out forwards; }
        @keyframes rkLvFloatUp {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          12% { opacity: 1; transform: translateY(-14px) scale(1); }
          100% { transform: translateY(-180px) scale(1.15); opacity: 0; }
        }

        .rk-lv-info { padding: 18px 4px; }
        .rk-lv-title { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .rk-lv-meta { font-size: 13px; color: rgba(255,255,255,0.55); }
        .rk-lv-singer { display: inline-flex; align-items: center; gap: 8px; background: rgba(244,208,63,0.1); border: 1px solid rgba(244,208,63,0.3); color: #f4d03f; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 999px; margin-top: 14px; }
        .rk-lv-back { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 20px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }

        .rk-lv-chat { margin-top: 22px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(233,30,140,0.25); overflow: hidden; }
        .rk-lv-chat-head { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px; }
        .rk-lv-chat-list { max-height: 340px; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
        .rk-lv-chat-empty { color: rgba(255,255,255,0.4); font-size: 12.5px; text-align: center; padding: 20px 0; }
        .rk-lv-chat-row { display: flex; gap: 9px; align-items: flex-start; }
        .rk-lv-chat-avatar { width: 26px; height: 26px; border-radius: 50%; background: rgba(233,30,140,0.15); border: 1px solid rgba(233,30,140,0.3); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .rk-lv-chat-body { min-width: 0; }
        .rk-lv-chat-name { font-size: 12px; font-weight: 700; color: #f4d03f; margin-right: 6px; }
        .rk-lv-chat-time { font-size: 10px; color: rgba(255,255,255,0.35); }
        .rk-lv-chat-text { font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.4; word-break: break-word; }

        .rk-lv-chat-form { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
        .rk-lv-chat-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 999px; padding: 9px 16px; font-size: 13px; color: #fff; outline: none; }
        .rk-lv-chat-input::placeholder { color: rgba(255,255,255,0.35); }
        .rk-lv-chat-send { font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; font-size: 12px; padding: 9px 18px; border-radius: 999px; border: none; background: #e91e8c; color: #fff; white-space: nowrap; }
        .rk-lv-chat-send:disabled { opacity: 0.5; }
        .rk-lv-chat-error { font-size: 11.5px; color: #ff9a9a; padding: 0 16px 10px; }
        .rk-lv-name-form { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
      `}</style>

      <div className="rk-lv-video-wrap">
        <video ref={videoRef} autoPlay muted playsInline />
        <audio ref={audioRef} autoPlay />

        <div className="rk-lv-particles">
          {particles.map(function (p) {
            return <span key={p.id} className="rk-lv-particle" style={{ left: p.left + '%' }}>{p.emoji}</span>
          })}
        </div>

        {!showOverlay && (
          <>
            <span className="rk-lv-badge">{displayStatus === 'active' ? 'En vivo' : STATUS_LABEL[displayStatus]}</span>
            <span className="rk-lv-viewers"><RetrokeIcon name="users" size={13} /> {viewerCount}</span>
            {needsTapForSound && (
              <button className="rk-lv-sound-btn" onClick={handleEnableSound}>Activar sonido</button>
            )}
            <div className="rk-lv-reactions-bar">
              {REACTION_EMOJIS.map(function (emoji) {
                return (
                  <button key={emoji} className="rk-lv-reaction-btn" onClick={function () { handleReactionTap(emoji) }}>
                    {emoji}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {showOverlay && (
          <div className="rk-lv-status-msg">
            {connStatus === 'connecting' && 'Conectando...'}
            {connStatus === 'ended' && 'Esta transmision ya termino. Vuelve a Retroke World para ver quien esta en vivo ahora.'}
            {connStatus === 'error' && 'No se pudo conectar. Puede que la transmision haya terminado justo ahora.'}
          </div>
        )}
      </div>

      <div className="rk-lv-info">
        <div className="rk-lv-title">{row ? venueName(row) : 'Cargando...'}</div>
        {row && row.bars && row.bars.city && <div className="rk-lv-meta">{row.bars.city}</div>}
        {row && row.current_singer && (
          <div className="rk-lv-singer">
            <RetrokeIcon name="mic" size={13} /> cantando ahora: {row.current_singer}
          </div>
        )}
      </div>

      <div className="rk-lv-chat">
        <div className="rk-lv-chat-head"><RetrokeIcon name="chart" size={14} /> Chat en vivo</div>
        <div className="rk-lv-chat-list">
          {comments.length === 0 && <div className="rk-lv-chat-empty">Todavia no hay comentarios. Se el primero en saludar.</div>}
          {comments.map(function (c) {
            return (
              <div key={c.id} className="rk-lv-chat-row">
                <span className="rk-lv-chat-avatar">{c.avatar || '🎤'}</span>
                <div className="rk-lv-chat-body">
                  <span className="rk-lv-chat-name">{c.display_name}</span>
                  <span className="rk-lv-chat-time">{timeAgo(c.created_at)}</span>
                  <div className="rk-lv-chat-text">{c.text}</div>
                </div>
              </div>
            )
          })}
          <div ref={commentsEndRef} />
        </div>

        {commentError && <div className="rk-lv-chat-error">{commentError}</div>}

        {needsName ? (
          <form className="rk-lv-name-form" onSubmit={handleSaveName}>
            <input
              className="rk-lv-chat-input"
              placeholder="Tu nombre para comentar"
              value={nameInput}
              maxLength={40}
              onChange={function (e) { setNameInput(e.target.value) }}
            />
            <button className="rk-lv-chat-send" type="submit">Listo</button>
          </form>
        ) : (
          <form className="rk-lv-chat-form" onSubmit={handleSendComment}>
            <input
              className="rk-lv-chat-input"
              placeholder="Escribe un comentario..."
              value={commentDraft}
              maxLength={220}
              onChange={function (e) { setCommentDraft(e.target.value) }}
            />
            <button className="rk-lv-chat-send" type="submit" disabled={sendingComment || !commentDraft.trim()}>
              Enviar
            </button>
          </form>
        )}
      </div>

      <Link to="/world" className="rk-lv-back">← Volver a Retroke World</Link>
    </div>
  )
}
