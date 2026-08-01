export var WAITING_TRACKS = [
  '/sounds/waiting/track-1.mp3',
  '/sounds/waiting/track-2-reggaeton.mp3',
  '/sounds/waiting/track-3-cumbia.mp3',
  '/sounds/waiting/track-4-80s.mp3',
  '/sounds/waiting/track-5-rock.mp3'
]

export var FREE_TRACK = '/sounds/free-guaracha.mp3'

export function pickRandomTrack() {
  var index = Math.floor(Math.random() * WAITING_TRACKS.length)
  return WAITING_TRACKS[index]
}

// En el plan FREE solo suena esta cancion fija. En PRO se elige una
// aleatoria entre las 5 pistas de siempre.
export function pickTrackForPlan(workspacePlan) {
  if (workspacePlan !== 'PRO') return FREE_TRACK
  return pickRandomTrack()
}
