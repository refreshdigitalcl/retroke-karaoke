export var ROAST_PHRASES = [
  'Quiso aportar… pero la cancion no estaba de acuerdo. 🎶😂',
  'La cancion sobrevivio. Nosotros no. 💀🎵',
  'Spotify acaba de presentar una denuncia. 🎧⚖️😂',
  'No desafino. Exploro nuevas tonalidades. 🎶🧭😂',
  'Confirmo mi ausencia para el proximo show. 🚫🎤😂',
  'El microfono hizo lo que pudo. 🎤🙏😂',
  'Tiene voz. No sabemos donde. 🔍🎤😂',
  'No fue karaoke, era una prueba de resistencia. 🏋️‍♂️🎤😂',
  'El autotune pidio vacaciones. 🤖🏖️🎶',
  'La afinacion fue encontrada sin vida. 🎼💀😂',
  'Canto como si nadie estuviera escuchando. Ojala. 🎤🙉😂',
  'La cancion pidio cambio de cantante. 🎶🔄😂',
  'Tiene potencial… en otra industria. 📈😂',
  'No fue una interpretacion… fue una experiencia. 🎤🫠😂',
  'Agradecemos su valentia. 🫡🎤😂'
]

export var HYPE_PHRASES = [
  'Spotify deberia estar preocupado. 🎧😰🔥',
  'El autotune acaba de presentar su renuncia. 🤖📄😂🔥',
  'No canto… nos dio un concierto gratis. 🎤🎶👏🔥',
  'El publico oficialmente exige un bis. 👏📣🎤🔥',
  'Nacio una estrella. Y nosotros estuvimos presentes. ⭐🎤🙌',
  'No gano el karaoke. El karaoke gano con el. 🏆🎤🔥',
  'La afinacion llego y se quedo. 🎶🏠😂',
  'Confirmo mi asistencia al proximo show. ✅🎤🔥',
  'El microfono encontro a su persona favorita. 🎤❤️✨',
  'La competencia acaba de ponerse interesante. 👀🔥🏆',
  'Vino a cantar y termino dando una masterclass. 🎤🎓🔥',
  'La cancion nunca habia sonado tan bien. 🎶✨👏',
  'Hoy si se justifico pagar el karaoke. 💸🎤😂🔥',
  'El escenario no estaba preparado para tanto flow. 🎤😎🔥',
  'Si esto era una audicion, queda contratado. 📝🎤✅🔥'
]

function shuffle(arr) {
  var copy = arr.slice()
  var i = copy.length - 1
  while (i > 0) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
    i = i - 1
  }
  return copy
}

export function getBalancedPhrases() {
  var roast = shuffle(ROAST_PHRASES)
  var hype = shuffle(HYPE_PHRASES)
  var combined = []
  var i = 0
  while (i < 8 && i < roast.length) {
    combined.push({ text: roast[i], kind: 'roast' })
    i = i + 1
  }
  i = 0
  while (i < 7 && i < hype.length) {
    combined.push({ text: hype[i], kind: 'hype' })
    i = i + 1
  }
  return shuffle(combined).slice(0, 15)
}
