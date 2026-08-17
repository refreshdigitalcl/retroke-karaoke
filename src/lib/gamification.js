// Fase C.2 / E.2: sistema de XP, niveles, logros y desafios.
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

// 10 XP base por subir a cantar, mas hasta 40 XP extra segun que tan buena
// estuvo la presentacion (nota 0 a 10 -> 0 a 40 XP). Esta funcion es solo
// de referencia (ver comentario en KaraokeSessionContext.jsx): quien
// realmente escribe XP es la funcion SQL apply_performance_gamification,
// y esta SOLO se invoca cuando notaFinal ya existe (hubo evaluacion real)
// -- si no hay evaluacion, no cuenta como cancion cantada y no se llama.
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

// --- Fase E.2: desafios ---------------------------------------------------

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

// Semana ISO (lunes a domingo), igual criterio que se usa en calendarios.
function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return d.getUTCFullYear() + '-W' + pad2(weekNo)
}

// Identifica el "periodo" al que pertenece una presentacion, para saber en
// que fila de progreso acumular. 'ongoing' siempre devuelve la misma clave
// (el desafio nunca se reinicia solo).
export function getPeriodKey(period, date) {
  const d = date || new Date()
  if (period === 'weekly') return isoWeekKey(d)
  if (period === 'monthly') return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1)
  return 'ongoing'
}

// Calcula el nuevo progreso de un desafio tras una presentacion. No decide
// si el desafio ya estaba completo (eso lo revisa quien llama, para poder
// congelar el progreso una vez logrado).
export function evaluateChallengeUpdate(challenge, existingProgress, ctx) {
  const current = existingProgress || 0
  if (challenge.metric === 'performances_count') {
    return current + 1
  }
  if (challenge.metric === 'good_performances_count') {
    const threshold = challenge.min_nota !== null && challenge.min_nota !== undefined ? challenge.min_nota : 7
    const qualifies = ctx.notaFinal !== null && ctx.notaFinal !== undefined && ctx.notaFinal >= threshold
    return qualifies ? current + 1 : current
  }
  if (challenge.metric === 'streak') {
    return Math.max(current, ctx.currentStreak || 0)
  }
  return current
}

export function isChallengeComplete(challenge, progress) {
  return (progress || 0) >= challenge.target_value
}
