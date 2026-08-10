import { describe, it, expect } from 'vitest'
import { buildShareText, buildShareUrl } from '../shareCard'

// Fase 19 ("Testing"). Solo cubre las dos funciones puras de shareCard.js
// (el texto y el link que se comparten) -- el resto del archivo depende de
// html2canvas/Web Share API, fuera del alcance de unit tests de lib/.

describe('buildShareText', () => {
  it('arma el texto completo con cancion, artista y nota', () => {
    const text = buildShareText({ song: 'Bohemian Rhapsody', artistName: 'Queen', notaFinal: 8.456 })
    expect(text).toBe('🎤 Acabo de cantar "Bohemian Rhapsody" de Queen en Retroke y saqué 8.5/10 🔥')
  })

  it('sin cancion/artista/nota arma un texto generico honesto', () => {
    const text = buildShareText({ song: null, artistName: null, notaFinal: null })
    expect(text).toBe('🎤 Acabo de cantar en Retroke 🔥')
  })

  it('con solo cancion, omite artista y nota', () => {
    const text = buildShareText({ song: 'Solo cancion' })
    expect(text).toBe('🎤 Acabo de cantar "Solo cancion" en Retroke 🔥')
  })
})

describe('buildShareUrl', () => {
  it('arma la URL publica de la presentacion sobre el origin actual', () => {
    const url = buildShareUrl('abc-123')
    expect(url).toBe(window.location.origin + '/r/abc-123')
  })
})
