var STAGE_LIGHT_COLORS = ['#E91E8C', '#8B5CF6', '#F4D03F', '#7ED957', '#E91E8C']
var STAGE_LIGHT_POSITIONS = ['8%', '27%', '50%', '73%', '92%']

function StageLights() {
  var lights = []
  var i = 0
  while (i < STAGE_LIGHT_POSITIONS.length) {
    var color = STAGE_LIGHT_COLORS[i]
    var left = STAGE_LIGHT_POSITIONS[i]
    var delay = i * 0.6 + 's'
    lights.push(
      <div
        key={i}
        className="stage-light-flicker"
        style={{ position: 'absolute', top: 0, left: left, animationDelay: delay }}
      >
        <svg width="30" height="76" viewBox="0 0 30 76">
          <line x1="15" y1="0" x2="15" y2="28" stroke={color} strokeWidth="2" opacity="0.55" />
          <path
            d="M5 28 L25 28 L20 50 L10 50 Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.75"
          />
          <ellipse cx="15" cy="55" rx="11" ry="5" fill={color} opacity="0.18" />
        </svg>
      </div>
    )
    i = i + 1
  }
  return <div className="absolute inset-x-0 top-0 z-0 pointer-events-none">{lights}</div>
}

export default function FloatingDecor() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <StageLights />

      <div className="decor-float" style={{ position: 'absolute', top: '20%', left: '5%' }}>
        <svg width="92" height="92" viewBox="0 0 64 64" style={{ transform: 'rotate(-10deg)', opacity: 0.6 }}>
          <ellipse cx="32" cy="18" rx="13" ry="16" fill="none" stroke="#E91E8C" strokeWidth="3" />
          <line x1="24" y1="12" x2="40" y2="12" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
          <line x1="23" y1="17" x2="41" y2="17" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
          <line x1="23" y1="22" x2="41" y2="22" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
          <line x1="24" y1="27" x2="40" y2="27" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
          <path d="M18 30 a14 14 0 0 0 28 0" fill="none" stroke="#E91E8C" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="44" x2="32" y2="58" stroke="#E91E8C" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="decor-float-slow" style={{ position: 'absolute', bottom: '10%', left: '7%' }}>
        <div className="decor-spin-slow" style={{ opacity: 0.55 }}>
          <svg width="106" height="106" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="27" fill="#0a0a0a" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="32" cy="32" r="19" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.6" />
            <circle cx="32" cy="32" r="12" fill="none" stroke="#8B5CF6" strokeWidth="1" opacity="0.6" />
            <circle cx="32" cy="32" r="5" fill="#8B5CF6" />
            <circle cx="32" cy="32" r="2" fill="#0a0a0a" />
          </svg>
        </div>
      </div>

      <div className="decor-float" style={{ position: 'absolute', top: '16%', right: '5%', animationDelay: '1.2s' }}>
        <div className="decor-spin-slower" style={{ opacity: 0.6 }}>
          <svg width="88" height="88" viewBox="0 0 64 64">
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

      <div className="decor-float-slow" style={{ position: 'absolute', bottom: '9%', right: '6%', animationDelay: '0.8s' }}>
        <svg width="100" height="70" viewBox="0 0 96 64" style={{ opacity: 0.55 }}>
          <rect x="2" y="2" width="92" height="60" rx="8" fill="none" stroke="#7ED957" strokeWidth="3" />
          <rect x="14" y="14" width="68" height="26" rx="4" fill="none" stroke="#7ED957" strokeWidth="2" opacity="0.7" />
          <circle cx="32" cy="27" r="9" fill="none" stroke="#7ED957" strokeWidth="2" />
          <circle cx="64" cy="27" r="9" fill="none" stroke="#7ED957" strokeWidth="2" />
          <circle cx="32" cy="27" r="2.5" fill="#7ED957" />
          <circle cx="64" cy="27" r="2.5" fill="#7ED957" />
          <line x1="20" y1="50" x2="76" y2="50" stroke="#7ED957" strokeWidth="2" opacity="0.6" />
        </svg>
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
        .stage-light-flicker {
          animation: stageFlicker 3.2s ease-in-out infinite;
        }
        @keyframes decorBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes decorSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stageFlicker {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
