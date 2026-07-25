export var MEME_REACTIONS = [
  { id: 'meme-nina', url: '/memes/meme-nina.png' },
  { id: 'meme-nino-triste', url: '/memes/meme-nino-triste.png' },
  { id: 'meme-nino-boca', url: '/memes/meme-nino-boca.png' },
  { id: 'meme-nino-manos', url: '/memes/meme-nino-manos.png' },
  { id: 'meme-eyeroll', url: '/memes/meme-eyeroll.gif' },
  { id: 'meme-bebe', url: '/memes/meme-bebe.jpg' }
]

export function isMemeReaction(value) {
  return typeof value === 'string' && value.indexOf('meme:') === 0
}

export function getMemeUrl(value) {
  var id = value.replace('meme:', '')
  var found = MEME_REACTIONS.find(function (m) { return m.id === id })
  return found ? found.url : null
}
