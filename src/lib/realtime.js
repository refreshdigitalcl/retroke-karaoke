// Fase 15 de Retroke World ("Tiempo real"), ver
// retroke-world-diagnostico-tecnico.md. Envuelve el patron que World.jsx ya
// usaba desde Fase 1 para "quien esta cantando ahora" (un canal de Supabase
// sobre `sessions` + refetch completo cuando algo cambia) para que las
// paginas nuevas de World (Rankings, Escenario, PublicProfile) puedan
// sumarse sin repetir el boilerplate de canal a mano.
//
// Deliberadamente simple: no se distingue INSERT/UPDATE/DELETE ni se lee el
// payload del evento -- el volumen de datos de esta app es bajo (ver
// diagnostico, punto 11), asi que "algo cambio en esta tabla, vuelve a
// pedir los datos reales" es mas simple y mas honesto que tratar de
// reconciliar el payload a mano (evita desincronizarse silenciosamente de
// lo que de verdad hay en la base).
export function subscribeToTables(supabase, channelName, tables, onChange) {
  let channel = supabase.channel(channelName)
  tables.forEach((table) => {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
  })
  channel.subscribe()
  return function unsubscribe() {
    supabase.removeChannel(channel)
  }
}

// Variante con filtro de columna (ej. bar_id=eq.xxx) para paginas de un solo
// escenario -- evita refetch innecesario cuando cambia una sesion/
// presentacion de OTRA sala que no es la que se esta mirando.
export function subscribeToTableFiltered(supabase, channelName, table, filter, onChange) {
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, onChange)
    .subscribe()
  return function unsubscribe() {
    supabase.removeChannel(channel)
  }
}
