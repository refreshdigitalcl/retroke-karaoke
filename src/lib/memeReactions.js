export var MEME_REACTIONS = [
  { id: 'meme-nino-boca', url: '/memes/meme-nino-boca.png', sentiment: 0.9 },
  { id: 'meme-nino-manos', url: '/memes/meme-nino-manos.png', sentiment: 0.75 },
  { id: 'meme-nino-triste', url: '/memes/meme-nino-triste.png', sentiment: 0.5 },
  { id: 'meme-nina', url: '/memes/meme-nina.png', sentiment: 0.35 },
  { id: 'meme-bebe', url: '/memes/meme-bebe.jpg', sentiment: 0.25 },
  { id: 'meme-eyeroll', url: '/memes/meme-eyeroll.gif', sentiment: 0.15 }
]

export function isMemeReaction(value) {
  return typeof value === 'string' && value.indexOf('meme:') === 0
}

export function getMemeUrl(value) {
  var id = value.replace('meme:', '')
  var found = MEME_REACTIONS.find(function (m) { return m.id === id })
  return found ? found.url : null
}

export function getMemeSentiment(value) {
  var id = value.replace('meme:', '')
  var found = MEME_REACTIONS.find(function (m) { return m.id === id })
  return found ? found.sentiment : 0.5
}
