export var MEME_REACTIONS = [
  { id: 'sticker-01', url: '/stickers/sticker-01.gif', sentiment: 0.95 },
  { id: 'sticker-02', url: '/stickers/sticker-02.gif', sentiment: 0.85 },
  { id: 'sticker-03', url: '/stickers/sticker-03.gif', sentiment: 0.75 },
  { id: 'sticker-04', url: '/stickers/sticker-04.gif', sentiment: 0.65 },
  { id: 'sticker-05', url: '/stickers/sticker-05.gif', sentiment: 0.55 },
  { id: 'sticker-06', url: '/stickers/sticker-06.gif', sentiment: 0.45 },
  { id: 'sticker-07', url: '/stickers/sticker-07.gif', sentiment: 0.35 },
  { id: 'sticker-08', url: '/stickers/sticker-08.gif', sentiment: 0.25 },
  { id: 'sticker-09', url: '/stickers/sticker-09.gif', sentiment: 0.15 },
  { id: 'sticker-10', url: '/stickers/sticker-10.gif', sentiment: 0.5 },
  { id: 'sticker-11', url: '/stickers/sticker-11.gif', sentiment: 0.6 },
  { id: 'sticker-12', url: '/stickers/sticker-12.gif', sentiment: 0.4 }
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
