// Busca la cancion/artista real en iTunes a partir de texto libre escrito
// por el participante (a veces con errores de tipeo, sobre todo en ingles,
// ej: "queen - ai want to brek free"). Se usa para autocorregir antes de
// que la entrada aparezca en la cola.
export async function searchSongMatch(query) {
  var trimmed = (query || '').trim()
  if (trimmed.length < 3) return null
  try {
    var res = await fetch(
      'https://itunes.apple.com/search?term=' + encodeURIComponent(trimmed) + '&entity=song&limit=1'
    )
    if (!res.ok) return null
    var data = await res.json()
    if (data.results && data.results.length > 0) {
      var r = data.results[0]
      if (r.trackName && r.artistName) {
        return { song: r.trackName, artist: r.artistName }
      }
    }
    return null
  } catch (err) {
    return null
  }
}
