// Identidad liviana de participante (Fase B).
//
// No requiere cuenta ni login: se genera un ID de dispositivo una sola vez
// (guardado en localStorage) que permite reconocer a la misma persona entre
// presentaciones y noches distintas, sin agregar fricción al inscribirse.
// Mas adelante se podra "reclamar" este perfil con email/telefono
// (columna participants.user_id) sin perder el historial acumulado.
//
// Si algo falla (localStorage bloqueado, sin conexion, etc.) todas las
// funciones devuelven null en vez de lanzar error — inscribirse a cantar
// debe seguir funcionando igual que hoy aunque la identidad no se pueda
// resolver en ese momento.

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

var PARTICIPANT_FIELDS = 'id, display_name, avatar, username, user_id'

export async function getOrCreateParticipant(supabase, fallbackName, fallbackAvatar) {
  var deviceId = getDeviceId()
  try {
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
    if (created.data) return created.data

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
// uso al inscribirse — asi la proxima vez que vuelva (mismo dispositivo) se
// le puede reconocer con su ultimo nombre, sin pedirselo de nuevo.
export async function touchParticipantProfile(supabase, participantId, displayName, avatar) {
  if (!participantId) return
  try {
    await supabase
      .from('participants')
      .update({ display_name: displayName, avatar: avatar })
      .eq('id', participantId)
  } catch (e) {}
}
