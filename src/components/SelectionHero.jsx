// SelectionHero -- cabecera de la pantalla de seleccion (SessionHub.jsx).
// Cuarta iteracion (rediseño total, se sacan los ecualizadores del hub):
// el pill de "X salas activas" se retira de aca y se traslada a la barra
// de control (busqueda + badge en vivo) en SessionHub.jsx, justo al lado
// de donde el usuario realmente actua -- antes quedaba enterrado como
// cuarto elemento de texto del hero, lejos de la busqueda. El hero baja a
// 3 elementos (kicker/eyebrow + logo + subtitulo), mas limpio. El logo
// sigue siendo la imagen del logo oficial (retroke-logo-oficial-neon.png),
// fusionada con HeroBackdropPhoto detras. Kicker y subtitulo intactos, en
// la misma posicion aprobada anteriormente.
export default function SelectionHero() {
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
        @keyframes rkSheroFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rk-shero-wordmark, .rk-shero-kicker, .rk-shero-subtitle {
            animation: none;
          }
        }
      `}</style>
    </header>
  )
}
