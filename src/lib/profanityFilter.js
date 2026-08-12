// Retroke Live -- filtro de garabatos para el chat en vivo. Modulo
// compartido: lo usa el frontend (aviso instantaneo antes de enviar) Y
// /api/live-comment.js (la validacion real, la que de verdad bloquea el
// insert -- el chequeo del frontend es solo para que la persona vea el
// aviso al toque, no es la barrera de seguridad).
//
// Es un filtro por lista de palabras con normalizacion basica (sin tildes,
// mayusculas/minusculas, leetspeak simple, letras repetidas). No es
// perfecto -- ningun filtro de lista lo es -- pero cubre el caso comun de
// un chat de karaoke en un bar. Se puede ampliar la lista despues sin tocar
// el resto del archivo.
var BAD_WORDS = [
  'conchetumadre', 'conchadetumadre', 'ctm', 'qliao', 'weon culiao', 'culiao', 'culia',
  'maricon', 'marica', 'puta', 'puto', 'putas', 'putos', 'perra', 'zorra',
  'mierda', 'pendejo', 'gilipollas', 'cabron', 'cabrona',
  'verga', 'pelotudo', 'boludo', 'concha de tu madre', 'concha tu madre',
  'hijo de puta', 'hija de puta', 'hijueputa', 'malparido', 'malparida',
  'imbecil', 'idiota', 'retrasado mental', 'mogolico',
  'coño', 'chinga tu madre', 'chingada', 'joder', 'gonorrea'
]

function stripAccents(text) {
  return text.normalize ? text.normalize('NFD').replace(/[̀-ͯ]/g, '') : text
}

function normalize(text) {
  var t = stripAccents(String(text || '').toLowerCase())
  t = t.replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!]/g, 'i').replace(/0/g, 'o').replace(/\$/g, 's')
  t = t.replace(/(.)\1{2,}/g, '$1$1') // "puuuuuta" -> "puuta"
  return t
}

function compact(text) {
  return normalize(text).replace(/[^a-z0-9]/g, '')
}

export function containsProfanity(text) {
  if (!text) return false
  var norm = normalize(text)
  var comp = compact(text)
  for (var i = 0; i < BAD_WORDS.length; i++) {
    var word = BAD_WORDS[i]
    var wordCompact = compact(word)
    if (norm.indexOf(word) !== -1) return true
    if (wordCompact.length > 2 && comp.indexOf(wordCompact) !== -1) return true
  }
  return false
}

// Validacion completa de un comentario: largo + garabatos. Se usa igual en
// el frontend (aviso rapido) y en el backend (barrera real).
export function validateComment(text) {
  var trimmed = String(text || '').trim()
  if (!trimmed) return { ok: false, reason: 'empty' }
  if (trimmed.length > 220) return { ok: false, reason: 'too_long' }
  if (containsProfanity(trimmed)) return { ok: false, reason: 'profanity' }
  return { ok: true, text: trimmed }
}
