// Fase 2 de Retroke World ("Tu Experiencia"): posicion de un participante en
// el ranking global por XP. Se calcula con dos counts (cuantos tienen mas XP
// que yo + cuantos participantes hay en total) en vez de traer toda la tabla
// ordenada -- barato aunque el numero de participantes crezca mucho, y
// participant_stats tiene lectura publica (RLS) asi que no requiere sesion.
//
// Devuelve null si todavia no hay suficientes datos (nadie con stats aun),
// nunca un numero inventado -- ver punto 46 del prompt maestro de Retroke
// World ("no inventar datos, mostrar estado vacio").
export async function getGlobalXpRank(supabase, xp) {
  try {
    const [aheadResult, totalResult] = await Promise.all([
      supabase.from('participant_stats').select('participant_id', { count: 'exact', head: true }).gt('xp', xp || 0),
      supabase.from('participant_stats').select('participant_id', { count: 'exact', head: true })
    ])
    const total = totalResult.count || 0
    if (total === 0) return null
    return { rank: (aheadResult.count || 0) + 1, total }
  } catch (e) {
    return null
  }
}
