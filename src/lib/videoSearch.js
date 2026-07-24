var YOUTUBE_API_KEY = 'AIzaSyBeB0rmGsJgmRw4ZXDq2ZFtTqY1WFAQxdQ'

export async function searchSimilarVideos(query) {
  var url =
    'https://www.googleapis.com/youtube/v3/search' +
    '?part=snippet' +
    '&type=video' +
    '&maxResults=6' +
    '&q=' + encodeURIComponent(query) +
    '&key=' + YOUTUBE_API_KEY

  try {
    var res = await fetch(url)
    if (!res.ok) return []
    var data = await res.json()
    if (!data.items || data.items.length === 0) return []

    return data.items.map(function (item) {
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        author: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.medium
          ? item.snippet.thumbnails.medium.url
          : ''
      }
    })
  } catch (err) {
    return []
  }
}
