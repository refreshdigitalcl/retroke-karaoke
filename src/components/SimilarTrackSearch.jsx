import { useRef, useState } from 'react'
import { searchSimilarVideos } from '../lib/videoSearch'

var MAX_RESULTS = 12
var SEARCH_TIMEOUT_MS = 8000

// La búsqueda nunca debe dejar la UI colgada: si la promesa no responde
// dentro del plazo (wifi lento, YouTube caído, etc.) se resuelve igual
// con un resultado vacío para que la pantalla pueda reaccionar.
function withTimeout(promise, ms) {
  return new Promise(function (resolve) {
    var settled = false
    var timer = setTimeout(function () {
      if (settled) return
      settled = true
      resolve({ items: [], nextPageToken: null })
    }, ms)
    promise
      .then(function (data) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(data && data.items ? data : { items: [], nextPageToken: null })
      })
      .catch(function () {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve({ items: [], nextPageToken: null })
      })
  })
}

export default function SimilarTrackSearch(props) {
  var query = props.query
  var onSelect = props.onSelect

  var statusState = useState('idle')
  var status = statusState[0]
  var setStatus = statusState[1]

  var resultsState = useState([])
  var results = resultsState[0]
  var setResults = resultsState[1]

  var nextTokenRef = useRef(null)
  var loadingMoreRef = useRef(false)
  var scrollRef = useRef(null)

  function handleSearch() {
    if (!query) {
      setStatus('empty')
      return
    }
    setStatus('loading')
    withTimeout(searchSimilarVideos(query + ' karaoke'), SEARCH_TIMEOUT_MS).then(function (data) {
      var items = (data && data.items) || []
      setResults(items)
      nextTokenRef.current = (data && data.nextPageToken) || null
      setStatus(items.length > 0 ? 'done' : 'empty')
    })
  }

  function loadMore() {
    if (loadingMoreRef.current) return
    if (!nextTokenRef.current) return
    if (results.length >= MAX_RESULTS) return
    loadingMoreRef.current = true
    withTimeout(searchSimilarVideos(query + ' karaoke', nextTokenRef.current), SEARCH_TIMEOUT_MS).then(function (data) {
      var items = (data && data.items) || []
      setResults(function (prev) {
        var existingIds = prev.map(function (p) { return p.videoId })
        var fresh = items.filter(function (item) { return existingIds.indexOf(item.videoId) === -1 })
        return prev.concat(fresh).slice(0, MAX_RESULTS)
      })
      nextTokenRef.current = (data && data.nextPageToken) || null
      loadingMoreRef.current = false
    }).catch(function () {
      loadingMoreRef.current = false
    })
  }

  function handleScroll() {
    var el = scrollRef.current
    if (!el) return
    var distanceFromEnd = el.scrollWidth - el.scrollLeft - el.clientWidth
    if (distanceFromEnd < 160) {
      loadMore()
    }
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
        <div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-2.5 mt-2 overflow-x-auto pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'thin' }}
          >
            {results.map(function (r) {
              return (
                <button
                  key={r.videoId}
                  onClick={function () {
                    onSelect('https://www.youtube.com/watch?v=' + r.videoId, r.videoId)
                    setStatus('idle')
                    setResults([])
                    nextTokenRef.current = null
                  }}
                  className="text-left rounded-xl overflow-hidden border-2 transition-colors hover:border-opacity-100 shrink-0 snap-start"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-card-alt)', width: '132px' }}
                >
                  <div
                    className="w-full flex items-center justify-center"
                    style={{ height: '74px', background: '#000' }}
                  >
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-[10px] px-1.5 py-1 leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {r.title}
                  </p>
                </button>
              )
            })}
            {nextTokenRef.current && results.length < MAX_RESULTS && (
              <button
                onClick={loadMore}
                className="shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center px-3"
                style={{ borderColor: 'var(--accent-purple)', color: 'var(--accent-purple)', width: '90px' }}
              >
                <span className="text-xl">→</span>
                <span className="text-[10px]">Ver más</span>
              </button>
            )}
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {results.length < MAX_RESULTS ? 'Desliza para ver mas opciones' : results.length + ' opciones cargadas'}
          </p>
        </div>
      )}
    </div>
  )
}
