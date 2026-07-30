// Filtro de lenguaje ofensivo para nombres en el formulario de registro.
// Cubre garabatos chilenos, argentinos y latinoamericanos en general, mas
// ingles basico. Detecta variantes con numeros/simbolos (leetspeak), letras
// repetidas, espacios entre letras, y combinaciones/frases compuestas
// (ej: "Saco De Weas", "CarePico", "El Culiaooo").

var BLOCKED_WORDS = [
  // Chile - palabras sueltas
  'aweonao', 'weon', 'hueon', 'weona', 'hueona', 'wn', 'wna', 'weones', 'hueones',
  'aweona', 'aweonada', 'aweonamiento',
  'pendejo', 'pendeja', 'pelmazo', 'pajaron', 'pajarona', 'pajero', 'pajera',
  'gil', 'gila', 'gilipollas', 'idiota', 'imbecil', 'estupido', 'estupida',
  'tarado', 'tarada', 'baboso', 'babosa', 'maricon', 'maricona', 'maraca', 'maraco',
  'conchetumare', 'conchetumadre', 'concha', 'ctm', 'csm', 'conchesumare',
  'puta', 'puto', 'putas', 'putos', 'culiao', 'culiada', 'culiaos', 'culia',
  'ql', 'qlo', 'culero', 'culera', 'pico', 'pichula', 'pichulita', 'pichulon',
  'chucha', 'chuchada', 'chuchesumare', 'chupapico', 'chupapija', 'chupamedias',
  'soplapico', 'soplapollas', 'paja', 'pajear', 'masturbar',
  'mariconazo', 'mariconada', 'perkin', 'perkinazo', 'sapo', 'sapa', 'soplon', 'soplona',
  'cagao', 'cagada', 'cagado', 'cagar', 'cagarse', 'mierda', 'mierdoso', 'mierdosa',
  'mierdero', 'culo', 'rajado', 'raja', 'zorra', 'zorro', 'cabron', 'cabrona', 'coño',
  'forro', 'forra', 'pelotudo', 'pelotuda', 'pelotudez', 'pelotear',
  'barsa', 'barsudo', 'barsuda', 'sinverguenza', 'carepalo', 'carewea', 'carepoto',
  'careculo', 'careraja', 'carechucha', 'cara de raja', 'cara de pico', 'cara de culo',
  'hijo de puta', 'hijo de perra', 'malparido', 'malparida', 'bastardo', 'bastarda',
  'cabeza de pico', 'cabeza de chorlito', 'cara de nalga', 'cara de palo', 'cara de weon',
  'cara de hueon', 'cara de poto', 'carepichula', 'carepico', 'caremalo', 'carecagao',
  'careconcha', 'caremaraca', 'careloco', 'careweon', 'carehueon',
  'wea', 'weas', 'huea', 'hueas', 'wevear', 'huevear', 'webeo', 'hueveo',
  'weon culiao', 'hueon culiao', 'weona culia', 'hueona culia', 'weonazo', 'hueonazo',
  'weonera', 'hueonera', 'weonaje', 'hueonaje', 'wea mala', 'huea mala', 'pura wea',
  'pura huea', 'que wea', 'que chucha', 'que mierda', 'la cago', 'la cagaste', 'cagaste',
  'cagon', 'cagona', 'cagonazo', 'cagonear', 'caguento', 'caguentero', 'caguentera',
  'penca', 'penca culiao', 'pencazo', 'pencon', 'pencona', 'chantado', 'chantao',
  'chanta', 'barson', 'patudo', 'patuda', 'sinverguenza', 'caradura', 'desgraciado',
  'desgraciada', 'maldito', 'maldita', 'condenado', 'condenada', 'infeliz',
  'saco de weas', 'saco de hueas', 'saco de mierda', 'pedazo de mierda', 'pura mierda',
  'mierda humana',
  // Latinoamerica en general
  'cojudo', 'cojuda', 'cojones', 'conchudo', 'conchuda', 'conchesumadre',
  'marica', 'maricas', 'mamon', 'mamona', 'mamada', 'mamar',
  'chinga', 'chingada', 'chingado', 'chingon', 'chingona', 'chingar', 'chingue',
  'chinga tu madre', 'hijueputa', 'hijuepucha', 'gonorrea', 'gonorreas',
  'carechimba', 'chimba', 'chimbada', 'chimbazo', 'caremonda', 'monda', 'monda',
  'mondazo', 'verga', 'vergazo', 'vergona', 'pito', 'pija', 'pijazo', 'pajazo',
  'putero', 'puteria', 'putear', 'perra', 'perro', 'perra malparida',
  'ojete', 'ojeteado', 'pinche', 'pinche cabron', 'pinche pendejo', 'no mames',
  'mames', 'mamadas', 'mamador', 'mamadora', 'chupapijas', 'chupapitos',
  'chupaverga', 'soplapijas', 'soplapitos', 'soplavergas',
  'boludo', 'boluda', 'boludo de mierda', 'gilipolla', 'imbécil', 'pajarraco',
  'mamerto', 'mamerta', 'lambon', 'lambona', 'lameculos', 'lameculo', 'chupamedia',
  // Ingles - comunes
  'fuck', 'fucker', 'fucking', 'fuk', 'fck', 'shit', 'shitty', 'bitch', 'biatch',
  'asshole', 'bastard', 'cunt', 'dick', 'dickhead', 'pussy', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded'
]

function normalize(text) {
  var t = text.toLowerCase()
  t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  t = t
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
  // colapsar cualquier letra repetida seguidas a una sola (culiaooooo -> culiao)
  t = t.replace(/(.)\1+/g, '$1')
  return t
}

export function containsProfanity(rawText) {
  if (!rawText) return false
  var normalized = normalize(rawText)
  // version con espacios reales (para frases) sin puntuacion
  var withSpaces = normalized.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  // version totalmente aplastada, sin espacios ni puntuacion (para
  // detectar evasiones tipo "W E O N", "CarePico", "Saco De Weas")
  var squashed = normalized.replace(/[^a-z0-9]/g, '')

  var i = 0
  while (i < BLOCKED_WORDS.length) {
    var word = BLOCKED_WORDS[i]
    var wordSquashed = word.replace(/[^a-z0-9]/g, '')
    if (withSpaces.indexOf(word) !== -1 || squashed.indexOf(wordSquashed) !== -1) {
      return true
    }
    i = i + 1
  }
  return false
}
