import { useEffect, useRef, useState } from 'react'
import { Room } from 'livekit-client'
import { supabase } from '../../lib/supabase'

// Retroke Live -- modulo de control para el DJ Panel (Fase 4, MVP tecnico +
// moderacion de chat). Componente nuevo y aislado: no comparte estado ni
// logica con la cola/Display/sessions existentes.
//
// Flujo, igual al aprobado en la arquitectura:
// 1) "Activar camara y microfono" -> preview 100% local, nada se transmite.
// 2) "Iniciar transmision" -> pide token real a /api/live-token (validado
//    en backend), conecta a LiveKit y recien ahi empieza a publicar.
// 3) "Finalizar transmision" -> corta la conexion y marca la fila de
//    live_sessions como 'ended'.
//
// IMPORTANTE (fix post-prueba real): este componente ahora se monta UNA
// SOLA VEZ en DjPanel.jsx, siempre, no condicionado a si el panel esta
// abierto. Antes se montaba/desmontaba con el boton "Retroke Live" del
// header, y como la conexion vive en un ref de este componente, cerrar el
// panel para volver a la cola desconectaba la transmision. Ahora la
// visibilidad del panel completo es solo un prop (`visible`) -- si esta en
// false pero la transmision sigue viva, se muestra una barra angosta en vez
// de nada.
//
// Moderacion de chat: el DJ/staff del local puede borrar un comentario o
// silenciar a alguien en ESTA sala puntual (no es un ban global de la
// plataforma), directo con su propia sesion autenticada -- las policies de
// RLS de live_comments/live_muted_participants ya validan que solo el
// staff dueño de la sala pueda hacerlo (mismo criterio bar_members/
// has_workspace_access que protege el resto del panel).
export default function DjLiveModule(props) {
  var barId = props.barId
  var workspaceId = props.workspaceId
  var accessToken = props.accessToken // auth.session.access_token
  var visible = props.visible !== false
  var onRequestExpand = props.onRequestExpand || function () {}

  var previewRef = useRef(null)
  var roomRef = useRef(null)
  var streamRef = useRef(null)

  var statusState = useState('idle') // idle | previewing | starting | live | ending | error
  var status = statusState[0]
  var setStatus = statusState[1]

  var errorState = useState('')
  var errorMsg = errorState[0]
  var setErrorMsg = errorState[1]

  var viewerCountState = useState(0)
  var viewerCount = viewerCountState[0]
  var setViewerCount = viewerCountState[1]

  var liveSessionIdState = useState(null)
  var liveSessionId = liveSessionIdState[0]
  var setLiveSessionId = liveSessionIdState[1]

  var commentsState = useState([])
  var comments = commentsState[0]
  var setComments = commentsState[1]

  var mutedIdsState = useState(function () { return new Set() })
  var mutedIds = mutedIdsState[0]
  var setMutedIds = mutedIdsState[1]

  useEffect(function () {
    return function () {
      // Si el DJ cierra el panel o navega fuera sin apretar "Finalizar",
      // igual soltamos camara/mic y cortamos la conexion -- nunca dejamos
      // un stream fantasma transmitiendo en segundo plano.
      stopPreviewOnly()
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Chat + moderacion: se activa apenas hay una sala (desde 'starting'),
  // no solo cuando ya esta 'live' -- asi el DJ ve comentarios que puedan
  // llegar apenas la sala aparece en World.
  useEffect(function () {
    if (!liveSessionId) {
      setComments([])
      setMutedIds(new Set())
      return
    }

    var cancelled = false

    supabase
      .from('live_comments')
      .select('id,participant_id,display_name,avatar,text,created_at')
      .eq('live_session_id', liveSessionId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function (result) {
        if (cancelled) return
        setComments((result.data || []).slice().reverse())
      })

    supabase
      .from('live_muted_participants')
      .select('participant_id')
      .eq('live_session_id', liveSessionId)
      .then(function (result) {
        if (cancelled) return
        setMutedIds(new Set((result.data || []).map(function (r) { return r.participant_id })))
      })

    var chatChannel = supabase
      .channel('dj-live-chat-' + liveSessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_comments', filter: 'live_session_id=eq.' + liveSessionId }, function (payload) {
        setComments(function (prev) { return prev.concat([payload.new]) })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'live_comments' }, function (payload) {
        setComments(function (prev) { return prev.filter(function (c) { return c.id !== payload.old.id } ) })
      })
      .subscribe()

    var muteChannel = supabase
      .channel('dj-live-mutes-' + liveSessionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_muted_participants', filter: 'live_session_id=eq.' + liveSessionId }, function (payload) {
        setMutedIds(function (prev) { return new Set(prev).add(payload.new.participant_id) })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'live_muted_participants' }, function (payload) {
        setMutedIds(function (prev) {
          var next = new Set(prev)
          next.delete(payload.old.participant_id)
          return next
        })
      })
      .subscribe()

    return function () {
      cancelled = true
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(muteChannel)
    }
  }, [liveSessionId])

  function stopPreviewOnly() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function (t) { t.stop() })
      streamRef.current = null
    }
  }

  function handleActivatePreview() {
    setErrorMsg('')
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(function (stream) {
        streamRef.current = stream
        if (previewRef.current) {
          previewRef.current.srcObject = stream
        }
        setStatus('previewing')
      })
      .catch(function () {
        setErrorMsg('No se pudo acceder a la camara o el microfono. Revisa los permisos del navegador.')
        setStatus('error')
      })
  }

  function handleStart() {
    setErrorMsg('')
    setStatus('starting')

    fetch('/api/live-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
      body: JSON.stringify({ action: 'start', bar_id: barId || null, workspace_id: barId ? null : workspaceId })
    })
      .then(function (res) { return res.json() })
      .then(function (data) {
        if (data.error) throw new Error(data.error)
        setLiveSessionId(data.live_session_id || null)

        var room = new Room()
        roomRef.current = room

        room.on('participantConnected', function () { setViewerCount(room.numParticipants) })
        room.on('participantDisconnected', function () { setViewerCount(room.numParticipants) })
        room.on('disconnected', function () {
          setStatus('idle')
          setViewerCount(0)
        })

        return room.connect(data.url, data.token).then(function () {
          return Promise.all([
            room.localParticipant.setCameraEnabled(true),
            room.localParticipant.setMicrophoneEnabled(true)
          ])
        }).then(function () {
          setViewerCount(room.numParticipants)
          setStatus('live')
          return supabase
            .from('live_sessions')
            .update({ status: 'active' })
            .eq('room_name', data.room)
        })
      })
      .catch(function (err) {
        setErrorMsg(err.message || 'No se pudo iniciar la transmision.')
        setStatus('error')
      })
  }

  function handleStop() {
    setStatus('ending')
    var stopPromise = accessToken
      ? fetch('/api/live-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
          body: JSON.stringify({ action: 'stop', bar_id: barId || null, workspace_id: barId ? null : workspaceId })
        })
      : Promise.resolve()

    stopPromise.finally(function () {
      if (roomRef.current) {
        roomRef.current.disconnect()
        roomRef.current = null
      }
      stopPreviewOnly()
      setViewerCount(0)
      setStatus('idle')
      setLiveSessionId(null)
    })
  }

  function handleDeleteComment(commentId) {
    // Optimista: lo saco de la lista al toque, y si falla el DELETE (RLS
    // lo rechaza, red caida, etc.) lo recupero con el proximo fetch/evento.
    setComments(function (prev) { return prev.filter(function (c) { return c.id !== commentId } ) })
    supabase.from('live_comments').delete().eq('id', commentId)
  }

  function handleToggleMute(participantId) {
    if (!participantId) return
    if (mutedIds.has(participantId)) {
      setMutedIds(function (prev) { var next = new Set(prev); next.delete(participantId); return next })
      supabase.from('live_muted_participants').delete().eq('live_session_id', liveSessionId).eq('participant_id', participantId)
    } else {
      setMutedIds(function (prev) { return new Set(prev).add(participantId) })
      supabase.from('live_muted_participants').insert({ live_session_id: liveSessionId, participant_id: participantId })
    }
  }

  var isLive = status === 'live'
  var isBusy = status === 'starting' || status === 'ending'
  var isActiveInBackground = status !== 'idle' && status !== 'error'
  var showChatModeration = visible && liveSessionId && (status === 'live' || status === 'starting')

  // Panel cerrado (el DJ volvio a la cola) pero la transmision sigue
  // corriendo -- barra angosta en vez de nada, para no perderla de vista.
  if (!visible) {
    if (!isActiveInBackground) return null
    return (
      <div
        className="rounded-xl border px-4 py-2.5 mt-4 flex items-center justify-between flex-wrap gap-2"
        style={{ background: 'rgba(233,30,140,0.08)', borderColor: 'var(--accent-magenta)' }}
      >
        <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-magenta)' }}>●</span>
          {isLive ? 'Retroke Live sigue transmitiendo' : 'Retroke Live conectando...'}
          {isLive && (
            <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              · {viewerCount} {viewerCount === 1 ? 'espectador' : 'espectadores'}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onRequestExpand} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Ver panel
          </button>
          {isLive && (
            <button onClick={handleStop} disabled={isBusy} className="text-xs px-3 py-1.5 rounded-lg border font-medium disabled:opacity-50" style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}>
              Finalizar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border p-5 mt-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-magenta)' }}>●</span> Retroke Live
        </h3>
        {isLive && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(126,217,87,0.15)', color: '#3B9A2A', border: '1px solid rgba(126,217,87,0.4)' }}
          >
            EN VIVO
          </span>
        )}
      </div>

      <div
        className="rounded-xl mb-4 flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '16/9', background: '#111015', border: '1px dashed var(--border)' }}
      >
        {status === 'idle' && (
          <span className="text-sm text-center px-6" style={{ color: 'var(--text-muted)' }}>
            Vista previa local -- nada se transmite todavia
          </span>
        )}
        <video
          ref={previewRef}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: status === 'idle' ? 'none' : 'block' }}
        />
      </div>

      {errorMsg && (
        <div className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,77,77,0.1)', color: '#C23030', border: '1px solid rgba(255,77,77,0.3)' }}>
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {status === 'idle' && (
          <button
            onClick={handleActivatePreview}
            className="text-sm px-4 py-2 min-h-9 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-purple)' }}
          >
            Activar camara y microfono
          </button>
        )}
        {status === 'previewing' && (
          <button
            onClick={handleStart}
            className="text-sm px-4 py-2 min-h-9 rounded-lg font-bold text-white"
            style={{ background: 'var(--accent-magenta)' }}
          >
            Iniciar transmision
          </button>
        )}
        {status === 'starting' && (
          <button disabled className="text-sm px-4 py-2 min-h-9 rounded-lg font-bold text-white opacity-60" style={{ background: 'var(--accent-magenta)' }}>
            Conectando...
          </button>
        )}
        {isLive && (
          <button
            onClick={handleStop}
            disabled={isBusy}
            className="text-sm px-4 py-2 min-h-9 rounded-lg border font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}
          >
            Finalizar transmision
          </button>
        )}
        {status === 'ending' && (
          <button disabled className="text-sm px-4 py-2 min-h-9 rounded-lg border opacity-50" style={{ borderColor: 'var(--accent-magenta)', color: 'var(--accent-magenta)' }}>
            Finalizando...
          </button>
        )}
        {isLive && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {viewerCount} {viewerCount === 1 ? 'espectador viendo ahora' : 'espectadores viendo ahora'}
          </span>
        )}
      </div>

      <p className="text-xs mt-4 mb-1" style={{ color: 'var(--text-muted)' }}>
        Quien mira desde Retroke World solo puede ver y escuchar -- nunca se anota a la cola desde aca. Para cantar sigue siendo necesario el QR fisico del local.
      </p>

      {showChatModeration && (
        <div className="rounded-xl border mt-4 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2.5 text-sm font-medium flex items-center justify-between" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}>
            <span>Chat en vivo -- moderacion</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{comments.length} mensajes</span>
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {comments.length === 0 && (
              <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
                Sin comentarios todavia.
              </div>
            )}
            {comments.map(function (c) {
              var isMuted = c.participant_id && mutedIds.has(c.participant_id)
              return (
                <div key={c.id} className="flex items-start justify-between gap-2 px-4 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="min-w-0">
                    <div className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      {c.display_name}
                      {isMuted && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,77,77,0.12)', color: '#C23030' }}>
                          silenciado
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.text}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.participant_id && (
                      <button
                        onClick={function () { handleToggleMute(c.participant_id) }}
                        title={isMuted ? 'Quitar silencio' : 'Silenciar en este chat'}
                        className="text-xs px-2 py-1 rounded-md border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        {isMuted ? '🔊' : '🔇'}
                      </button>
                    )}
                    <button
                      onClick={function () { handleDeleteComment(c.id) }}
                      title="Borrar comentario"
                      className="text-xs px-2 py-1 rounded-md border"
                      style={{ borderColor: 'rgba(255,77,77,0.35)', color: '#C23030' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
