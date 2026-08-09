// Proxy server-side para la Data API de YouTube.
//
// Antes, src/lib/videoSearch.js llamaba a googleapis.com directo desde el
// navegador con la API key escrita en el codigo fuente. Eso significa que
// la key quedaba visible para cualquiera que abriera las herramientas de
// desarrollador, y ademas expuesta en texto plano en el repositorio publico
// de GitHub -- cualquier bot que rastree repos puede haberla encontrado y
// estar usandola, lo que agota la cuota diaria (bastante baja por defecto:
// 10.000 unidades/dia, y una busqueda cuesta 100 unidades = ~100 busquedas
// diarias para TODA la app, compartidas entre todos los locales). Eso
// explica el patron de "funciono la primera vez, despues se rompio": no es
// un bug de la transicion Free -> PRO en si, es la cuota compartida
// agotandose.
//
// Con este endpoint, la key vive solo en el servidor (variable de entorno
// YOUTUBE_API_KEY en Vercel, SIN prefijo VITE_) y nunca se manda al
// navegador. Ademas, cuando Google responde con cuota agotada, se lo
// avisamos al frontend con { error: 'quota' } en vez de simplemente
// devolver una lista vacia -- asi la pantalla puede mostrar un mensaje
// claro en vez de un "no se encontraron resultados" enganoso.

async function handleSearch(req, res, apiKey) {
  var q = req.query.q
  var pageToken = req.query.pageToken

  if (!q) {
    res.status(400).json({ error: 'missing_query' })
    return
  }

  try {
    var searchUrl =
      'https://www.googleapis.com/youtube/v3/search' +
      '?part=snippet&type=video&maxResults=6' +
      '&q=' + encodeURIComponent(q) +
      '&key=' + apiKey +
      (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')

    var ytRes = await fetch(searchUrl)

    if (!ytRes.ok) {
      var errBody = await ytRes.json().catch(function () { return null })
      var reason =
        errBody && errBody.error && errBody.error.errors && errBody.error.errors[0]
          ? errBody.error.errors[0].reason
          : null
      var isQuota = ytRes.status === 403 && (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')
      res.status(200).json({ items: [], nextPageToken: null, error: isQuota ? 'quota' : 'upstream' })
      return
    }

    var data = await ytRes.json()
    if (!data.items || data.items.length === 0) {
      res.status(200).json({ items: [], nextPageToken: null })
      return
    }

    var items = data.items.map(function (item) {
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        author: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails && item.snippet.thumbnails.medium
            ? item.snippet.thumbnails.medium.url
            : ''
      }
    })

    res.status(200).json({ items: items, nextPageToken: data.nextPageToken || null })
  } catch (err) {
    res.status(200).json({ items: [], nextPageToken: null, error: 'upstream' })
  }
}

async function handleDuration(req, res, apiKey) {
  var videoId = req.query.videoId
  if (!videoId) {
    res.status(400).json({ error: 'missing_video_id' })
    return
  }

  try {
    var url =
      'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' +
      encodeURIComponent(videoId) + '&key=' + apiKey

    var ytRes = await fetch(url)
    if (!ytRes.ok) {
      res.status(200).json({ seconds: null, error: ytRes.status === 403 ? 'quota' : 'upstream' })
      return
    }

    var data = await ytRes.json()
    if (!data.items || data.items.length === 0) {
      res.status(200).json({ seconds: null })
      return
    }

    var iso = data.items[0].contentDetails.duration
    var match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) {
      res.status(200).json({ seconds: null })
      return
    }

    var hours = parseInt(match[1] || '0', 10)
    var minutes = parseInt(match[2] || '0', 10)
    var seconds = parseInt(match[3] || '0', 10)
    res.status(200).json({ seconds: hours * 3600 + minutes * 60 + seconds })
  } catch (err) {
    res.status(200).json({ seconds: null, error: 'upstream' })
  }
}

module.exports = async function handler(req, res) {
  var apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'server_misconfigured' })
    return
  }

  if (req.query.type === 'duration') {
    await handleDuration(req, res, apiKey)
    return
  }

  await handleSearch(req, res, apiKey)
}
