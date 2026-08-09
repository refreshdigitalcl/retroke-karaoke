// Datos compartidos de una "sala" (bar fisico con local, o workspace sin
// local propio -- tipo Home/DJ) -- usado por Rankings.jsx (ranking de esta
// sala) y Escenario.jsx (Fase 7 de Retroke World, pagina dedicada por
// escenario). Se centraliza aca para no repetir la misma resolucion de
// bar/workspace en dos paginas (punto 48 del prompt maestro: no duplicar).
//
// Un "venue" resuelto siempre tiene barId XOR workspaceId (nunca ambos
// nulos si resolveVenue no devolvio null), y las demas funciones de este
// archivo aceptan ese objeto tal cual para filtrar sus consultas.

export async function resolveVenue(supabase, { barSlug, wsId }) {
  try {
    if (wsId) {
      const { data: ws } = await supabase.from('workspaces').select('id, name, type').eq('id', wsId).maybeSingle()
      if (!ws) return null
      return { barId: null, workspaceId: ws.id, name: ws.name, city: null, type: ws.type }
    }
    if (barSlug) {
      const { data: bar } = await supabase.from('bars').select('id, slug, name, city, description').ilike('slug', barSlug).maybeSingle()
      if (!bar) return null
      return { barId: bar.id, workspaceId: null, slug: bar.slug, name: bar.name, city: bar.city, description: bar.description, type: 'BAR' }
    }
    return null
  } catch (e) {
    return null
  }
}

function venueFilter(query, venue) {
  return venue.barId ? query.eq('bar_id', venue.barId) : query.eq('workspace_id', venue.workspaceId)
}

export async function loadVenueRanking(supabase, venue) {
  try {
    let query = supabase
      .from('performances')
      .select('participant_id, singer_name, nota_final')
      .not('participant_id', 'is', null)
      .not('nota_final', 'is', null)
      .order('nota_final', { ascending: false })
      .limit(300)
    query = venueFilter(query, venue)
    const { data: perfRows } = await query

    const bestByParticipant = {}
    const order = []
    ;(perfRows || []).forEach((row) => {
      const existing = bestByParticipant[row.participant_id]
      if (!existing || row.nota_final > existing.notaFinal) {
        if (!existing) order.push(row.participant_id)
        bestByParticipant[row.participant_id] = { participantId: row.participant_id, name: row.singer_name, notaFinal: row.nota_final }
      }
    })
    const top = order.map((id) => bestByParticipant[id]).sort((a, b) => b.notaFinal - a.notaFinal).slice(0, 10)
    if (!top.length) return []

    const { data: participantsData } = await supabase.from('participants').select('id, avatar').in('id', top.map((r) => r.participantId))
    const avatarById = {}
    ;(participantsData || []).forEach((p) => { avatarById[p.id] = p.avatar })

    return top.map((r) => ({
      participantId: r.participantId,
      name: r.name || 'Cantante Retroke',
      avatar: avatarById[r.participantId] || '🎤',
      primary: r.notaFinal.toFixed(1),
      meta: null
    }))
  } catch (e) {
    return []
  }
}

// Fase 7: numeros reales de este escenario (nunca inventados -- si no hay
// presentaciones todavia, todo queda en 0/null y la UI lo muestra como
// estado vacio, no como dato falso).
export async function loadVenueOverview(supabase, venue) {
  try {
    const [perfRes, activeRes] = await Promise.all([
      venueFilter(supabase.from('performances').select('participant_id, nota_final'), venue),
      venueFilter(supabase.from('sessions').select('id', { count: 'exact', head: true }), venue).eq('status', 'active')
    ])
    const rows = perfRes.data || []
    const distinctSingers = new Set(rows.filter((r) => r.participant_id).map((r) => r.participant_id)).size
    let bestNota = null
    rows.forEach((r) => {
      if (r.nota_final !== null && r.nota_final !== undefined && (bestNota === null || r.nota_final > bestNota)) {
        bestNota = r.nota_final
      }
    })
    return {
      totalPerformances: rows.length,
      distinctSingers,
      bestNota,
      isLiveNow: (activeRes.count || 0) > 0
    }
  } catch (e) {
    return { totalPerformances: 0, distinctSingers: 0, bestNota: null, isLiveNow: false }
  }
}

// Quien esta cantando ahora mismo en este escenario puntual, si hay sesion
// activa con alguien en el micro -- mismo shape de datos que usa World.jsx
// para "Ahora en Retroke", pero acotado a un solo escenario.
export async function loadVenueNowPlaying(supabase, venue) {
  try {
    let query = venueFilter(
      supabase
        .from('sessions')
        .select('id,singerName:current_singer->>name,song:current_singer->>song,artistName:current_singer->>artistName,artworkUrl:current_singer->>artworkUrl'),
      venue
    )
    const { data } = await query
      .eq('status', 'active')
      .not('current_singer', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data || null
  } catch (e) {
    return null
  }
}

// Mismo esquema de deep-link que usa toda la app (spaceParam en
// KaraokeSessionContext, scenarioHref en World.jsx) para entrar a la
// pantalla en vivo de esta sala.
export function venueLiveHref(venue) {
  if (venue.barId) return '/?bar=' + (venue.slug || '')
  if (venue.workspaceId) return '/?ws=' + venue.workspaceId
  return '/'
}

// Link a la pagina de escenario (Fase 7) de una sala, dado el mismo tipo de
// fila que ya trae World.jsx para "Escenarios activos" (bars/workspaces
// embebidos via PostgREST).
export function escenarioHref(row) {
  if (row.bar_id && row.bars && row.bars.slug) return '/escenario?bar=' + row.bars.slug
  if (row.workspace_id) return '/escenario?ws=' + row.workspace_id
  return null
}
