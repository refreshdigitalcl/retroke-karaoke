import { useState } from 'react'
import { searchSimilarVideos } from '../lib/videoSearch'

export default function SimilarTrackSearch(props) {
  var query = props.query
  var onSelect = props.onSelect

  var statusState = useState('idle')
  var status = statusState[0]
  var setStatus = statusState[1]

  var resultsState = useState([])
  var results = resultsState[0]
  var setResults = resultsState[1]

  function handleSearch() {
    setStatus('loading')
    searchSimilarVideos(query + ' karaoke').then(function (data) {
      setResults(data)
      setStatus(data.length > 0 ? 'done' : 'empty')
    })
  }

  return (
    <div className="mt-3">
      {status === 'idle' && (
        <button
          onClick={handleSearch}
          className="text-xs px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)' }}
        >
          Buscar pista similar
        </button>
      )}

      {status === 'loading' && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Buscando pistas similares...</p>
      )}

      {status === 'empty' && (
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
            No se encontraron resultados por ahora.
          </p>
          <button
            onClick={handleSearch}
            className="text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)' }}
          >
            Reintentar busqueda
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {results.map(function (r) {
            return (
              <button
                key={r.videoId}
                onClick={function () {
                  onSelect('https://www.youtube.com/watch?v=' + r.videoId, r.videoId)
                  setStatus('idle')
                  setResults([])
                }}
                className="text-left rounded-lg overflow-hidden border"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card-alt)' }}
              >
                {r.thumbnail && (
                  <img src={r.thumbnail} alt={r.title} className="w-full h-20 object-cover" />
                )}
                <p className="text-[11px] px-1.5 py-1 leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                  {r.title}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
