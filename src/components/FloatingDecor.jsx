export default function FloatingDecor() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="decor-float" style={{ position: 'absolute', top: '18%', left: '6%' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-14deg)', opacity: 0.55 }}>
          <rect x="24" y="6" width="16" height="28" rx="8" fill="none" stroke="#E91E8C" strokeWidth="3" />
          <path d="M16 28 a16 16 0 0 0 32 0" fill="none" stroke="#E91E8C" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="44" x2="32" y2="56" stroke="#E91E8C" strokeWidth="3" strokeLinecap="round" />
          <line x1="22" y1="56" x2="42" y2="56" stroke="#E91E8C" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="decor-float-slow" style={{ position: 'absolute', bottom: '12%', left: '8%' }}>
        <div className="decor-spin-slow" style={{ opacity: 0.5 }}>
          <svg width="76" height="76" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="27" fill="#0a0a0a" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="32" cy="32" r="19" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.6" />
            <circle cx="32" cy="32" r="12" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.6" />
            <circle cx="32" cy="32" r="5" fill="#8B5CF6" />
            <circle cx="32" cy="32" r="2" fill="#0a0a0a" />
          </svg>
        </div>
      </div>

      <div className="decor-float" style={{ position: 'absolute', top: '14%', right: '6%', animationDelay: '1.2s' }}>
        <div className="decor-spin-slower" style={{ opacity: 0.55 }}>
          <svg width="66" height="66" viewBox="0 0 64 64">
            <line x1="32" y1="2" x2="32" y2="8" stroke="#F4D03F" strokeWidth="2" />
            <circle cx="32" cy="32" r="23" fill="none" stroke="#F4D03F" strokeWidth="2" />
            <line x1="9" y1="20" x2="55" y2="20" stroke="#F4D03F" strokeWidth="1" opacity="0.6" />
            <line x1="9" y1="32" x2="55" y2="32" stroke="#F4D03F" strokeWidth="1" opacity="0.6" />
            <line x1="9" y1="44" x2="55" y2="44" stroke="#F4D03F" strokeWidth="1" opacity="0.6" />
            <ellipse cx="32" cy="32" rx="10" ry="23" fill="none" stroke="#F4D03F" strokeWidth="1" opacity="0.6" />
            <ellipse cx="32" cy="32" rx="19" ry="23" fill="none" stroke="#F4D03F" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>
      </div>

      <style>{`
        .decor-float {
          animation: decorBob 5.5s ease-in-out infinite;
        }
        .decor-float-slow {
          animation: decorBob 7.5s ease-in-out infinite;
        }
        .decor-spin-slow {
          animation: decorSpin 9s linear infinite;
        }
        .decor-spin-slower {
          animation: decorSpin 14s linear infinite;
        }
        @keyframes decorBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes decorSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
