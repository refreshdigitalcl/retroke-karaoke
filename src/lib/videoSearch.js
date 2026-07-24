var INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.jing.rocks',
  'https://inv.nadeko.net',
  'https://iv.melmac.space',
  'https://invidious.privacyredirect.com'
]

function pickThumbnail(thumbnails) {
  if (!thumbnails || thumbnails.length === 0) return ''
  var medium = thumbnails.find(function (t) { return t.quality === 'medium' })
  return medium ? medium.url : thumbnails[0].url
}

export async function searchSimilarVideos(query) {
  for (var i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
    var instance = INVIDIOUS_INSTANCES[i]
    try {
      var res = await fetch(instance + '/api/v1/search?q=' + encodeURIComponent(query) + '&type=video')
      if (!res.ok) continue
      var data = await res.json()
      if (!Array.isArray(data) || data.length === 0) continue
      var results = data.slice(0, 6).map(function (item) {
        return {
          videoId: item.videoId,
          title: item.title,
          author: item.author,
          thumbnail: pickThumbnail(item.videoThumbnails)
        }
      })
      return results
    } catch (err) {
      continue
    }
  }
  return []
}
