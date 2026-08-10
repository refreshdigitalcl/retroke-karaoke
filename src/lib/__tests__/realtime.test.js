import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { subscribeToTables, subscribeToTableFiltered } from '../realtime'

// Fase 19 ("Testing"). Simula el cliente de Supabase Realtime (la cadena
// .channel().on().subscribe()) para probar, sin red de por medio:
//   1. que se suscribe a cada tabla pedida con el filtro correcto,
//   2. el debounce agregado en Fase 17 (varias notificaciones seguidas
//      terminan en un solo refetch),
//   3. que unsubscribe() cancela el debounce pendiente y limpia el canal.
function makeMockSupabase() {
  const handlers = []
  const channelObj = {
    on: vi.fn((event, config, cb) => {
      handlers.push({ event, config, cb })
      return channelObj
    }),
    subscribe: vi.fn(() => channelObj)
  }
  const supabase = {
    channel: vi.fn(() => channelObj),
    removeChannel: vi.fn()
  }
  return { supabase, channelObj, handlers }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('subscribeToTables', () => {
  it('abre un canal y se suscribe a cada tabla pedida', () => {
    const { supabase, channelObj, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    subscribeToTables(supabase, 'world-social', ['follows', 'statuses'], onChange)

    expect(supabase.channel).toHaveBeenCalledWith('world-social')
    expect(handlers).toHaveLength(2)
    expect(handlers[0].config).toEqual({ event: '*', schema: 'public', table: 'follows' })
    expect(handlers[1].config).toEqual({ event: '*', schema: 'public', table: 'statuses' })
    expect(channelObj.subscribe).toHaveBeenCalledTimes(1)
  })

  it('junta varios cambios seguidos en un solo refetch (debounce)', () => {
    const { supabase, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    subscribeToTables(supabase, 'world-social', ['follows', 'participant_stats'], onChange)

    // Una transaccion que toca ambas tablas casi al mismo tiempo -- ej.
    // apply_performance_gamification escribiendo performances + stats.
    handlers[0].cb({ table: 'follows' })
    handlers[1].cb({ table: 'participant_stats' })

    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(250)

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('cambios separados por mas tiempo que el debounce disparan refetch cada vez', () => {
    const { supabase, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    subscribeToTables(supabase, 'world-social', ['follows'], onChange)

    handlers[0].cb({ table: 'follows' })
    vi.advanceTimersByTime(250)
    expect(onChange).toHaveBeenCalledTimes(1)

    handlers[0].cb({ table: 'follows' })
    vi.advanceTimersByTime(250)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('unsubscribe cancela el debounce pendiente y limpia el canal', () => {
    const { supabase, channelObj, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    const unsubscribe = subscribeToTables(supabase, 'world-social', ['follows'], onChange)
    handlers[0].cb({ table: 'follows' })
    unsubscribe()

    vi.advanceTimersByTime(1000)

    expect(onChange).not.toHaveBeenCalled()
    expect(supabase.removeChannel).toHaveBeenCalledWith(channelObj)
  })
})

describe('subscribeToTableFiltered', () => {
  it('se suscribe con el filtro de columna pedido', () => {
    const { supabase, channelObj, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    subscribeToTableFiltered(supabase, 'escenario-sessions-abc', 'sessions', 'bar_id=eq.abc', onChange)

    expect(supabase.channel).toHaveBeenCalledWith('escenario-sessions-abc')
    expect(handlers[0].config).toEqual({
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: 'bar_id=eq.abc'
    })
    expect(channelObj.subscribe).toHaveBeenCalledTimes(1)
  })

  it('tambien debounce-a los refetch de esta variante', () => {
    const { supabase, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    subscribeToTableFiltered(supabase, 'escenario-performances-abc', 'performances', 'bar_id=eq.abc', onChange)

    handlers[0].cb({})
    handlers[0].cb({})
    handlers[0].cb({})
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(250)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe cancela el debounce pendiente y limpia el canal', () => {
    const { supabase, channelObj, handlers } = makeMockSupabase()
    const onChange = vi.fn()

    const unsubscribe = subscribeToTableFiltered(supabase, 'ch', 'sessions', 'bar_id=eq.abc', onChange)
    handlers[0].cb({})
    unsubscribe()

    vi.advanceTimersByTime(1000)

    expect(onChange).not.toHaveBeenCalled()
    expect(supabase.removeChannel).toHaveBeenCalledWith(channelObj)
  })
})
