// Detección automática del "artista real" de una canción, usada para
// reemplazar la confirmación manual que antes hacía el DJ.
export async function fetchArtistNameForSong(song) {
  if (!song) return null
  try {
    var query = encodeURIComponent(song)
    var res = await fetch('https://itunes.apple.com/search?term=' + query + '&entity=song&limit=1')
    if (!res.ok) return null
    var data = await res.json()
    if (data.results && data.results.length > 0 && data.results[0].artistName) {
      return data.results[0].artistName
    }
    return null
  } catch (err) {
    return null
  }
}
