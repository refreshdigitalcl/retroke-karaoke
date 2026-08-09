export var WAITING_TRACKS = [
  '/sounds/waiting/track-1.mp3',
  '/sounds/waiting/track-2-reggaeton.mp3',
  '/sounds/waiting/track-3-cumbia.mp3',
  '/sounds/waiting/track-4-80s.mp3',
  '/sounds/waiting/track-5-rock.mp3',
  '/sounds/waiting/track-6-rap-chileno.mp3'
]

export var FREE_TRACK = '/sounds/free-guaracha.mp3'

export function pickRandomTrack() {
  var index = Math.floor(Math.random() * WAITING_TRACKS.length)
  return WAITING_TRACKS[index]
}

// En el plan FREE solo suena esta cancion fija, en loop, sin rotar.
export function pickTrackForPlan(workspacePlan) {
  if (workspacePlan !== 'PRO') return FREE_TRACK
  return pickRandomTrack()
}

function shuffle(arr) {
  var copy = arr.slice()
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

// Rotacion para el plan PRO. Antes "first()" arrancaba siempre con la
// guaracha como guiño de marca, pero eso significaba que cada vez que se
// recargaba/reabria la sala de espera sonaba lo mismo. Ahora la guaracha es
// una cancion mas dentro del mazo (no exclusiva de Free) y "first()" saca
// una carta al azar igual que "next()" -- asi cada apertura de la sala de
// espera suena distinto, sin ningun punto de partida fijo. Sigue siendo un
// sistema de "bolsa" que se rebaraja sola cuando se vacia, y nunca deja que
// la ultima cancion de una vuelta se repita como primera de la siguiente.
export function createProRotation() {
  var ALL_TRACKS = WAITING_TRACKS.concat([FREE_TRACK])
  var bag = []
  var lastTrack = null

  function refillBag() {
    var shuffled = shuffle(ALL_TRACKS)
    if (shuffled[0] === lastTrack && shuffled.length > 1) {
      shuffled.push(shuffled.shift())
    }
    bag = shuffled
  }

  function draw() {
    if (bag.length === 0) refillBag()
    var track = bag.shift()
    lastTrack = track
    return track
  }

  return {
    first: draw,
    next: draw
  }
}
