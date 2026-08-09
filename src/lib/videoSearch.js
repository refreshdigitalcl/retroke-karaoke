// La API key de YouTube ya NO vive aca. Antes estaba escrita directo en este
// archivo, lo que la dejaba visible para cualquiera que abriera las
// herramientas de desarrollador y expuesta en texto plano en el repo publico
// de GitHub. Ahora ambas funciones pasan por /api/youtube.js, un endpoint de
// Vercel donde la key queda guardada como variable de entorno del servidor
// (YOUTUBE_API_KEY, sin prefijo VITE_) y nunca se manda al navegador.

export async function fetchVideoDurationSeconds(videoId) {
  try {
    var res = await fetch('/api/youtube?type=duration&videoId=' + encodeURIComponent(videoId))
    if (!res.ok) return null
    var data = await res.json()
    return typeof data.seconds === 'number' ? data.seconds : null
  } catch (err) {
    return null
  }
}

export async function searchSimilarVideos(query, pageToken) {
  try {
    var url =
      '/api/youtube?type=search&q=' + encodeURIComponent(query) +
      (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')
    var res = await fetch(url)
    if (!res.ok) return { items: [], nextPageToken: null, error: 'upstream' }
    var data = await res.json()
    return {
      items: data.items || [],
      nextPageToken: data.nextPageToken || null,
      error: data.error || null
    }
  } catch (err) {
    return { items: [], nextPageToken: null, error: 'upstream' }
  }
}
