export var REACTION_EMOJIS = [
  { emoji: '🔥', sentiment: 1.0 },
  { emoji: '❤️', sentiment: 0.95 },
  { emoji: '😍', sentiment: 0.92 },
  { emoji: '⭐', sentiment: 0.88 },
  { emoji: '👏', sentiment: 0.85 },
  { emoji: '🎤', sentiment: 0.82 },
  { emoji: '🙌', sentiment: 0.78 },
  { emoji: '😂', sentiment: 0.6 },
  { emoji: '👍', sentiment: 0.5 },
  { emoji: '😐', sentiment: 0.25 }
]

export function getSentiment(emoji) {
  var found = REACTION_EMOJIS.find(function (r) { return r.emoji === emoji })
  return found ? found.sentiment : 0.5
}
