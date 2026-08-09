// Fase 9 de Retroke World ("Estados"), ver
// retroke-world-diagnostico-tecnico.md punto 10. Posts cortos de texto
// libre -- NUNCA comentarios ni DMs (punto 20 del prompt maestro: no
// convertir Retroke en Instagram). Solo reacciones de un set fijo, y solo
// participantes con Google conectado pueden publicar o reaccionar (misma
// identidad estable que Fases 5 y 8). En este v1 los estados de alguien
// solo se muestran en su propio perfil (/perfil, /u/:id) -- todavia no hay
// un feed general de toda la comunidad.

export const STATUS_MAX_LENGTH = 180
export const REACTION_EMOJIS = ['🔥', '❤️', '👏', '😂', '🎤']

export async function createStatus(supabase, participantId, text) {
  const trimmed = (text || '').trim()
  if (!trimmed) return { error: 'Escribe algo primero' }
  if (trimmed.length > STATUS_MAX_LENGTH) return { error: 'Muy largo (máximo ' + STATUS_MAX_LENGTH + ' caracteres)' }
  try {
    const { error } = await supabase.from('statuses').insert({ participant_id: participantId, text: trimmed })
    return { error: error ? error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo publicar' }
  }
}

export async function deleteStatus(supabase, statusId) {
  try {
    const { error } = await supabase.from('statuses').delete().eq('id', statusId)
    return { error: error ? error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo borrar' }
  }
}

// Cambia/crea/quita la reaccion propia a un estado en un solo llamado --
// si ya tenias ese mismo emoji, lo saca (toggle); si tenias otro, lo
// reemplaza; si no tenias ninguno, lo agrega.
export async function toggleReaction(supabase, statusId, participantId, emoji, currentEmoji) {
  try {
    if (currentEmoji === emoji) {
      const { error } = await supabase.from('status_reactions').delete().eq('status_id', statusId).eq('participant_id', participantId)
      return { error: error ? error.message : null, myReaction: null }
    }
    if (currentEmoji) {
      const { error } = await supabase.from('status_reactions').update({ emoji }).eq('status_id', statusId).eq('participant_id', participantId)
      return { error: error ? error.message : null, myReaction: emoji }
    }
    const { error } = await supabase.from('status_reactions').insert({ status_id: statusId, participant_id: participantId, emoji })
    return { error: error ? error.message : null, myReaction: emoji }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo reaccionar', myReaction: currentEmoji || null }
  }
}

// Estados de un participante + reacciones agregadas por emoji + cual es la
// reaccion propia de quien mira (si tiene una), todo en dos consultas
// chicas (el volumen de datos de esta app es bajo, agregar en JS es
// suficiente -- mismo patron que loadPeriodRanking en lib/venue.js).
export async function loadStatuses(supabase, participantId, viewerParticipantId) {
  try {
    const { data: statusRows } = await supabase
      .from('statuses')
      .select('id, text, created_at')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })
      .limit(20)
    const statuses = statusRows || []
    if (!statuses.length) return []

    const statusIds = statuses.map((s) => s.id)
    const { data: reactionRows } = await supabase
      .from('status_reactions')
      .select('status_id, participant_id, emoji')
      .in('status_id', statusIds)
    const reactions = reactionRows || []

    return statuses.map((s) => {
      const rows = reactions.filter((r) => r.status_id === s.id)
      const counts = {}
      rows.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1 })
      const mine = viewerParticipantId ? rows.find((r) => r.participant_id === viewerParticipantId) : null
      return {
        id: s.id,
        text: s.text,
        createdAt: s.created_at,
        reactionCounts: counts,
        totalReactions: rows.length,
        myReaction: mine ? mine.emoji : null
      }
    })
  } catch (e) {
    return []
  }
}
