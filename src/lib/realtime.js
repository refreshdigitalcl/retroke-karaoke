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

// Fase 17 ("Performance"): subscribeToTables registra el mismo callback en
// varios .on('postgres_changes', ...) -- uno por tabla. Una sola
// transaccion que toca 2+ de esas tablas (ej. apply_performance_gamification
// escribiendo performances + participant_stats a la vez) antes disparaba
// onChange una vez por tabla afectada, y cada una relanzaba el mismo fetch
// completo. Este pequeno debounce junta esas llamadas seguidas en una sola
// llamada real a onChange, sin cambiar que datos se piden ni como.
function debounce(fn, delayMs) {
  let timer = null
  function debounced(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delayMs)
  }
  debounced.cancel = function cancel() {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return debounced
}

export function subscribeToTables(supabase, channelName, tables, onChange) {
  const debouncedOnChange = debounce(onChange, 250)
  let channel = supabase.channel(channelName)
  tables.forEach((table) => {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, debouncedOnChange)
  })
  channel.subscribe()
  return function unsubscribe() {
    debouncedOnChange.cancel()
    supabase.removeChannel(channel)
  }
}

// Variante con filtro de columna (ej. bar_id=eq.xxx) para paginas de un solo
// escenario -- evita refetch innecesario cuando cambia una sesion/
// presentacion de OTRA sala que no es la que se esta mirando.
export function subscribeToTableFiltered(supabase, channelName, table, filter, onChange) {
  const debouncedOnChange = debounce(onChange, 250)
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, debouncedOnChange)
    .subscribe()
  return function unsubscribe() {
    debouncedOnChange.cancel()
    supabase.removeChannel(channel)
  }
}
