export var WAITING_TRACKS = [
  '/sounds/waiting/track-1.mp3',
  '/sounds/waiting/track-2-reggaeton.mp3',
  '/sounds/waiting/track-3-cumbia.mp3',
  '/sounds/waiting/track-4-80s.mp3',
  '/sounds/waiting/track-5-rock.mp3'
]

export function pickRandomTrack() {
  var index = Math.floor(Math.random() * WAITING_TRACKS.length)
  return WAITING_TRACKS[index]
}
