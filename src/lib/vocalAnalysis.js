// Motor de analisis vocal local. Corre enteramente en el celular del cantante,
// usando el AnalyserNode que ya se crea en la prueba de microfono (Fase B).
// No se envia audio a ningun lado: solo se calculan metricas numericas.

// Deteccion de tono por autocorrelacion (algoritmo estandar de dominio publico,
// usado en la mayoria de afinadores web). Devuelve la frecuencia en Hz, o -1 si
// no hay suficiente señal para detectar un tono claro.
export function autoCorrelate(buf, sampleRate) {
  var SIZE = buf.length
  var rms = 0
  for (var i = 0; i < SIZE; i++) {
    var val = buf[i]
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return -1

  var r1 = 0
  var r2 = SIZE - 1
  var thres = 0.2
  for (var a = 0; a < SIZE / 2; a++) {
    if (Math.abs(buf[a]) < thres) { r1 = a; break }
  }
  for (var b = 1; b < SIZE / 2; b++) {
    if (Math.abs(buf[SIZE - b]) < thres) { r2 = SIZE - b; break }
  }

  var trimmed = buf.slice(r1, r2)
  var n = trimmed.length
  if (n < 8) return -1

  var c = new Array(n).fill(0)
  for (var i2 = 0; i2 < n; i2++) {
    for (var j = 0; j < n - i2; j++) {
      c[i2] += trimmed[j] * trimmed[j + i2]
    }
  }

  var d = 0
  while (d < n - 1 && c[d] > c[d + 1]) d++

  var maxval = -1
  var maxpos = -1
  for (var i3 = d; i3 < n; i3++) {
    if (c[i3] > maxval) {
      maxval = c[i3]
      maxpos = i3
    }
  }

  var T0 = maxpos
  if (T0 <= 0) return -1

  if (T0 > 0 && T0 < n - 1) {
    var x1 = c[T0 - 1]
    var x2 = c[T0]
    var x3 = c[T0 + 1]
    var aCoef = (x1 + x3 - 2 * x2) / 2
    var bCoef = (x3 - x1) / 2
    if (aCoef) T0 = T0 - bCoef / (2 * aCoef)
  }

  var freq = sampleRate / T0
  if (freq < 60 || freq > 1200) return -1
  return freq
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function freqToCents(f1, f2) {
  return 1200 * Math.log2(f1 / f2)
}

export function createVocalAnalyzer(analyserNode, audioCtx) {
  var samples = []
  var intervalId = null
  var buf = new Float32Array(analyserNode.fftSize)

  function tick() {
    analyserNode.getFloatTimeDomainData(buf)
    var freq = autoCorrelate(buf, audioCtx.sampleRate)

    var sumSquares = 0
    for (var i = 0; i < buf.length; i++) sumSquares += buf[i] * buf[i]
    var rms = Math.sqrt(sumSquares / buf.length)

    samples.push({ t: Date.now(), freq: freq, rms: rms })
    // Limite de memoria para presentaciones largas en telefonos con poca RAM.
    if (samples.length > 1200) samples.shift()
  }

  function start() {
    intervalId = setInterval(tick, 180)
  }

  function stop() {
    if (intervalId) clearInterval(intervalId)
    intervalId = null
    return computeResults(samples)
  }

  return { start: start, stop: stop }
}

function computeResults(samples) {
  if (samples.length < 5) {
    return {
      pitchScore: 0,
      stabilityScore: 0,
      energyScore: 0,
      rhythmScore: 0,
      finalScore: 0,
      hasEnoughData: false
    }
  }

  var voiced = samples.filter(function (s) { return s.freq > 0 })
  var voicedRatio = voiced.length / samples.length

  // AFINACION: proporcion de tiempo con tono claro y detectado + suavidad del recorrido de notas.
  var jumps = []
  for (var i = 1; i < voiced.length; i++) {
    var cents = Math.abs(freqToCents(voiced[i].freq, voiced[i - 1].freq))
    if (cents < 1200) jumps.push(cents)
  }
  var avgJump = jumps.length ? jumps.reduce(function (a, b) { return a + b }, 0) / jumps.length : 200
  var smoothness = clamp(100 - avgJump / 4, 0, 100)
  var pitchScore = Math.round(clamp(voicedRatio * 60 + smoothness * 0.4, 0, 100))

  // ESTABILIDAD: que tan poco varian los saltos entre notas consecutivas (tolera vibrato natural).
  var jumpVariance = 0
  if (jumps.length > 1) {
    var meanJump = avgJump
    var sq = jumps.map(function (j) { return Math.pow(j - meanJump, 2) })
    jumpVariance = sq.reduce(function (a, b) { return a + b }, 0) / jumps.length
  }
  var stabilityScore = Math.round(clamp(100 - Math.sqrt(jumpVariance) / 3, 15, 100))

  // ENERGIA: nivel promedio + dinamica (no solo volumen, tambien variacion expresiva).
  var rmsValues = samples.map(function (s) { return s.rms })
  var avgRms = rmsValues.reduce(function (a, b) { return a + b }, 0) / rmsValues.length
  var maxRms = Math.max.apply(null, rmsValues)
  var dynamicRange = maxRms - avgRms
  var energyScore = Math.round(clamp(avgRms * 500 + dynamicRange * 300, 0, 100))

  // RITMO: version inicial basada en consistencia temporal de la actividad vocal
  // (no se compara contra la pista, tal como indica el documento base).
  var activeFlags = samples.map(function (s) { return s.rms > 0.02 ? 1 : 0 })
  var transitions = 0
  for (var t = 1; t < activeFlags.length; t++) {
    if (activeFlags[t] !== activeFlags[t - 1]) transitions++
  }
  var activityRatio = activeFlags.reduce(function (a, b) { return a + b }, 0) / activeFlags.length
  var transitionRate = transitions / activeFlags.length
  var rhythmScore = Math.round(clamp(activityRatio * 70 + clamp(100 - transitionRate * 200, 0, 100) * 0.3, 10, 100))

  var finalScore = Math.round(
    pitchScore * 0.4 + rhythmScore * 0.25 + stabilityScore * 0.2 + energyScore * 0.15
  )

  return {
    pitchScore: pitchScore,
    stabilityScore: stabilityScore,
    energyScore: energyScore,
    rhythmScore: rhythmScore,
    finalScore: finalScore,
    hasEnoughData: true
  }
}

export function getFeedback(results) {
  if (!results.hasEnoughData) {
    return '🎤 No captamos suficiente audio esta vez, pero la próxima va a sonar increíble.'
  }

  var lines = []

  if (results.pitchScore >= 80) {
    lines.push('🎯 Tu afinación estuvo muy sólida.')
  } else if (results.pitchScore < 45) {
    lines.push('🎤 Sigue practicando y atreviéndote. Cada canción te hace mejorar.')
  }

  if (results.rhythmScore >= 80) {
    lines.push('🥁 Tu ritmo estuvo muy bien controlado.')
  }

  if (results.stabilityScore < 45) {
    lines.push('🎵 Intenta mantener las notas durante más tiempo.')
  }

  if (results.energyScore >= 85) {
    lines.push('🔥 ¡Te adueñaste completamente del escenario!')
  } else if (results.energyScore >= 65) {
    lines.push('🔥 Tu presentación tuvo mucha energía.')
  }

  if (lines.length === 0) {
    lines.push('🎉 ¡Buena presentación! Sigue cantando y disfrutando.')
  }

  return lines[0]
}
