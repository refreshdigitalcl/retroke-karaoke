import { describe, it, expect, vi } from 'vitest'
import { getGlobalXpRank } from '../ranking'

// Fase 19 ("Testing"). getGlobalXpRank no tiene logica pura -- hace dos
// queries a Supabase (cuantos tienen mas XP que yo + total de participantes
// con stats). Se prueba con un cliente Supabase simulado que reproduce la
// forma exacta de la cadena .from().select()[.gt()] que usa el codigo real,
// sin tocar una base de datos de verdad.
function makeSupabase({ ahead, total }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => {
        const query = { gt: vi.fn(() => Promise.resolve({ count: ahead })) }
        // La query "total" no encadena .gt() -- se usa directo como promesa.
        query.then = (resolve) => resolve({ count: total })
        return query
      })
    }))
  }
}

describe('getGlobalXpRank', () => {
  it('calcula la posicion como (cuantos me superan) + 1', async () => {
    const supabase = makeSupabase({ ahead: 3, total: 10 })
    const result = await getGlobalXpRank(supabase, 85)
    expect(result).toEqual({ rank: 4, total: 10 })
  })

  it('el primer lugar tiene 0 participantes por delante', async () => {
    const supabase = makeSupabase({ ahead: 0, total: 5 })
    const result = await getGlobalXpRank(supabase, 999)
    expect(result).toEqual({ rank: 1, total: 5 })
  })

  it('devuelve null si todavia no hay nadie con stats -- nunca inventa un numero', async () => {
    const supabase = makeSupabase({ ahead: 0, total: 0 })
    const result = await getGlobalXpRank(supabase, 0)
    expect(result).toBeNull()
  })

  it('si Supabase falla, devuelve null en vez de reventar la pagina', async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error('network down')
      })
    }
    const result = await getGlobalXpRank(supabase, 10)
    expect(result).toBeNull()
  })
})
