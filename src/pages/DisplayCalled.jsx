import { useKaraokeSession } from '../contexts/KaraokeSessionContext'
import RetroEqualizer from '../components/RetroEqualizer'
import FloatingDecor from '../components/FloatingDecor'

export default function DisplayCalled() {
  var session = useKaraokeSession()
  var currentSinger = session.currentSinger

  if (!currentSinger) return null

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-8 bg-black">
      <RetroEqualizer />
      <FloatingDecor />

      <p className="relative z-10 text-xl md:text-2xl tracking-widest uppercase text-yellow-400 mb-6 called-pulse">
        Preparate para cantar
      </p>

      <div
        className="relative z-10 w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-pink-600 flex items-center justify-center text-7xl bg-purple-700 mb-8"
        style={{ boxShadow: '0 0 40px 10px rgba(233, 30, 140, 0.5)' }}
      >
        {currentSinger.photo ? (
          <img src={currentSinger.photo} alt={currentSinger.name} className="w-full h-full object-cover" />
        ) : (
          currentSinger.avatar
        )}
      </div>

      <p className="relative z-10 text-4xl md:text-6xl font-extrabold text-white text-center">
        {currentSinger.name}
      </p>
      <p className="relative z-10 text-lg md:text-2xl text-purple-300 mt-3 text-center">
        {currentSinger.song}
      </p>

      <style>{`
        .called-pulse {
          animation: calledPulse 1.4s ease-in-out infinite;
        }
        @keyframes calledPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
