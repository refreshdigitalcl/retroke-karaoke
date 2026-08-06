// Busca posibles coincidencias reales en iTunes a partir de texto libre
// escrito por el participante (a veces con errores de tipeo, sobre todo en
// ingles, ej: "queen - ai want to brek free"). Devuelve hasta 4 sugerencias
// para que la persona elija, o siga escribiendo lo suyo si prefiere.
export async function searchSongMatches(query, limit) {
  var trimmed = (query || '').trim()
  if (trimmed.length < 3) return []
  var max = limit || 4
  try {
    var res = await fetch(
      'https://itunes.apple.com/search?term=' + encodeURIComponent(trimmed) + '&entity=song&limit=' + (max + 4)
    )
    if (!res.ok) return []
    var data = await res.json()
    if (!data.results || data.results.length === 0) return []

    var seen = {}
    var out = []
    for (var i = 0; i < data.results.length && out.length < max; i++) {
      var r = data.results[i]
      if (!r.trackName || !r.artistName) continue
      var key = (r.trackName + '|' + r.artistName).toLowerCase()
      if (seen[key]) continue
      seen[key] = true
      out.push({ id: r.trackId || key, song: r.trackName, artist: r.artistName, artwork: r.artworkUrl60 || '' })
    }
    return out
  } catch (err) {
    return []
  }
}
