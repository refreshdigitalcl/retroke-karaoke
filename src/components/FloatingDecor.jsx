var STAGE_LIGHT_COLORS = ['#E91E8C', '#8B5CF6', '#F4D03F', '#7ED957', '#E91E8C']
var STAGE_LIGHT_POSITIONS = ['8%', '27%', '50%', '73%', '92%']
var SMOKE_BLOBS = [
  { left: '4%', size: 220, delay: '0s', duration: '11s' },
  { left: '28%', size: 260, delay: '2.5s', duration: '13s' },
  { left: '55%', size: 230, delay: '1.2s', duration: '12s' },
  { left: '80%', size: 250, delay: '3.4s', duration: '14s' }
]

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

function StageSmoke() {
  var blobs = []
  var i = 0
  while (i < SMOKE_BLOBS.length) {
    var b = SMOKE_BLOBS[i]
    blobs.push(
      <div
        key={i}
        className="smoke-blob"
        style={{
          left: b.left,
          width: b.size,
          height: b.size,
          animationDelay: b.delay,
          animationDuration: b.duration
        }}
      />
    )
    i = i + 1
  }
  return <div className="absolute inset-x-0 bottom-0 h-64 z-0 pointer-events-none overflow-hidden">{blobs}</div>
}

function VintageMic() {
  return (
    <svg width="140" height="296" viewBox="0 0 90 190" style={{ opacity: 0.62 }}>
      <path d="M30 14 C30 4 60 4 60 14 L60 58 C60 68 30 68 30 58 Z" fill="none" stroke="#E91E8C" strokeWidth="2.5" />
      <path d="M25 20 C35 16 55 16 65 20" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M24 27 C35 23 55 23 66 27" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M23 34 C35 30 55 30 67 34" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M23 41 C35 37 55 37 67 41" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M24 48 C35 44 55 44 66 48" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M25 55 C35 51 55 51 65 55" fill="none" stroke="#E91E8C" strokeWidth="1.5" opacity="0.85" />
      <path d="M36 68 L34 80 L56 80 L54 68 Z" fill="none" stroke="#E91E8C" strokeWidth="2.5" />
      <rect x="34" y="80" width="22" height="55" rx="5" fill="none" stroke="#E91E8C" strokeWidth="2.5" />
      <circle cx="45" cy="98" r="3.5" fill="none" stroke="#E91E8C" strokeWidth="2" />
      <line x1="38" y1="115" x2="52" y2="115" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
      <line x1="38" y1="122" x2="52" y2="122" stroke="#E91E8C" strokeWidth="1.5" opacity="0.7" />
      <path
        d="M40 135 C 18 142 16 172 38 180 C 52 185 60 172 54 160 C 50 152 42 152 40 160"
        fill="none"
        stroke="#E91E8C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function FloatingDecor() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <StageLights />
      <StageSmoke />

      <div className="decor-float" style={{ position: 'absolute', top: '10%', left: '4%' }}>
        <VintageMic />
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
        .decor-dance {
          animation: decorDance 6s ease-in-out infinite;
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
        .smoke-blob {
          position: absolute;
          bottom: -60px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.14), rgba(255,255,255,0) 70%);
          filter: blur(18px);
          animation-name: smokeDrift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes decorBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes decorDance {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes decorSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes stageFlicker {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.35; }
        }
        @keyframes smokeDrift {
          0% { transform: translate(0,0) scale(1); opacity: 0.5; }
          50% { transform: translate(26px,-46px) scale(1.15); opacity: 0.75; }
          100% { transform: translate(-18px,-10px) scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
