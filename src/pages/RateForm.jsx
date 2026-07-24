import { useState } from 'react'
import { useKaraokeSession } from '../contexts/KaraokeSessionContext'

var SCORES = [5, 6, 7, 8, 9, 10]

export default function RateForm() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger
  var submitRating = session.submitRating
  var screenMode = session.screenMode

  var selectedState = useState(null)
  var selected = selectedState[0]
  var setSelected = selectedState[1]

  var sentState = useState(false)
  var sent = sentState[0]
  var setSent = sentState[1]

  if (screenMode !== 'rating' || !currentSinger) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-black text-center">
        <div>
          <p className="text-4xl mb-4">🎤</p>
          <p className="text-neutral-400">
            Aun no hay votacion abierta. Vuelve cuando termine la cancion.
          </p>
        </div>
      </div>
    )
  }

  function handleSend() {
    if (!selected) return
    submitRating(selected)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-black">
      <div className="max-w-sm w-full rounded-3xl border-2 border-purple-500 bg-neutral-950/90 p-7 text-center rate-card-in">
        <div
          className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-4xl bg-pink-600 mx-auto mb-4"
          style={{ boxShadow: '0 0 22px 5px rgba(233, 30, 140, 0.5)' }}
        >
          {currentSinger.photo ? (
            <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
          ) : (
            currentSinger.avatar
          )}
        </div>

        <p className="text-xl font-extrabold text-white mb-1">
          Como estuvo {currentSinger.name}?
        </p>
        <p className="text-sm text-yellow-400 mb-7">{currentSinger.song}</p>

        {sent ? (
          <div className="sent-in py-4">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-lg font-bold text-white">Nota enviada</p>
            <p className="text-sm text-purple-300 mt-1">Gracias por votar</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {SCORES.map(function (score) {
                var isSelected = selected === score
                return (
                  <button
                    key={score}
                    onClick={function () { setSelected(score) }}
                    className={'aspect-square rounded-xl text-2xl font-extrabold border-2 transition-transform ' + (isSelected ? 'score-pop' : '')}
                    style={{
                      background: isSelected ? '#E91E8C' : 'rgba(139, 92, 246, 0.08)',
                      borderColor: isSelected ? '#F4D03F' : 'rgba(139, 92, 246, 0.35)',
                      color: isSelected ? '#fff' : '#e5e5e5',
                      boxShadow: isSelected ? '0 0 18px 3px rgba(233, 30, 140, 0.6)' : 'none'
                    }}
                  >
                    {score}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleSend}
              disabled={!selected}
              className="w-full h-12 rounded-xl font-bold text-white text-base disabled:opacity-30 transition-opacity"
              style={{ background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)' }}
            >
              Enviar nota
            </button>
          </>
        )}
      </div>

      <style>{`
        .rate-card-in {
          animation: rateCardIn 0.5s ease-out;
        }
        @keyframes rateCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .score-pop {
          animation: scorePop 0.35s ease-out;
        }
        @keyframes scorePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .sent-in {
          animation: sentIn 0.5s ease-out;
        }
        @keyframes sentIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
