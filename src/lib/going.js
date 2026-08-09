// Fase 11 de Retroke World ("Quién va"), ver
// retroke-world-diagnostico-tecnico.md punto 10. Marca VOY/TAL VEZ a un
// escenario puntual -- sin fecha de evento porque Retroke todavia no tiene
// un sistema de horarios/eventos (los escenarios son "activos ahora" o no).
// Mismo criterio de identidad que Fases 5, 8 y 9: solo con Google
// conectado, ver RLS de la tabla `going`.

function venueColumn(venue) {
  return venue.barId ? { column: 'bar_id', value: venue.barId } : { column: 'workspace_id', value: venue.workspaceId }
}

export async function loadMyGoingStatus(supabase, participantId, venue) {
  try {
    const { column, value } = venueColumn(venue)
    const { data } = await supabase
      .from('going')
      .select('id, status')
      .eq('participant_id', participantId)
      .eq(column, value)
      .maybeSingle()
    return data ? data.status : null
  } catch (e) {
    return null
  }
}

// Crea, cambia o quita (si vuelve a tocar el mismo estado) el "voy"/"tal
// vez" de esta persona para este escenario -- una sola fila por persona
// por escenario (ver indices unicos parciales en la migracion).
export async function setGoingStatus(supabase, participantId, venue, status) {
  try {
    const { column, value } = venueColumn(venue)
    const { data: existing } = await supabase
      .from('going')
      .select('id, status')
      .eq('participant_id', participantId)
      .eq(column, value)
      .maybeSingle()

    if (existing && existing.status === status) {
      const { error } = await supabase.from('going').delete().eq('id', existing.id)
      return { error: error ? error.message : null, status: null }
    }
    if (existing) {
      const { error } = await supabase.from('going').update({ status }).eq('id', existing.id)
      return { error: error ? error.message : null, status: error ? existing.status : status }
    }
    const payload = { participant_id: participantId, status }
    payload[column] = value
    const { error } = await supabase.from('going').insert(payload)
    return { error: error ? error.message : null, status: error ? null : status }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo actualizar', status: null }
  }
}

export async function loadGoingLists(supabase, venue) {
  try {
    const { column, value } = venueColumn(venue)
    const { data } = await supabase
      .from('going')
      .select('status, participant:participants(id, display_name, avatar)')
      .eq(column, value)
      .order('created_at', { ascending: false })
    const rows = (data || []).map((r) => ({
      participantId: r.participant ? r.participant.id : null,
      name: (r.participant && r.participant.display_name) || 'Cantante Retroke',
      avatar: (r.participant && r.participant.avatar) || '🎤',
      status: r.status
    })).filter((r) => r.participantId)
    return {
      voy: rows.filter((r) => r.status === 'VOY'),
      talVez: rows.filter((r) => r.status === 'TAL_VEZ')
    }
  } catch (e) {
    return { voy: [], talVez: [] }
  }
}
