// Filtro de lenguaje ofensivo para nombres en el formulario de registro.
// Cubre garabatos y expresiones vulgares comunes en español (Chile,
// Argentina y Latinoamerica en general) e ingles, incluyendo variantes
// con numeros/simbolos que se usan para evadir filtros (leetspeak).

var BLOCKED_WORDS = [
  // Español - vulgaridades comunes / sexuales
  'puta', 'puto', 'putas', 'putos', 'putazo',
  'concha', 'conchatumadre', 'conchetumare', 'ctm',
  'culiao', 'culiado', 'culia', 'culear', 'culon', 'culona',
  'pendejo', 'pendeja',
  'verga', 'pinga', 'pico', 'poronga', 'chota',
  'pelotudo', 'pelotuda', 'boludo de mierda',
  'forro', 'forra',
  'cagon', 'cagona',
  'mierda', 'mierdero',
  'chucha', 'chuchatumadre',
  'maricon', 'marico',
  'zorra', 'perra',
  'cabron', 'cabrona',
  'gilipollas',
  'coño',
  'joder',
  'follar',
  'pajero', 'paja',
  'chingar', 'chingada', 'chingadamadre',
  'hijueputa', 'hijodeputa', 'hdp',
  'malparido', 'malparida',
  'guevon culiado',
  'weon culiao',
  // Español - discriminatorio
  'negro de mierda', 'indio de mierda', 'sudaca de mierda',
  'muerete', 'ojala te mueras',
  // Ingles - comunes
  'fuck', 'fucker', 'fucking', 'fuk', 'fck',
  'shit', 'shitty',
  'bitch', 'biatch',
  'asshole', 'ass hole',
  'bastard',
  'cunt',
  'dick', 'dickhead',
  'pussy',
  'whore', 'slut',
  'nigger', 'nigga',
  'faggot', 'fag',
  'retard', 'retarded'
]

function normalize(text) {
  var t = text.toLowerCase()
  t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  t = t
    .replace(/[@4]/g, 'a')
    .replace(/[03]/g, 'o')
    .replace(/1/g, 'i')
    .replace(/\$5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
  t = t.replace(/(.)\1{2,}/g, '$1$1')
  return t
}

export function containsProfanity(rawText) {
  if (!rawText) return false
  var normalized = normalize(rawText)
  var collapsed = normalized.replace(/[^a-z0-9]/g, '')
  var i = 0
  while (i < BLOCKED_WORDS.length) {
    var word = BLOCKED_WORDS[i]
    var wordCollapsed = word.replace(/[^a-z0-9]/g, '')
    if (normalized.indexOf(word) !== -1 || collapsed.indexOf(wordCollapsed) !== -1) {
      return true
    }
    i = i + 1
  }
  return false
}
