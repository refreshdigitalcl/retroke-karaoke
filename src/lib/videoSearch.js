var INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.jing.rocks',
  'https://inv.nadeko.net',
  'https://iv.melmac.space',
  'https://invidious.privacyredirect.com',
  'https://invidious.protokolla.fi',
  'https://invidious.reallyaweso.me',
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.lunar.icu'
]

function pickThumbnail(thumbnails) {
  if (!thumbnails || thumbnails.length === 0) return ''
  var medium = thumbnails.find(function (t) { return t.quality === 'medium' })
  return medium ? medium.url : thumbnails[0].url
}

function fetchFromInstance(instance, query, timeoutMs) {
  var controller = new AbortController()
  var timeoutId = setTimeout(function () { controller.abort() }, timeoutMs)

  return fetch(instance + '/api/v1/search?q=' + encodeURIComponent(query) + '&type=video', {
    signal: controller.signal
  })
    .then(function (res) {
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('bad response')
      return res.json()
    })
    .then(function (data) {
      if (!Array.isArray(data) || data.length === 0) throw new Error('empty')
      return data.slice(0, 6).map(function (item) {
        return {
          videoId: item.videoId,
          title: item.title,
          author: item.author,
          thumbnail: pickThumbnail(item.videoThumbnails)
        }
      })
    })
    .catch(function (err) {
      clearTimeout(timeoutId)
      throw err
    })
}

export async function searchSimilarVideos(query) {
  var attempts = INVIDIOUS_INSTANCES.map(function (instance) {
    return fetchFromInstance(instance, query, 4500)
  })

  try {
    var result = await Promise.any(attempts)
    return result
  } catch (err) {
    return []
  }
}
