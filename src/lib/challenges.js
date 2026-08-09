// Fase 5 de Retroke World ("Desafíos entre cantantes"), ver
// retroke-world-diagnostico-tecnico.md punto 10. Un desafío 1 a 1 es
// simplemente "te reto a superar mi nota" -- no hay aceptar/rechazar
// todavía (no existe sistema de notificaciones), aparece directo como
// lista pasiva en /desafios y /perfil, y se considera "superado" apenas
// la mejor nota real de la persona retada (participant_stats.best_score)
// iguala o supera el target_score guardado en el momento de crear el
// desafío -- se calcula al vuelo, no se escribe un estado aparte.
//
// Solo participantes con cuenta Google conectada pueden desafiar o ser
// desafiados (identidad estable entre dispositivos); la RLS de
// direct_challenges ya lo exige del lado del servidor, esto es solo para
// no mostrar botones que van a fallar.

export async function createDirectChallenge(supabase, fromParticipantId, toParticipantId, targetScore) {
  try {
    const { error } = await supabase.from('direct_challenges').insert({
      from_participant_id: fromParticipantId,
      to_participant_id: toParticipantId,
      target_score: targetScore
    })
    return { error: error ? error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo enviar el desafío' }
  }
}

export async function loadReceivedChallenges(supabase, participantId) {
  try {
    const { data } = await supabase
      .from('direct_challenges')
      .select('id, target_score, created_at, from:participants!from_participant_id(display_name, avatar)')
      .eq('to_participant_id', participantId)
      .order('created_at', { ascending: false })
    return (data || []).map((row) => ({
      id: row.id,
      targetScore: row.target_score,
      createdAt: row.created_at,
      fromName: (row.from && row.from.display_name) || 'Cantante Retroke',
      fromAvatar: (row.from && row.from.avatar) || '🎤'
    }))
  } catch (e) {
    return []
  }
}

export async function loadSentChallenges(supabase, participantId) {
  try {
    const { data } = await supabase
      .from('direct_challenges')
      .select('id, target_score, created_at, to_participant_id, to:participants!to_participant_id(display_name, avatar)')
      .eq('from_participant_id', participantId)
      .order('created_at', { ascending: false })
    const rows = data || []
    if (!rows.length) return []

    const toIds = Array.from(new Set(rows.map((r) => r.to_participant_id)))
    const { data: statsRows } = await supabase
      .from('participant_stats')
      .select('participant_id, best_score')
      .in('participant_id', toIds)
    const bestScoreById = {}
    ;(statsRows || []).forEach((s) => { bestScoreById[s.participant_id] = s.best_score })

    return rows.map((row) => ({
      id: row.id,
      targetScore: row.target_score,
      createdAt: row.created_at,
      toName: (row.to && row.to.display_name) || 'Cantante Retroke',
      toAvatar: (row.to && row.to.avatar) || '🎤',
      toBestScore: bestScoreById[row.to_participant_id] !== undefined ? bestScoreById[row.to_participant_id] : null
    }))
  } catch (e) {
    return []
  }
}
