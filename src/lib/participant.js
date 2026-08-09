// Identidad de participante (Fase B + login opcional con Google).
//
// Por defecto NO requiere cuenta: se genera un ID de dispositivo una sola
// vez (localStorage) que reconoce a la misma persona entre presentaciones,
// sin friccion al inscribirse. Si la persona decide "conectar su cuenta"
// con Google (boton en /perfil), su perfil pasa a identificarse por esa
// cuenta en vez del dispositivo -- asi no pierde su progreso si cambia de
// celular. El perfil anonimo que ya tenia en ese dispositivo se "reclama"
// automaticamente la primera vez que se detecta sesion de Google activa,
// sin que la persona tenga que hacer nada mas que tocar "Conectar".
//
// Si algo falla (localStorage bloqueado, sin conexion, etc.) todas las
// funciones devuelven null en vez de lanzar error -- inscribirse a cantar
// debe seguir funcionando igual que hoy aunque la identidad no se pueda
// resolver en ese momento.

import { trackEvent } from './analytics'

var DEVICE_ID_KEY = 'retroke_device_id'

export function getDeviceId() {
  try {
    var existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    var id = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : 'device-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch (e) {
    // Modo privado estricto u otro bloqueo de localStorage: igual devolvemos
    // un id de una sola vez para no romper el flujo, aunque no persista.
    return 'device-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  }
}

var PARTICIPANT_FIELDS = 'id, display_name, avatar, photo_url, username, user_id, claimed_at'

// Si hay una sesion de Google activa, la identidad real es esa cuenta, no
// el dispositivo. Devuelve el usuario autenticado o null si esta cantando
// de forma anonima (el caso de siempre, sin cambios de comportamiento).
async function getAuthUser(supabase) {
  try {
    var result = await supabase.auth.getUser()
    return result.data && result.data.user ? result.data.user : null
  } catch (e) {
    return null
  }
}

export async function getOrCreateParticipant(supabase, fallbackName, fallbackAvatar) {
  var deviceId = getDeviceId()
  try {
    var authUser = await getAuthUser(supabase)

    if (authUser) {
      // 1. Ya existe un perfil reclamado por esta cuenta de Google -> es
      // ese, sin importar en que dispositivo se este cantando ahora mismo.
      var byUser = await supabase
        .from('participants')
        .select(PARTICIPANT_FIELDS)
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (byUser.data) return byUser.data

      // 2. Todavia no hay perfil reclamado con esta cuenta, pero este
      // dispositivo ya tenia uno anonimo -> se lo pasamos a la cuenta que
      // se acaba de conectar, para no perder el historial que ya tenia.
      var byDevice = await supabase
        .from('participants')
        .select(PARTICIPANT_FIELDS)
        .eq('device_id', deviceId)
        .maybeSingle()
      if (byDevice.data) {
        var claimed = await supabase
          .from('participants')
          .update({ user_id: authUser.id, claimed_at: new Date().toISOString() })
          .eq('id', byDevice.data.id)
          .select(PARTICIPANT_FIELDS)
          .single()
        return claimed.data || byDevice.data
      }

      // 3. Cuenta de Google nueva y dispositivo nuevo -> perfil nuevo, ya
      // reclamado desde el inicio.
      var googleName = authUser.user_metadata && authUser.user_metadata.full_name
        ? authUser.user_metadata.full_name
        : null
      var createdClaimed = await supabase
        .from('participants')
        .insert({
          device_id: deviceId,
          user_id: authUser.id,
          display_name: fallbackName || googleName || null,
          avatar: fallbackAvatar || null,
          claimed_at: new Date().toISOString()
        })
        .select(PARTICIPANT_FIELDS)
        .single()
      if (createdClaimed.data) {
        trackEvent('participant_registered', { participantId: createdClaimed.data.id, payload: { claimed: true } })
        return createdClaimed.data
      }
      return null
    }

    // Sin sesion -> flujo anonimo de siempre, identificado por dispositivo.
    var existing = await supabase
      .from('participants')
      .select(PARTICIPANT_FIELDS)
      .eq('device_id', deviceId)
      .maybeSingle()
    if (existing.data) return existing.data

    var created = await supabase
      .from('participants')
      .insert({ device_id: deviceId, display_name: fallbackName || null, avatar: fallbackAvatar || null })
      .select(PARTICIPANT_FIELDS)
      .single()
    if (created.data) {
      trackEvent('participant_registered', { participantId: created.data.id, payload: { claimed: false } })
      return created.data
    }

    // Carrera poco probable (otra pestaña del mismo dispositivo creo el
    // participante entre el select y el insert) — se resuelve releyendo.
    var retry = await supabase
      .from('participants')
      .select(PARTICIPANT_FIELDS)
      .eq('device_id', deviceId)
      .maybeSingle()
    return retry.data || null
  } catch (e) {
    return null
  }
}

// Mantiene el perfil al dia con el nombre/avatar mas reciente que la persona
// uso al inscribirse — asi la proxima vez que vuelva (mismo dispositivo o
// misma cuenta) se le puede reconocer con su ultimo nombre, sin pedirselo
// de nuevo.
export async function touchParticipantProfile(supabase, participantId, displayName, avatar) {
  if (!participantId) return
  try {
    await supabase
      .from('participants')
      .update({ display_name: displayName, avatar: avatar })
      .eq('id', participantId)
  } catch (e) {}
}

// Foto de perfil real (opcional), separada del emoji de avatar -- se guarda
// desde /perfil y despues se usa como prellenado en el circulo de "selfie"
// del formulario de inscripcion, para no tener que subirla cada vez que se
// va a cantar. Igual que el resto de este archivo, nunca lanza error: si
// falla, el perfil sigue funcionando con el emoji de siempre.
export async function updateParticipantPhoto(supabase, participantId, photoUrl) {
  if (!participantId) return { error: 'Sin perfil' }
  try {
    var result = await supabase
      .from('participants')
      .update({ photo_url: photoUrl })
      .eq('id', participantId)
    return { error: result.error ? result.error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo guardar la foto' }
  }
}

// Login opcional: conecta la cuenta de Google de la persona con su perfil.
// redirectTo por defecto vuelve a /perfil, que es donde vive el boton
// "Conectar con Google" — apenas vuelve con sesion activa,
// getOrCreateParticipant() hace el reclamo automatico del perfil anonimo
// que ya tenia en ese dispositivo (si tenia uno).
export async function signInWithGoogle(supabase, redirectTo) {
  try {
    var target = redirectTo || (typeof window !== 'undefined' ? window.location.origin + '/perfil' : undefined)
    var result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: target }
    })
    return { error: result.error ? result.error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo iniciar sesion con Google' }
  }
}

export async function signOutParticipant(supabase) {
  try {
    await supabase.auth.signOut()
    return { error: null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo cerrar sesion' }
  }
}
