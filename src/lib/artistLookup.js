// Deteccion automatica del artista real de una cancion (y su portada de
// album), via la API publica de busqueda de iTunes. Se usa cuando el DJ
// llama a un cantante y no se sabe el artista todavia (por ejemplo, no vino
// de una de las 4 sugerencias del formulario) — asi la pantalla de
// preparate para cantar y la tarjeta compartible siempre pueden mostrar
// artista y portada sin que nadie tenga que escribirlo a mano.
export async function fetchArtistNameForSong(song) {
  if (!song || !song.trim()) return null
  try {
    const res = await fetch(
      'https://itunes.apple.com/search?term=' + encodeURIComponent(song) + '&entity=song&limit=1'
    )
    const data = await res.json()
    const match = data.results && data.results[0]
    if (!match) return null
    return {
      artistName: match.artistName || null,
      artworkUrl: match.artworkUrl100 ? match.artworkUrl100.replace('100x100', '300x300') : null
    }
  } catch (e) {
    return null
  }
}
