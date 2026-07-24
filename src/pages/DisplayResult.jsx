import { useMemo } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FallingParty from '../components/FallingParty'

export default function DisplayResult() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var ratings = session.ratings

  var songRatings = useMemo(function () {
    if (!currentSinger) return []
    return ratings.filter(function (r) { return r.singerId === String(currentSinger.id) })
  }, [ratings, currentSinger])

  var average = useMemo(function () {
    if (songRatings.length === 0) return null
    var sum = 0
    var i = 0
    while (i < songRatings.length) {
      sum = sum + songRatings[i].score
      i = i + 1
    }
    return (sum / songRatings.length).toFixed(1)
  }, [songRatings])

  if (!currentSinger) return null

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 bg-black">
      <RetroEqualizer />
      <FallingParty />

      <p className="relative z-10 text-2xl md:text-4xl font-extrabold text-white mb-2 text-center">
        🎉 Gran presentacion
      </p>
      <p className="relative z-10 text-xl md:text-2xl text-purple-300 mb-10 text-center">
        {currentSinger.name}
      </p>

      <div className="relative z-10 rounded-3xl border-2 border-yellow-400 bg-neutral-950/85 px-12 py-10 flex flex-col items-center">
        {average ? (
          <>
            <p className="text-8xl md:text-9xl font-extrabold text-yellow-400 leading-none">
              {average}
            </p>
            <p className="text-sm text-neutral-400 mt-4">
              {songRatings.length} {songRatings.length === 1 ? 'voto' : 'votos'}
            </p>
          </>
        ) : (
          <p className="text-xl text-neutral-400">Sin votos suficientes</p>
        )}
      </div>
    </div>
  )
}
