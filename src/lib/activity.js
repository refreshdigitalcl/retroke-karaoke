// Fase 12 de Retroke World ("Actividad"), ver
// retroke-world-diagnostico-tecnico.md punto 10. Feed cronologico global
// que junta las senales sociales ya construidas en Fases 5 (desafios), 8
// (seguir) y 9 (estados), mas los logros del sistema que ya existian antes
// de World -- sin tabla nueva y sin escribir nada, solo lee cuatro fuentes
// que ya son publicas (ver pg_policies) y las mezcla por fecha.
//
// Global, no personalizado a "solo quienes sigo" -- con el volumen de
// participantes de hoy un feed personalizado se veria vacio para casi
// todos (punto 46: no inventar actividad para rellenar).

function safeName(p) {
  return (p && p.display_name) || 'Cantante Retroke'
}
function safeAvatar(p) {
  return (p && p.avatar) || '🎤'
}

async function loadFollowEvents(supabase, perSourceLimit) {
  const { data } = await supabase
    .from('follows')
    .select('id, created_at, follower:participants!follower_participant_id(id, display_name, avatar), following:participants!following_participant_id(id, display_name, avatar)')
    .order('created_at', { ascending: false })
    .limit(perSourceLimit)
  return (data || [])
    .filter((r) => r.follower && r.following)
    .map((r) => ({
      id: 'follow-' + r.id,
      type: 'follow',
      createdAt: r.created_at,
      actor: { id: r.follower.id, name: safeName(r.follower), avatar: safeAvatar(r.follower) },
      target: { id: r.following.id, name: safeName(r.following), avatar: safeAvatar(r.following) }
    }))
}

async function loadStatusEvents(supabase, perSourceLimit) {
  const { data } = await supabase
    .from('statuses')
    .select('id, text, created_at, participant:participants(id, display_name, avatar)')
    .order('created_at', { ascending: false })
    .limit(perSourceLimit)
  return (data || [])
    .filter((r) => r.participant)
    .map((r) => ({
      id: 'status-' + r.id,
      type: 'status',
      createdAt: r.created_at,
      actor: { id: r.participant.id, name: safeName(r.participant), avatar: safeAvatar(r.participant) },
      text: r.text
    }))
}

async function loadChallengeEvents(supabase, perSourceLimit) {
  const { data } = await supabase
    .from('direct_challenges')
    .select('id, created_at, from:participants!from_participant_id(id, display_name, avatar), to:participants!to_participant_id(id, display_name, avatar)')
    .order('created_at', { ascending: false })
    .limit(perSourceLimit)
  return (data || [])
    .filter((r) => r.from && r.to)
    .map((r) => ({
      id: 'challenge-' + r.id,
      type: 'challenge',
      createdAt: r.created_at,
      actor: { id: r.from.id, name: safeName(r.from), avatar: safeAvatar(r.from) },
      target: { id: r.to.id, name: safeName(r.to), avatar: safeAvatar(r.to) }
    }))
}

async function loadAchievementEvents(supabase, perSourceLimit) {
  const { data } = await supabase
    .from('participant_achievements')
    .select('participant_id, achievement_code, unlocked_at, participant:participants(id, display_name, avatar), achievement:achievements(name, icon)')
    .order('unlocked_at', { ascending: false })
    .limit(perSourceLimit)
  return (data || [])
    .filter((r) => r.participant && r.achievement)
    .map((r) => ({
      id: 'achievement-' + r.participant_id + '-' + r.achievement_code,
      type: 'achievement',
      createdAt: r.unlocked_at,
      actor: { id: r.participant.id, name: safeName(r.participant), avatar: safeAvatar(r.participant) },
      achievement: { name: r.achievement.name, icon: r.achievement.icon || '🏅' }
    }))
}

export async function loadActivityFeed(supabase, limit) {
  var finalLimit = limit || 10
  try {
    const [follows, statuses, challenges, achievements] = await Promise.all([
      loadFollowEvents(supabase, finalLimit),
      loadStatusEvents(supabase, finalLimit),
      loadChallengeEvents(supabase, finalLimit),
      loadAchievementEvents(supabase, finalLimit)
    ])
    const all = [].concat(follows, statuses, challenges, achievements)
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return all.slice(0, finalLimit)
  } catch (e) {
    return []
  }
}
