// SelectionHero -- cabecera de la pantalla de seleccion (SessionHub.jsx).
// Tercera iteracion: el wordmark vuelve a ser el logo oficial (imagen
// /landing/retroke-logo-oficial-neon.png) en vez de texto con gradiente --
// el usuario pidio la marca real, al mismo tamaño que ocupaba el texto
// "RETROKE" (mismo clamp de altura que antes usaba font-size), fusionada
// con la foto de fondo (HeroBackdropPhoto, renderizada aparte en
// SessionHub.jsx, detras de este header). El kicker y el subtitulo se
// mantienen sin cambios, en la misma posicion que ya estaba aprobada.
//
// activeCount: null mientras useActiveSessions() todavia no responde,
// numero (incluido 0) una vez que ya se conoce cuantas salas hay activas.

export default function SelectionHero(props) {
  var activeCount = props.activeCount

  return (
    <header className="rk-shero">
      <p className="rk-shero-kicker">El karaoke cambió para siempre.</p>

      <img
        src="/landing/retroke-logo-oficial-neon.png"
        alt="RETROKE"
        className="rk-shero-wordmark"
      />

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
          /* +60% sobre el tamaño anterior (clamp(3.2rem, 12vw, 7.5rem)) */
          height: clamp(5.12rem, 19.2vw, 12rem);
          width: auto;
          display: block;
          filter: drop-shadow(0 0 26px rgba(139,92,246,0.45)) drop-shadow(0 0 50px rgba(233,30,140,0.28));
          animation: rkSheroGlow 4.5s ease-in-out infinite, rkSheroFadeIn 0.6s ease 0.13s both;
        }
        @keyframes rkSheroGlow {
          0%, 100% { filter: drop-shadow(0 0 26px rgba(139,92,246,0.45)) drop-shadow(0 0 50px rgba(233,30,140,0.28)); }
          50% { filter: drop-shadow(0 0 38px rgba(139,92,246,0.65)) drop-shadow(0 0 64px rgba(233,30,140,0.42)); }
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
