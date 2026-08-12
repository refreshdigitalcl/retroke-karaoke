import { createClient } from '@supabase/supabase-js'
import { validateComment } from '../src/lib/profanityFilter.js'

var SUPABASE_URL = 'https://koaayhnqgcyemnzkzffq.supabase.co'

// Retroke Live -- unico camino para publicar un comentario en el chat de
// una transmision. A proposito `live_comments` no tiene policy de insert
// para anon/authenticated (ver migracion) -- la unica forma de escribir es
// aca, con la service role, despues de correr el filtro de garabatos. Asi
// el filtro no se puede saltar llamando a Supabase directo desde el
// navegador con las devtools abiertas.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' })
    return
  }

  var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    res.status(500).json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY' })
    return
  }

  var liveSessionId = req.body && req.body.live_session_id
  var participantId = (req.body && req.body.participant_id) || null
  var displayName = ((req.body && req.body.display_name) || 'Espectador Retroke').toString().slice(0, 60)
  var avatar = (req.body && req.body.avatar) || null
  var rawText = req.body && req.body.text

  if (!liveSessionId) {
    res.status(400).json({ error: 'Falta live_session_id' })
    return
  }

  var validation = validateComment(rawText)
  if (!validation.ok) {
    if (validation.reason === 'profanity') {
      res.status(400).json({ error: 'profanity', message: 'Ese comentario tiene lenguaje que no dejamos publicar aca. Cambialo e intenta de nuevo.' })
    } else if (validation.reason === 'too_long') {
      res.status(400).json({ error: 'too_long', message: 'Comentario demasiado largo (maximo 220 caracteres).' })
    } else {
      res.status(400).json({ error: 'empty', message: 'Escribe algo antes de enviar.' })
    }
    return
  }

  var supabaseAdmin = createClient(SUPABASE_URL, serviceKey)

  var liveResult = await supabaseAdmin
    .from('live_sessions')
    .select('id,status')
    .eq('id', liveSessionId)
    .maybeSingle()

  if (liveResult.error || !liveResult.data) {
    res.status(404).json({ error: 'Sala no encontrada' })
    return
  }

  var watchableStatuses = ['starting', 'active', 'reconnecting', 'degraded', 'audio_only']
  if (watchableStatuses.indexOf(liveResult.data.status) === -1) {
    res.status(409).json({ error: 'Esta transmision no esta disponible ahora mismo' })
    return
  }

  var insertResult = await supabaseAdmin
    .from('live_comments')
    .insert({
      live_session_id: liveSessionId,
      participant_id: participantId,
      display_name: displayName,
      avatar: avatar,
      text: validation.text
    })
    .select('id,display_name,avatar,text,created_at')
    .single()

  if (insertResult.error) {
    res.status(500).json({ error: insertResult.error.message })
    return
  }

  res.status(200).json({ comment: insertResult.data })
}
