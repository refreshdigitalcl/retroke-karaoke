import { createClient } from '@supabase/supabase-js'
import { AccessToken } from 'livekit-server-sdk'

var SUPABASE_URL = 'https://koaayhnqgcyemnzkzffq.supabase.co'
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KsGg-AC8k4Jexmzvg9SYJw_W6eqo2i4'

// Retroke Live -- endpoint publico (sin login) para espectadores desde
// Retroke World. A proposito no valida sesion de usuario: ver en vivo nunca
// requiere cuenta, igual que el resto de World.
//
// El limite de seguridad real esta aca, no en el frontend: el grant que se
// emite SIEMPRE es subscribe-only (canPublish: false). No importa que
// pantalla o boton exista en el cliente -- este endpoint es la unica forma
// de conseguir un token de LiveKit para ver, y jamas entrega permiso de
// publicar. "Ver en vivo" nunca puede convertirse en entrar a la cola.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' })
    return
  }

  var livekitUrl = process.env.LIVEKIT_URL
  var livekitApiKey = process.env.LIVEKIT_API_KEY
  var livekitApiSecret = process.env.LIVEKIT_API_SECRET
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    res.status(500).json({ error: 'Falta configuracion de LiveKit' })
    return
  }

  var liveSessionId = req.body && req.body.live_session_id
  if (!liveSessionId) {
    res.status(400).json({ error: 'Falta live_session_id' })
    return
  }

  var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  var liveResult = await supabase
    .from('live_sessions')
    .select('room_name, status')
    .eq('id', liveSessionId)
    .maybeSingle()

  if (liveResult.error || !liveResult.data) {
    res.status(404).json({ error: 'Sala no encontrada' })
    return
  }

  var liveSession = liveResult.data
  var watchableStatuses = ['starting', 'active', 'reconnecting', 'degraded', 'audio_only']
  if (watchableStatuses.indexOf(liveSession.status) === -1) {
    res.status(409).json({ error: 'Esta transmision no esta disponible ahora mismo' })
    return
  }

  var viewerId = (req.body && req.body.viewer_id) || ('viewer-' + Math.random().toString(36).slice(2, 10))

  var at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: String(viewerId).slice(0, 64),
    ttl: '2h'
  })
  at.addGrant({
    room: liveSession.room_name,
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false
  })

  var jwt = await at.toJwt()
  res.status(200).json({ token: jwt, url: livekitUrl, room: liveSession.room_name })
}
