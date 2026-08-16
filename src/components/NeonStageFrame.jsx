// NeonStageFrame -- reemplaza a RetroEqualizer.jsx como decoracion de
// borde en SessionHub.jsx. El usuario pidio sacar los ecualizadores y
// rediseñar la pantalla ("se lo pidio 3 veces": creativo, moderno, retro
// neon) -- las barras verticales competian visualmente con la foto de
// fondo (ver commits anteriores subiendo su z-index para no quedar tapadas)
// y ya no encajaban con la nueva composicion full-bleed.
//
// Concepto: 4 escuadras de neon en las esquinas de la pantalla, como el
// rig de luces de un escenario o el visor de una camara -- encuadran TODA
// la pagina (position:fixed, se queda ahi al hacer scroll) en vez de vivir
// pegadas a un contenedor especifico. Cada esquina respira con su propio
// pulso de glow, en colores distintos de la marca (magenta / violeta / oro
// / verde), desfasados entre si para que se sienta organico, no
// sincronizado. Puramente decorativo (pointer-events:none), costo minimo
// (solo opacity, ver Core Web Vitals / DOM cost).
export default function NeonStageFrame() {
  return (
    <div className="rk-stage-frame" aria-hidden="true">
      <span className="rk-stage-corner corner-tl" />
      <span className="rk-stage-corner corner-tr" />
      <span className="rk-stage-corner corner-bl" />
      <span className="rk-stage-corner corner-br" />

      <style>{`
        .rk-stage-frame {
          position: fixed;
          inset: 0;
          z-index: 25;
          pointer-events: none;
        }
        .rk-stage-corner {
          position: absolute;
          width: 46px;
          height: 46px;
          opacity: 0.65;
          animation: rkStagePulse 5s ease-in-out infinite;
        }
        .corner-tl {
          top: 14px;
          left: 14px;
          border-top: 2px solid var(--rk-magenta, #E91E8C);
          border-left: 2px solid var(--rk-magenta, #E91E8C);
          border-top-left-radius: 10px;
          filter: drop-shadow(0 0 8px rgba(233,30,140,0.65));
        }
        .corner-tr {
          top: 14px;
          right: 14px;
          border-top: 2px solid var(--rk-purple, #8B5CF6);
          border-right: 2px solid var(--rk-purple, #8B5CF6);
          border-top-right-radius: 10px;
          filter: drop-shadow(0 0 8px rgba(139,92,246,0.65));
          animation-delay: -1.3s;
        }
        .corner-bl {
          bottom: 14px;
          left: 14px;
          border-bottom: 2px solid var(--rk-yellow, #F4D03F);
          border-left: 2px solid var(--rk-yellow, #F4D03F);
          border-bottom-left-radius: 10px;
          filter: drop-shadow(0 0 8px rgba(244,208,63,0.6));
          animation-delay: -2.6s;
        }
        .corner-br {
          bottom: 14px;
          right: 14px;
          border-bottom: 2px solid var(--rk-green, #7ED957);
          border-right: 2px solid var(--rk-green, #7ED957);
          border-bottom-right-radius: 10px;
          filter: drop-shadow(0 0 8px rgba(126,217,87,0.6));
          animation-delay: -3.9s;
        }
        @keyframes rkStagePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.85; }
        }

        @media (max-width: 640px) {
          .rk-stage-corner { width: 30px; height: 30px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rk-stage-corner { animation: none; opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
