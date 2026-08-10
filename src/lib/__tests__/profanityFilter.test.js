import { describe, it, expect } from 'vitest'
import { containsProfanity } from '../profanityFilter'

// Fase 19 ("Testing"). Este filtro protege el nombre que se muestra en /registro
// (flujo en vivo) -- vale la pena tener tests que confirmen que sigue
// detectando las evasiones tipicas (leetspeak, letras repetidas, espaciado,
// mayusculas encadenadas) sin marcar nombres normales como ofensivos.

describe('containsProfanity', () => {
  it('no marca un nombre normal', () => {
    expect(containsProfanity('Pato Barria')).toBe(false)
  })

  it('no marca nombres con tildes/enie', () => {
    expect(containsProfanity('José Núñez')).toBe(false)
  })

  it('devuelve false para texto vacio o nulo', () => {
    expect(containsProfanity('')).toBe(false)
    expect(containsProfanity(null)).toBe(false)
    expect(containsProfanity(undefined)).toBe(false)
  })

  it('detecta una palabra bloqueada directa', () => {
    expect(containsProfanity('weon')).toBe(true)
  })

  it('detecta leetspeak (numeros por letras)', () => {
    expect(containsProfanity('w3on')).toBe(true)
  })

  it('detecta letras repetidas como evasion', () => {
    expect(containsProfanity('culiaooooo')).toBe(true)
  })

  it('detecta palabras separadas por espacios', () => {
    expect(containsProfanity('W E O N')).toBe(true)
  })

  it('detecta evasion tipo CamelCase pegado', () => {
    expect(containsProfanity('CarePico')).toBe(true)
  })

  it('detecta frases compuestas', () => {
    expect(containsProfanity('Saco De Weas')).toBe(true)
  })

  it('detecta groserias en ingles', () => {
    expect(containsProfanity('fuck you')).toBe(true)
  })
})
