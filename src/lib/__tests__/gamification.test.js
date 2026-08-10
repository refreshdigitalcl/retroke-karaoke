import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  computeLevel,
  computeNotaFinal,
  computeXpForPerformance,
  isGoodPerformance,
  evaluateNewAchievements,
  getPeriodKey,
  evaluateChallengeUpdate,
  isChallengeComplete
} from '../gamification'

// Fase 19 ("Testing"). gamification.js es el corazon del sistema de XP/
// niveles/logros/desafios -- funciones puras (sin Supabase ni red), asi que
// se pueden probar directo con datos de entrada conocidos. No se toco el
// archivo original, esto solo lo cubre con tests.

describe('computeLevel', () => {
  it('devuelve el nivel 1 para 0 XP', () => {
    expect(computeLevel(0)).toEqual(LEVELS[0])
  })

  it('se queda en el nivel actual justo antes del umbral siguiente', () => {
    expect(computeLevel(99).level).toBe(1)
  })

  it('sube de nivel exactamente en el umbral', () => {
    expect(computeLevel(100).level).toBe(2)
  })

  it('llega al nivel maximo con XP muy alto', () => {
    expect(computeLevel(5000)).toEqual(LEVELS[LEVELS.length - 1])
  })

  it('no rompe con XP negativo -- se queda en nivel 1', () => {
    expect(computeLevel(-10).level).toBe(1)
  })
})

describe('computeNotaFinal', () => {
  it('promedia audiencia y voz cuando existen ambas', () => {
    // vocalAsNota = 1 + (70/100)*9 = 7.3; promedio con audiencia 8 = 7.65
    expect(computeNotaFinal(8, 70)).toBeCloseTo(7.65, 5)
  })

  it('usa solo audiencia si no hay score vocal', () => {
    expect(computeNotaFinal(8, null)).toBe(8)
  })

  it('usa solo voz si no hay score de audiencia', () => {
    expect(computeNotaFinal(null, 70)).toBeCloseTo(7.3, 5)
  })

  it('devuelve null si no hay ninguna fuente -- nunca inventa un numero', () => {
    expect(computeNotaFinal(null, undefined)).toBeNull()
  })
})

describe('computeXpForPerformance', () => {
  it('nota maxima da el bono completo (10 base + 40 bono)', () => {
    expect(computeXpForPerformance(10)).toBe(50)
  })

  it('nota 0 solo da el XP base', () => {
    expect(computeXpForPerformance(0)).toBe(10)
  })

  it('sin nota (Bar/DJ sin analisis de voz) solo da el XP base', () => {
    expect(computeXpForPerformance(null)).toBe(10)
  })

  it('redondea el bono proporcional', () => {
    expect(computeXpForPerformance(7.5)).toBe(40)
  })
})

describe('isGoodPerformance', () => {
  it('7 es el umbral, cuenta como buena', () => {
    expect(isGoodPerformance(7)).toBe(true)
  })

  it('justo debajo del umbral no cuenta', () => {
    expect(isGoodPerformance(6.9)).toBe(false)
  })

  it('sin nota no cuenta', () => {
    expect(isGoodPerformance(null)).toBe(false)
  })
})

describe('evaluateNewAchievements', () => {
  it('desbloquea primera presentacion + primer 80 en la primera vez', () => {
    const newly = evaluateNewAchievements(85, { total_performances: 1, current_streak: 1 }, [])
    expect(newly).toEqual(['FIRST_PERFORMANCE', 'FIRST_80'])
  })

  it('no repite logros ya desbloqueados', () => {
    const newly = evaluateNewAchievements(
      92,
      { total_performances: 10, current_streak: 5 },
      ['FIRST_PERFORMANCE']
    )
    expect(newly).toEqual(['TEN_PERFORMANCES', 'FIRST_80', 'FIRST_90', 'STREAK_5'])
  })

  it('no desbloquea nada nuevo si ya se tenian todos', () => {
    const newly = evaluateNewAchievements(50, { total_performances: 3, current_streak: 2 }, ['FIRST_PERFORMANCE'])
    expect(newly).toEqual([])
  })

  it('sin score vocal (Bar/DJ) igual desbloquea los logros por conteo', () => {
    const newly = evaluateNewAchievements(null, { total_performances: 1, current_streak: 1 }, [])
    expect(newly).toEqual(['FIRST_PERFORMANCE'])
  })
})

describe('getPeriodKey', () => {
  it('ongoing siempre devuelve la misma clave', () => {
    expect(getPeriodKey('ongoing')).toBe('ongoing')
    expect(getPeriodKey('ongoing', new Date())).toBe('ongoing')
  })

  it('weekly devuelve semana ISO (2026-08-09 es semana 32)', () => {
    expect(getPeriodKey('weekly', new Date(Date.UTC(2026, 7, 9)))).toBe('2026-W32')
  })

  it('monthly devuelve anio-mes', () => {
    expect(getPeriodKey('monthly', new Date(Date.UTC(2026, 7, 9)))).toBe('2026-08')
  })
})

describe('evaluateChallengeUpdate', () => {
  it('performances_count suma 1 sin importar el contexto', () => {
    expect(evaluateChallengeUpdate({ metric: 'performances_count' }, 3, {})).toBe(4)
  })

  it('good_performances_count solo suma si la nota alcanza el umbral', () => {
    const challenge = { metric: 'good_performances_count', min_nota: 7 }
    expect(evaluateChallengeUpdate(challenge, 2, { notaFinal: 8 })).toBe(3)
    expect(evaluateChallengeUpdate(challenge, 2, { notaFinal: 5 })).toBe(2)
  })

  it('streak se queda con el mayor entre el progreso guardado y la racha actual', () => {
    expect(evaluateChallengeUpdate({ metric: 'streak' }, 3, { currentStreak: 7 })).toBe(7)
    expect(evaluateChallengeUpdate({ metric: 'streak' }, 9, { currentStreak: 7 })).toBe(9)
  })

  it('metrica desconocida deja el progreso sin cambios', () => {
    expect(evaluateChallengeUpdate({ metric: 'weird' }, 4, {})).toBe(4)
  })
})

describe('isChallengeComplete', () => {
  it('completo cuando el progreso alcanza el objetivo', () => {
    expect(isChallengeComplete({ target_value: 5 }, 5)).toBe(true)
  })

  it('incompleto cuando falta progreso', () => {
    expect(isChallengeComplete({ target_value: 5 }, 4)).toBe(false)
  })
})
