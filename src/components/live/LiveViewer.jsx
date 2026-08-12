import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Room, RoomEvent } from 'livekit-client'
import { supabase } from '../../lib/supabase'
import RetrokeIcon from '../retroke/RetrokeIcon'

// Retroke Live -- pantalla de espectador (Fase 4, MVP tecnico). Solo se
// suscribe: jamas pide camara/microfono propio, jamas puede publicar (el
// grant lo emite /api/live-viewer-token y siempre es subscribe-only, sin
// importar lo que haga este componente). No hay ningun boton que lleve a
// /registro ni a la cola -- "ver en vivo" nunca es "entrar a cantar".
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

function venueName(row) {
  if (row.bars && row.bars.name) return row.bars.name
  if (row.workspaces && row.workspaces.name) return row.workspaces.name
  return 'Escenario Retroke'
}

export default function LiveViewer(props) {
  var liveSessionId = props.liveSessionId

  var videoRef = useRef(null)
  var audioRef = useRef(null)
  var roomRef = useRef(null)

  var rowState = useState(null) // fila de live_sessions + bars/workspaces
  var row = rowState[0]
  var setRow = rowState[1]

  var connStatusState = useState('connecting') // connecting | connected | ended | error
  var connStatus = connStatusState[0]
  var setConnStatus = connStatusState[1]

  var viewerCountState = useState(0)
  var viewerCount = viewerCountState[0]
  var setViewerCount = viewerCountState[1]

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

  useEffect(function () {
    if (!row || !row.room_name) return
    if (row.status === 'offline' || row.status === 'ended') {
      setConnStatus('ended')
      return
    }
    if (roomRef.current) return // ya conectado, solo llegaron cambios de metadata

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
          if (track.kind === 'video' && videoRef.current) track.attach(videoRef.current)
          if (track.kind === 'audio' && audioRef.current) track.attach(audioRef.current)
        })
        room.on(RoomEvent.TrackUnsubscribed, function (track) {
          track.detach()
        })
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

    return function () {
      cancelled = true
    }
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

  var displayStatus = row ? row.status : 'starting'
  var showVideo = connStatus === 'connected' && displayStatus !== 'audio_only'

  return (
    <div className="rk-live-viewer">
      <style>{`
        .rk-live-viewer { max-width: 720px; margin: 0 auto; padding: 24px 16px 60px; color: #fff; }
        .rk-lv-video-wrap { position: relative; aspect-ratio: 16/9; border-radius: 22px; overflow: hidden; background: #0c0b10; border: 1px solid rgba(255,255,255,0.12); }
        .rk-lv-video-wrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rk-lv-badge { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; background: #e91e8c; padding: 4px 10px; border-radius: 999px; }
        .rk-lv-viewers { position: absolute; top: 14px; right: 14px; font-size: 12px; font-weight: 600; background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 999px; display: flex; align-items: center; gap: 6px; }
        .rk-lv-status-msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: rgba(255,255,255,0.6); font-size: 14px; }
        .rk-lv-info { padding: 18px 4px; }
        .rk-lv-title { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .rk-lv-meta { font-size: 13px; color: rgba(255,255,255,0.55); }
        .rk-lv-singer { display: inline-flex; align-items: center; gap: 8px; background: rgba(244,208,63,0.1); border: 1px solid rgba(244,208,63,0.3); color: #f4d03f; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 999px; margin-top: 14px; }
        .rk-lv-back { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 20px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
      `}</style>

      <div className="rk-lv-video-wrap">
        {showVideo && <video ref={videoRef} autoPlay playsInline />}
        <audio ref={audioRef} autoPlay />
        {connStatus === 'connected' && (
          <>
            <span className="rk-lv-badge">{displayStatus === 'active' ? 'En vivo' : STATUS_LABEL[displayStatus]}</span>
            <span className="rk-lv-viewers"><RetrokeIcon name="users" size={13} /> {viewerCount}</span>
          </>
        )}
        {connStatus !== 'connected' && (
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
        <div>
          <Link to="/world" className="rk-lv-back">
            ← Volver a Retroke World
          </Link>
        </div>
      </div>
    </div>
  )
}
