import { createClient } from '@supabase/supabase-js'
import { AccessToken } from 'livekit-server-sdk'

var SUPABASE_URL = 'https://koaayhnqgcyemnzkzffq.supabase.co'
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KsGg-AC8k4Jexmzvg9SYJw_W6eqo2i4'

// Retroke Live -- endpoint exclusivo para el DJ/staff que inicia o termina
// una transmision. Modulo nuevo e independiente: no toca sessions, cola,
// Display, ni ninguna otra funcion existente (ver Fase 1/2 de la
// arquitectura, retroke-live-arquitectura-propuesta.md).
//
// Nunca se confia en que el boton este oculto en el frontend: el permiso se
// valida aca contra bar_members / has_workspace_access, exactamente igual
// que el resto del panel del DJ. El grant que se emite siempre incluye
// canPublish -- este endpoint jamas se llama desde el visor (ver
// live-viewer-token.js, que siempre emite subscribe-only).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' })
    return
  }

  var livekitUrl = process.env.LIVEKIT_URL
  var livekitApiKey = process.env.LIVEKIT_API_KEY
  var livekitApiSecret = process.env.LIVEKIT_API_SECRET
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    res.status(500).json({ error: 'Falta configuracion de LiveKit (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET)' })
    return
  }

  var authHeader = req.headers.authorization || ''
  var token = authHeader.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Falta autenticacion' })
    return
  }

  var supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: 'Bearer ' + token } }
  })

  var userResult = await supabaseAsCaller.auth.getUser()
  if (userResult.error || !userResult.data.user) {
    res.status(401).json({ error: 'Sesion invalida' })
    return
  }
  var userId = userResult.data.user.id

  var action = req.body && req.body.action
  var barId = (req.body && req.body.bar_id) || null
  var workspaceId = (req.body && req.body.workspace_id) || null

  if (!barId && !workspaceId) {
    res.status(400).json({ error: 'Falta bar_id o workspace_id' })
    return
  }

  // Mismo criterio de permiso que ya protege `sessions` (bar_members para
  // bares "clasicos", has_workspace_access para el modelo de workspaces).
  var hasAccess = false
  if (barId) {
    var barMemberResult = await supabaseAsCaller
      .from('bar_members')
      .select('bar_id')
      .eq('bar_id', barId)
      .eq('user_id', userId)
      .maybeSingle()
    hasAccess = !!barMemberResult.data
  }
  if (!hasAccess && workspaceId) {
    var accessResult = await supabaseAsCaller.rpc('has_workspace_access', { ws_id: workspaceId, min_role: 'DJ' })
    hasAccess = !accessResult.error && !!accessResult.data
  }
  if (!hasAccess) {
    res.status(403).json({ error: 'No autorizado para transmitir en este local' })
    return
  }

  var roomName = 'live-' + (barId || workspaceId)

  // Retroke Live es una feature de plan PRO (BAR/DJ/HOME) -- plan_features
  // ya no tiene fila FREE para 'retroke_live'. El boton del DJ Panel se
  // oculta con hasFeature() en el frontend, pero eso es solo cosmetico: si
  // no se valida aca, cualquiera con acceso al panel podria arrancar una
  // transmision llamando este endpoint directo aunque su local sea FREE.
  // Solo se exige para 'start' -- si por lo que sea ya quedo una
  // transmision viva, 'stop' debe poder cortarla igual sin importar el
  // plan actual.
  if (action === 'start') {
    var planLookup = barId
      ? await supabaseAsCaller.from('bars').select('plan').eq('id', barId).maybeSingle()
      : await supabaseAsCaller.from('workspaces').select('plan, type').eq('id', workspaceId).maybeSingle()
    var planRow = planLookup.data
    var plan = ((planRow && planRow.plan) || 'FREE').toUpperCase()
    var wsType = barId ? 'BAR' : (planRow && planRow.type)
    var featureResult = await supabaseAsCaller
      .from('plan_features')
      .select('feature')
      .eq('plan', plan)
      .eq('workspace_type', wsType)
      .eq('feature', 'retroke_live')
      .maybeSingle()
    if (!featureResult.data) {
      res.status(403).json({ error: 'Retroke Live no esta disponible en tu plan actual' })
      return
    }
  }

  if (action === 'stop') {
    await supabaseAsCaller
      .from('live_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('room_name', roomName)
    res.status(200).json({ ok: true })
    return
  }

  if (action !== 'start') {
    res.status(400).json({ error: 'Accion desconocida' })
    return
  }

  var existingResult = await supabaseAsCaller
    .from('live_sessions')
    .select('id')
    .eq('room_name', roomName)
    .maybeSingle()

  var liveSessionId = null

  if (existingResult.data) {
    liveSessionId = existingResult.data.id
    await supabaseAsCaller
      .from('live_sessions')
      .update({ status: 'starting', started_by: userId, started_at: new Date().toISOString(), ended_at: null })
      .eq('id', liveSessionId)
  } else {
    var insertResult = await supabaseAsCaller
      .from('live_sessions')
      .insert({
        bar_id: barId,
        workspace_id: barId ? null : workspaceId,
        room_name: roomName,
        status: 'starting',
        started_by: userId,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()
    if (insertResult.error) {
      res.status(500).json({ error: insertResult.error.message })
      return
    }
    liveSessionId = insertResult.data.id
  }

  var at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: 'dj-' + userId,
    ttl: '4h'
  })
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: false,
    canPublishData: true
  })

  var jwt = await at.toJwt()
  res.status(200).json({ token: jwt, url: livekitUrl, room: roomName, live_session_id: liveSessionId })
}
