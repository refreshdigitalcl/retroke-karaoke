var CONFETTI = [
  { left: '5%', color: '#E91E8C', size: 10, duration: 6, delay: 0 },
  { left: '12%', color: '#F4D03F', size: 8, duration: 7.5, delay: 1.2 },
  { left: '20%', color: '#7ED957', size: 9, duration: 6.8, delay: 0.4 },
  { left: '30%', color: '#8B5CF6', size: 11, duration: 7, delay: 2 },
  { left: '40%', color: '#E91E8C', size: 8, duration: 6.3, delay: 1.6 },
  { left: '50%', color: '#F4D03F', size: 10, duration: 7.2, delay: 0.8 },
  { left: '60%', color: '#7ED957', size: 9, duration: 6.6, delay: 2.4 },
  { left: '70%', color: '#8B5CF6', size: 10, duration: 7.4, delay: 0.2 },
  { left: '80%', color: '#E91E8C', size: 8, duration: 6.9, delay: 1.8 },
  { left: '90%', color: '#F4D03F', size: 11, duration: 7.1, delay: 1.0 },
  { left: '15%', color: '#7ED957', size: 7, duration: 8, delay: 3.2 },
  { left: '55%', color: '#8B5CF6', size: 8, duration: 7.6, delay: 2.8 },
  { left: '85%', color: '#E91E8C', size: 9, duration: 6.4, delay: 3.6 },
  { left: '35%', color: '#F4D03F', size: 7, duration: 7.8, delay: 0.6 }
]

var NOTES = [
  { left: '8%', symbol: '\u266A', duration: 9, delay: 0.5, color: '#F4D03F' },
  { left: '25%', symbol: '\u266B', duration: 10, delay: 2.2, color: '#E91E8C' },
  { left: '45%', symbol: '\u266A', duration: 8.5, delay: 1.4, color: '#8B5CF6' },
  { left: '65%', symbol: '\u266B', duration: 9.6, delay: 3, color: '#7ED957' },
  { left: '75%', symbol: '\u266A', duration: 8.8, delay: 0.9, color: '#F4D03F' },
  { left: '92%', symbol: '\u266B', duration: 9.2, delay: 2.6, color: '#E91E8C' }
]

export default function FallingParty() {
  var confetti = []
  var i = 0
  while (i < CONFETTI.length) {
    var c = CONFETTI[i]
    confetti.push(
      <div
        key={'c' + i}
        className="confetti-fall"
        style={{
          left: c.left,
          width: c.size,
          height: c.size * 1.6,
          background: c.color,
          animationDuration: c.duration + 's',
          animationDelay: c.delay + 's'
        }}
      />
    )
    i = i + 1
  }

  var notes = []
  var j = 0
  while (j < NOTES.length) {
    var n = NOTES[j]
    notes.push(
      <span
        key={'n' + j}
        className="note-fall"
        style={{
          left: n.left,
          color: n.color,
          animationDuration: n.duration + 's',
          animationDelay: n.delay + 's'
        }}
      >
        {n.symbol}
      </span>
    )
    j = j + 1
  }

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {confetti}
      {notes}
      <style>{`
        .confetti-fall {
          position: absolute;
          top: -5%;
          border-radius: 2px;
          opacity: 0.85;
          animation-name: confettiFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .note-fall {
          position: absolute;
          top: -8%;
          font-size: 30px;
          opacity: 0.75;
          animation-name: noteFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.9; }
          50% { transform: translateY(55vh) translateX(18px) rotate(190deg); }
          92% { opacity: 0.8; }
          100% { transform: translateY(112vh) translateX(-14px) rotate(360deg); opacity: 0; }
        }
        @keyframes noteFall {
          0% { transform: translateY(0) translateX(0) rotate(-8deg); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translateY(55vh) translateX(-16px) rotate(8deg); }
          90% { opacity: 0.7; }
          100% { transform: translateY(112vh) translateX(12px) rotate(-8deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
