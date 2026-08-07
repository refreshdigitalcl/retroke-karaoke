// Fase C.2: sistema de XP, niveles y logros.
// Funciones puras — no tocan Supabase ni la red. Reciben datos ya calculados
// (nota final, score vocal, estadisticas actuales) y devuelven que hacer.
// Quien las llama (KaraokeSessionContext) es responsable de leer y guardar.

export const LEVELS = [
  { level: 1, name: 'Novato del Micrófono', minXp: 0 },
  { level: 2, name: 'Voz en Ascenso', minXp: 100 },
  { level: 3, name: 'Estrella de Bar', minXp: 250 },
  { level: 4, name: 'Ícono del Escenario', minXp: 500 },
  { level: 5, name: 'Leyenda Retro', minXp: 900 },
  { level: 6, name: 'Ícono Platino', minXp: 1500 },
  { level: 7, name: 'Maestro del Karaoke', minXp: 2500 },
  { level: 8, name: 'Retroke Legend', minXp: 4000 }
]

export function computeLevel(xp) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl
  }
  return current
}

// Misma formula que DisplayResult.jsx: convierte el Retroke Score de IA
// (0-100) a una nota 1-10, y la promedia con la nota del publico
// (ratings.score, ~5-10) cuando existen ambas. Si solo existe una fuente
// (por ejemplo Bar/DJ sin analisis de voz), se usa esa nomas.
export function computeNotaFinal(audienceScore, vocalScore) {
  const hasAudience = audienceScore !== null && audienceScore !== undefined
  const hasVocal = vocalScore !== null && vocalScore !== undefined
  if (!hasAudience && !hasVocal) return null
  const vocalAsNota = hasVocal ? 1 + (vocalScore / 100) * 9 : null
  if (hasAudience && hasVocal) return (audienceScore + vocalAsNota) / 2
  return hasAudience ? audienceScore : vocalAsNota
}

// 10 XP base por subir a cantar (siempre suma algo), mas hasta 40 XP extra
// segun que tan buena estuvo la presentacion (nota 0 a 10 -> 0 a 40 XP).
export function computeXpForPerformance(notaFinal) {
  const base = 10
  const bonus = notaFinal !== null && notaFinal !== undefined ? Math.round((notaFinal / 10) * 40) : 0
  return base + bonus
}

// Umbral para que una presentacion cuente en una racha: nota 7+.
export function isGoodPerformance(notaFinal) {
  return notaFinal !== null && notaFinal !== undefined && notaFinal >= 7
}

// Revisa que logros nuevos corresponden desbloquear con esta presentacion,
// comparando contra las estadisticas ya actualizadas y los codigos que el
// participante ya tenia. Devuelve solo los codigos nuevos (puede ser []).
export function evaluateNewAchievements(vocalScore, updatedStats, alreadyUnlockedCodes) {
  const unlocked = new Set(alreadyUnlockedCodes || [])
  const newly = []

  function unlock(code) {
    if (!unlocked.has(code)) {
      unlocked.add(code)
      newly.push(code)
    }
  }

  if (updatedStats.total_performances === 1) unlock('FIRST_PERFORMANCE')
  if (updatedStats.total_performances >= 10) unlock('TEN_PERFORMANCES')
  if (updatedStats.total_performances >= 50) unlock('FIFTY_PERFORMANCES')

  // Estos logros dependen del Retroke Score de IA (0-100), solo disponible
  // en Home. En Bar/DJ (sin analisis de voz) simplemente no se disparan.
  if (vocalScore !== null && vocalScore !== undefined) {
    if (vocalScore >= 80) unlock('FIRST_80')
    if (vocalScore >= 90) unlock('FIRST_90')
    if (vocalScore >= 95) unlock('FIRST_95')
  }

  if (updatedStats.current_streak >= 5) unlock('STREAK_5')
  if (updatedStats.current_streak >= 10) unlock('STREAK_10')

  return newly
}
