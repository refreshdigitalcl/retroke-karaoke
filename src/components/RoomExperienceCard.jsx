import RetrokeIcon from './retroke/RetrokeIcon'

// RoomExperienceCard -- reemplazo de la tarjeta de sala plana que vivia en
// SessionHub.jsx (icono + nombre + flecha en un rectangulo generico). Usa
// el mismo vocabulario visual de RetrokeSection (linea de acento superior,
// superficie de vidrio, glow por color de marca) pero como boton clickeable
// en vez de una seccion de contenido, y con jerarquia real: la sala mas
// activa puede pasar variant="hero" y ocupar mas espacio con mas presencia.
//
// No cambia logica: sigue recibiendo el mismo objeto `session` que ya
// arma useActiveSessions() en SessionHub.jsx (id/name/pin/placeName/kind/
// href) y un onSelect(session) que decide si abre el PinGate o navega
// directo -- eso no se toca aca.

var KIND_MAP = {
  bar: { icon: 'mic', accentRgb: '233,30,140', label: 'Bar' },
  dj: { icon: 'headphones', accentRgb: '244,208,63', label: 'DJ' },
  home: { icon: 'home', accentRgb: '126,217,87', label: 'Home' }
}

export default function RoomExperienceCard(props) {
  var session = props.session
  var index = props.index || 0
  var variant = props.variant || 'default'
  var onSelect = props.onSelect
  // gridSpan: opcional -- deja que SessionHub.jsx marque la primera
  // tarjeta como "destacada" dentro de la grilla (span 2 columnas) cuando
  // hay 3+ salas, para que la lista tenga ritmo bento en vez de filas
  // parejas todas del mismo tamaño. No cambia nada si no se pasa.
  var gridSpan = props.gridSpan

  var kind = KIND_MAP[session.kind] || KIND_MAP.bar
  var isHero = variant === 'hero'

  return (
    <button
      type="button"
      onClick={function () { onSelect(session) }}
      className={'rk-room-card' + (isHero ? ' is-hero' : '')}
      style={{
        animationDelay: (index * 0.07) + 's',
        gridColumn: gridSpan ? 'span ' + gridSpan : undefined,
        '--room-accent': 'rgb(' + kind.accentRgb + ')',
        '--room-accent-14': 'rgba(' + kind.accentRgb + ',0.14)',
        '--room-accent-16': 'rgba(' + kind.accentRgb + ',0.16)',
        '--room-accent-45': 'rgba(' + kind.accentRgb + ',0.45)',
        '--room-accent-55': 'rgba(' + kind.accentRgb + ',0.55)'
      }}
    >
      <span className="rk-room-card-edge" aria-hidden="true" />

      <span className="rk-room-card-icon">
        <RetrokeIcon name={kind.icon} size={isHero ? 26 : 22} glow />
      </span>

      <span className="rk-room-card-body">
        <span className="rk-room-card-kicker">{kind.label} · En vivo ahora</span>
        <span className="rk-room-card-name">{session.placeName}</span>
        <span className="rk-room-card-session">{session.name}</span>
      </span>

      <span className="rk-room-card-tail">
        {session.pin && (
          <span className="rk-room-card-lock" aria-label="Requiere PIN">
            <RetrokeIcon name="lock" size={14} />
          </span>
        )}
        <span className="rk-room-card-arrow" aria-hidden="true">→</span>
      </span>

      <style>{`
        .rk-room-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          text-align: left;
          padding: 18px 20px;
          border-radius: var(--rk-radius-lg, 22px);
          background: linear-gradient(150deg, rgba(255,255,255,0.05), rgba(10,6,16,0.85) 65%);
          border: 1px solid var(--rk-border, rgba(255,255,255,0.1));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          cursor: pointer;
          animation: rkRoomCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          transition: transform 0.18s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        @keyframes rkRoomCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rk-room-card:hover,
        .rk-room-card:focus-visible {
          transform: translateY(-3px);
          border-color: var(--room-accent-55);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 14px 30px -14px rgba(0,0,0,0.8),
            0 0 24px -8px var(--room-accent);
        }
        .rk-room-card:hover .rk-room-card-edge,
        .rk-room-card:focus-visible .rk-room-card-edge {
          opacity: 1;
        }
        .rk-room-card:hover .rk-room-card-arrow {
          transform: translateX(3px);
        }

        .rk-room-card-edge {
          content: '';
          position: absolute;
          left: 18px;
          right: 18px;
          top: 0;
          height: 2px;
          border-radius: var(--rk-radius-pill, 999px);
          background: linear-gradient(90deg, transparent, var(--room-accent), transparent);
          opacity: 0.55;
          transition: opacity 0.25s ease;
        }

        .rk-room-card-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--room-accent);
          background: var(--room-accent-14);
          border: 1.5px solid var(--room-accent-55);
        }

        .rk-room-card-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
          gap: 2px;
        }
        .rk-room-card-kicker {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--room-accent);
        }
        .rk-room-card-name {
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 16px;
          font-weight: 700;
          color: var(--rk-text, #fff);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rk-room-card-session {
          font-size: 12.5px;
          color: var(--rk-text-soft, rgba(255,255,255,0.55));
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rk-room-card-tail {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .rk-room-card-lock {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          color: var(--rk-yellow, #F4D03F);
          background: rgba(244,208,63,0.12);
          border: 1px solid rgba(244,208,63,0.4);
        }
        .rk-room-card-arrow {
          font-size: 18px;
          color: var(--room-accent);
          transition: transform 0.18s ease;
        }

        .rk-room-card.is-hero {
          padding: 26px 26px;
          background: linear-gradient(150deg, var(--room-accent-16), rgba(10,6,16,0.92) 68%);
          border-color: var(--room-accent-45);
          box-shadow: 0 0 34px -14px var(--room-accent);
        }
        .rk-room-card.is-hero .rk-room-card-icon {
          width: 60px;
          height: 60px;
        }
        .rk-room-card.is-hero .rk-room-card-name {
          font-size: 20px;
          white-space: normal;
        }

        @media (prefers-reduced-motion: reduce) {
          .rk-room-card { animation: none; }
        }
      `}</style>
    </button>
  )
}
