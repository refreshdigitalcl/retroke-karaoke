// Fase 8 de Retroke World ("Seguir cantantes"), ver
// retroke-world-diagnostico-tecnico.md punto 10. Mismo criterio de
// identidad que la Fase 5: solo participantes con cuenta Google conectada
// pueden seguir o ser seguidos (identidad estable entre dispositivos). La
// RLS de la tabla follows ya lo exige del lado del servidor -- esto es
// solo para no mostrar botones que van a fallar.

export async function createFollow(supabase, followerId, followingId) {
  try {
    const { error } = await supabase.from('follows').insert({
      follower_participant_id: followerId,
      following_participant_id: followingId
    })
    return { error: error ? error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo seguir a esta persona' }
  }
}

export async function deleteFollow(supabase, followerId, followingId) {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_participant_id', followerId)
      .eq('following_participant_id', followingId)
    return { error: error ? error.message : null }
  } catch (e) {
    return { error: e && e.message ? e.message : 'No se pudo dejar de seguir' }
  }
}

// Set con los ids de a quienes ya sigue este participante -- se carga una
// vez y despues se actualiza en el cliente al seguir/dejar de seguir
// (optimista), para no ir a la red por cada boton.
export async function loadFollowingIds(supabase, participantId) {
  try {
    const { data } = await supabase
      .from('follows')
      .select('following_participant_id')
      .eq('follower_participant_id', participantId)
    return new Set((data || []).map((r) => r.following_participant_id))
  } catch (e) {
    return new Set()
  }
}

export async function loadFollowCounts(supabase, participantId) {
  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_participant_id', participantId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_participant_id', participantId)
    ])
    return { followers: followersRes.count || 0, following: followingRes.count || 0 }
  } catch (e) {
    return { followers: 0, following: 0 }
  }
}

function mapFollowRow(row, key) {
  const p = row[key]
  return {
    participantId: p ? p.id : null,
    name: (p && p.display_name) || 'Cantante Retroke',
    avatar: (p && p.avatar) || '🎤'
  }
}

export async function loadFollowingList(supabase, participantId) {
  try {
    const { data } = await supabase
      .from('follows')
      .select('following:participants!following_participant_id(id, display_name, avatar)')
      .eq('follower_participant_id', participantId)
      .order('created_at', { ascending: false })
    return (data || []).map((row) => mapFollowRow(row, 'following')).filter((r) => r.participantId)
  } catch (e) {
    return []
  }
}

export async function loadFollowersList(supabase, participantId) {
  try {
    const { data } = await supabase
      .from('follows')
      .select('follower:participants!follower_participant_id(id, display_name, avatar)')
      .eq('following_participant_id', participantId)
      .order('created_at', { ascending: false })
    return (data || []).map((row) => mapFollowRow(row, 'follower')).filter((r) => r.participantId)
  } catch (e) {
    return []
  }
}
