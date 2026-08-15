// SelectionHero -- cabecera de la pantalla de seleccion (SessionHub.jsx),
// mismo patron que WorldHero.jsx (logo + titulo + subtitulo, presentacion
// pura, sin logica). Reemplaza el bloque de logo + "hub-subtitle" +
// texto de ayuda que antes vivia inline en SessionHub, y agrega la franja
// de estado en vivo (activeCount) que antes era solo texto plano
// "Buscando salas activas...".
//
// activeCount: null mientras useActiveSessions() todavia no responde,
// numero (incluido 0) una vez que ya se conoce cuantas salas hay activas.
// No inventa el dato -- lo recibe tal cual de SessionHub.

export default function SelectionHero(props) {
  var activeCount = props.activeCount

  return (
    <header className="rk-shero">
      <img
        src="/landing/retroke-logo-oficial-neon.png"
        alt="Retroke"
        className="rk-shero-logo"
      />

      <p className="rk-shero-kicker">Selecciona tu escenario</p>

      <h1 className="rk-shero-title">Elige tu escenario</h1>

      <p className="rk-shero-subtitle">
        Toca una sala activa para entrar a su experiencia en vivo.
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
          gap: 6px;
          margin-bottom: 34px;
        }
        .rk-shero-logo {
          width: auto;
          height: clamp(104px, 17vh, 190px);
          margin-bottom: 6px;
          animation: rkSheroLogoIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          filter: drop-shadow(0 0 26px rgba(139,92,246,0.35));
        }
        @keyframes rkSheroLogoIn {
          from { opacity: 0; transform: scale(0.92) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .rk-shero-kicker {
          margin: 0;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--rk-text-faint, rgba(255,255,255,0.45));
          animation: rkSheroFadeIn 0.6s ease 0.1s both;
        }
        .rk-shero-title {
          margin: 4px 0 0;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-weight: 700;
          font-size: clamp(1.6rem, 4.4vw, 2.6rem);
          line-height: 1.15;
          letter-spacing: 0.2px;
          background: linear-gradient(100deg, #fff 12%, #E91E8C 32%, #8B5CF6 55%, #F4D03F 76%, #fff 96%);
          background-size: 260% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: rkSheroShift 8s ease-in-out infinite, rkSheroFadeIn 0.6s ease 0.18s both;
          filter: drop-shadow(0 2px 16px rgba(0,0,0,0.55));
        }
        @keyframes rkSheroShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .rk-shero-subtitle {
          margin: 10px 0 0;
          max-width: 420px;
          font-size: clamp(13.5px, 1.6vw, 15.5px);
          color: var(--rk-text-soft, rgba(255,255,255,0.6));
          animation: rkSheroFadeIn 0.6s ease 0.26s both;
        }
        .rk-shero-status {
          margin-top: 18px;
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
          animation: rkSheroFadeIn 0.6s ease 0.34s both;
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
          .rk-shero-logo, .rk-shero-title, .rk-shero-subtitle, .rk-shero-status, .rk-shero-status-dot {
            animation: none;
          }
        }
      `}</style>
    </header>
  )
}
