var YOUTUBE_API_KEY = 'AIzaSyBeB0rmGsJgmRw4ZXDq2ZFtTqY1WFAQxdQ'

export async function fetchVideoDurationSeconds(videoId) {
  var url =
    'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' +
    videoId + '&key=' + YOUTUBE_API_KEY

  try {
    var res = await fetch(url)
    if (!res.ok) return null
    var data = await res.json()
    if (!data.items || data.items.length === 0) return null
    var iso = data.items[0].contentDetails.duration
    var match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return null
    var hours = parseInt(match[1] || '0', 10)
    var minutes = parseInt(match[2] || '0', 10)
    var seconds = parseInt(match[3] || '0', 10)
    return hours * 3600 + minutes * 60 + seconds
  } catch (err) {
    return null
  }
}

export async function searchSimilarVideos(query, pageToken) {
  var url =
    'https://www.googleapis.com/youtube/v3/search' +
    '?part=snippet' +
    '&type=video' +
    '&maxResults=6' +
    '&q=' + encodeURIComponent(query) +
    '&key=' + YOUTUBE_API_KEY +
    (pageToken ? '&pageToken=' + pageToken : '')

  try {
    var res = await fetch(url)
    if (!res.ok) return { items: [], nextPageToken: null }
    var data = await res.json()
    if (!data.items || data.items.length === 0) return { items: [], nextPageToken: null }

    var items = data.items.map(function (item) {
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        author: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.medium
          ? item.snippet.thumbnails.medium.url
          : ''
      }
    })
    return { items: items, nextPageToken: data.nextPageToken || null }
  } catch (err) {
    return { items: [], nextPageToken: null }
  }
}
