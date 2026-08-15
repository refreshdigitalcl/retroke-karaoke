// SelectionHero -- cabecera de la pantalla de seleccion (SessionHub.jsx).
// Segunda iteracion del rediseño: se saca el logo (imagen) y el cuadro/
// wrap que envolvia todo esto -- el usuario pidio que el hero flote
// directo sobre el fondo/grid/ecualizadores, sin panel ni logo suelto.
// El wordmark "RETROKE" pasa a ser tipografia (mismo tratamiento de
// gradiente animado que ya se usaba antes en el subtitulo), no una
// imagen -- se convierte en el elemento central por su tamaño, como una
// marquesina, en vez de repetir la marca dos veces (imagen + texto).
//
// activeCount: null mientras useActiveSessions() todavia no responde,
// numero (incluido 0) una vez que ya se conoce cuantas salas hay activas.

export default function SelectionHero(props) {
  var activeCount = props.activeCount

  return (
    <header className="rk-shero">
      <p className="rk-shero-kicker">El karaoke cambió para siempre.</p>

      <h1 className="rk-shero-wordmark">RETROKE</h1>

      <p className="rk-shero-subtitle">
        Selecciona una sala activa para comenzar a vivir la experiencia.
      </p>

      {activeCount !== null && activeCount > 0 && (
        <span className="rk-shero-status">
          <span className="rk-shero-status-dot" aria-hidden="true" />
          {activeCount === 1 ? '1 sala activa ahora' : activeCount + ' salas activas ahora'}
        </span>
      )}

      <style>{`
        .rk-shero {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
        }
        .rk-shero-kicker {
          margin: 0;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--rk-text-faint, rgba(255,255,255,0.45));
          animation: rkSheroFadeIn 0.6s ease 0.05s both;
        }
        .rk-shero-wordmark {
          margin: 16px 0 0;
          line-height: 0.86;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-weight: 800;
          font-size: clamp(3.2rem, 12vw, 7.5rem);
          letter-spacing: -0.01em;
          background: linear-gradient(100deg, #F4D03F 0%, #E91E8C 30%, #8B5CF6 62%, #F4D03F 100%);
          background-size: 260% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          filter: drop-shadow(0 0 34px rgba(139,92,246,0.32));
          animation: rkSheroShift 8s ease-in-out infinite, rkSheroFadeIn 0.6s ease 0.13s both;
        }
        @keyframes rkSheroShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .rk-shero-subtitle {
          margin: 18px 0 0;
          max-width: 440px;
          font-size: clamp(13.5px, 1.6vw, 15.5px);
          color: var(--rk-text-soft, rgba(255,255,255,0.6));
          animation: rkSheroFadeIn 0.6s ease 0.2s both;
        }
        .rk-shero-status {
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--rk-radius-pill, 999px);
          background: rgba(126,217,87,0.08);
          border: 1px solid rgba(126,217,87,0.35);
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--rk-green, #7ED957);
          animation: rkSheroFadeIn 0.6s ease 0.28s both;
        }
        .rk-shero-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rk-green, #7ED957);
          box-shadow: 0 0 8px 1px rgba(126,217,87,0.9);
          animation: rkSheroPulse 1.8s ease-in-out infinite;
        }
        @keyframes rkSheroPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes rkSheroFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rk-shero-wordmark, .rk-shero-kicker, .rk-shero-subtitle, .rk-shero-status, .rk-shero-status-dot {
            animation: none;
          }
        }
      `}</style>
    </header>
  )
}
