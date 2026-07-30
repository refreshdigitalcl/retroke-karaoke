import { createClient } from '@supabase/supabase-js'

var SUPABASE_URL = 'https://koaayhnqgcyemnzkzffq.supabase.co'
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KsGg-AC8k4Jexmzvg9SYJw_W6eqo2i4'

// Endpoint exclusivo para el panel admin: ver el correo real de un usuario
// y eliminar su cuenta de acceso cuando se borra un cliente. Requiere que
// quien llama sea un administrador global de la plataforma (se verifica
// con su propia sesion antes de usar la llave de servicio).
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

  var authHeader = req.headers.authorization || ''
  var token = authHeader.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'Falta autenticacion' })
    return
  }

  var supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: 'Bearer ' + token } }
  })

  var adminCheck = await supabaseAsCaller.rpc('is_platform_admin')
  if (adminCheck.error || !adminCheck.data) {
    res.status(403).json({ error: 'No autorizado' })
    return
  }

  var supabaseAdmin = createClient(SUPABASE_URL, serviceKey)
  var action = req.body && req.body.action
  var userId = req.body && req.body.user_id

  if (!userId) {
    res.status(400).json({ error: 'Falta user_id' })
    return
  }

  if (action === 'get_email') {
    var userResult = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userResult.error) {
      res.status(200).json({ email: null })
      return
    }
    res.status(200).json({ email: userResult.data.user ? userResult.data.user.email : null })
    return
  }

  if (action === 'delete_user') {
    var deleteResult = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteResult.error) {
      res.status(500).json({ error: deleteResult.error.message })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  res.status(400).json({ error: 'Accion desconocida' })
}
