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

// Rotacion para el plan PRO: la primera cancion de la sala de espera es
// siempre la guaracha (guiño de marca), y despues va rotando el resto
// al azar sin repetir ninguna hasta que pasaron todas ("bolsa" que se
// vuelve a barajar solo cuando se vacia, y nunca deja que la ultima de
// una vuelta se repita como primera de la siguiente).
export function createProRotation() {
  var bag = []
  var lastTrack = null

  function refillBag() {
    var shuffled = shuffle(WAITING_TRACKS)
    // Si por mala suerte la primera de la nueva vuelta es igual a la
    // ultima que sono, la mandamos al final para evitar la repeticion.
    if (shuffled[0] === lastTrack && shuffled.length > 1) {
      shuffled.push(shuffled.shift())
    }
    bag = shuffled
  }

  return {
    first: function () {
      lastTrack = FREE_TRACK
      return FREE_TRACK
    },
    next: function () {
      if (bag.length === 0) refillBag()
      var track = bag.shift()
      lastTrack = track
      return track
    }
  }
}
