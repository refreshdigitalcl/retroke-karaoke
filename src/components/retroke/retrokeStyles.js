// Retroke Visual System 2.0 (Fase 2, ver retroke-visual-system-2.0-auditoria.md).
// CSS compartido de los componentes nuevos src/components/retroke/*.jsx --
// mismo patron que worldStyles.js: se inyecta UNA vez por pagina (junto a
// WORLD_STYLES mientras dura la migracion) y los componentes de este
// folder solo usan las clases de aca, sin <style> propio cada uno, para no
// repetir el mismo bloque de CSS si una pagina usa varios componentes
// Retroke a la vez.
//
// Nada de este CSS inventa un color nuevo: toma el vocabulario que ya
// probo funcionar en SessionHub.jsx / DisplayResult.jsx / ShareResultCard.jsx
// (glow animado, gradiente de texto en movimiento, elevacion por z-index) y
// lo deja disponible para cualquier pantalla de World.

export const RETROKE_STYLES = `
  .rk-icon { display: inline-block; vertical-align: -0.15em; flex-shrink: 0; }

  .rk-atmosphere { position: absolute; inset: 0; z-index: var(--rk-z-decor); overflow: hidden; pointer-events: none; }
  .rk-atmosphere-scanlines {
    position: absolute; inset: 0; pointer-events: none; mix-blend-mode: overlay;
    background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px);
  }

  /* Piso de grid + horizonte -- referencia synthwave que aprobaste (solo esta
     parte, sin sol/chrome-text/palmeras). Deliberadamente estatico, sin
     scroll infinito -- "sutil", no arcade. Vive detras de todo el contenido
     (z-index bajo) y se desvanece hacia arriba con una mascara para que
     nunca compita con el texto real. */
  .rk-atmosphere-horizon {
    position: absolute; left: 50%; bottom: 42%; width: 68%; height: 130px;
    transform: translate(-50%, 50%);
    background: radial-gradient(ellipse at 50% 100%, rgba(244,208,63,0.32) 0%, rgba(233,30,140,0.26) 38%, rgba(139,92,246,0.14) 62%, transparent 76%);
    filter: blur(8px);
  }
  /* "Cuarto" de grid -- piso + techo + paredes laterales, cada cara en un
     color de marca distinto, convergiendo hacia el centro (referencia:
     grid-room wireframe). Misma tecnica que el piso de arriba (plano 2D
     sobrepasado + rotateX/rotateY + mascara de desvanecido), solo que ahora
     son 4 caras compartiendo una sola perspectiva en vez de una. Sigue
     siendo estatico y muy sutil (opacidad baja + fade fuerte) para no
     competir con el contenido real. */
  .rk-atmosphere-tunnel {
    position: absolute; inset: 0; overflow: hidden;
    perspective: 320px; perspective-origin: 50% 50%;
  }
  .rk-tunnel-face { position: absolute; background-size: 46px 46px; }
  .rk-tunnel-floor {
    left: -50%; right: -50%; bottom: 0; height: 220%;
    background-image:
      linear-gradient(rgba(126,217,87,0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(126,217,87,0.3) 1px, transparent 1px);
    transform: rotateX(75deg); transform-origin: 50% 0%;
    mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
    -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
  }
  .rk-tunnel-ceiling {
    left: -50%; right: -50%; top: 0; height: 220%;
    background-image:
      linear-gradient(rgba(233,30,140,0.26) 1px, transparent 1px),
      linear-gradient(90deg, rgba(233,30,140,0.26) 1px, transparent 1px);
    transform: rotateX(-75deg); transform-origin: 50% 100%;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
  }
  .rk-tunnel-left {
    top: -50%; bottom: -50%; left: 0; width: 220%;
    background-image:
      linear-gradient(rgba(139,92,246,0.26) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,0.26) 1px, transparent 1px);
    transform: rotateY(75deg); transform-origin: 100% 50%;
    mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
    -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
  }
  .rk-tunnel-right {
    top: -50%; bottom: -50%; right: 0; width: 220%;
    background-image:
      linear-gradient(rgba(244,208,63,0.26) 1px, transparent 1px),
      linear-gradient(90deg, rgba(244,208,63,0.26) 1px, transparent 1px);
    transform: rotateY(-75deg); transform-origin: 0% 50%;
    mask-image: linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
    -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%);
  }

  /* --- RetrokeScore: el numero protagonista (XP, nota, score, posicion) --- */
  .rk-score { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; }
  .rk-score-value {
    font-family: var(--rk-font-display); font-weight: 800; color: var(--rk-text);
    text-shadow: 0 0 18px currentColor;
  }
  .rk-score-value.rk-glow-magenta { color: var(--rk-magenta); }
  .rk-score-value.rk-glow-purple { color: var(--rk-purple); }
  .rk-score-value.rk-glow-green { color: var(--rk-green); }
  .rk-score-value.rk-glow-yellow { color: var(--rk-yellow); }
  .rk-score-value.rk-size-hero { font-size: clamp(52px, 12vw, 88px); }
  .rk-score-value.rk-size-lg { font-size: clamp(32px, 7vw, 44px); }
  .rk-score-value.rk-size-md { font-size: 22px; }
  .rk-score-value.rk-size-sm { font-size: 15px; text-shadow: 0 0 10px currentColor; }
  .rk-score-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--rk-text-faint); margin-top: 4px; }
  @keyframes rkScoreIn {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
  }
  .rk-score-animate .rk-score-value { animation: rkScoreIn var(--rk-duration-slow) var(--rk-ease) both; }

  /* --- RetrokeSection: evolucion de WorldSection, con peso visual real --- */
  .rk-section {
    position: relative; border-radius: var(--rk-radius-lg); padding: var(--rk-space-5);
    background: var(--rk-surface); border: 1px solid var(--rk-border);
    display: flex; flex-direction: column; gap: var(--rk-space-3); min-width: 0;
    animation: rkSectionIn var(--rk-duration-slow) var(--rk-ease) both;
  }
  @keyframes rkSectionIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .rk-section-hero {
    background: linear-gradient(160deg, rgba(139,92,246,0.14), rgba(10,8,20,0.92) 65%);
    border: 1px solid var(--rk-border-strong);
    box-shadow: var(--rk-glow-purple);
  }
  .rk-section-accent-magenta { border-color: rgba(233,30,140,0.35); }
  .rk-section-accent-magenta::before,
  .rk-section-accent-purple::before,
  .rk-section-accent-green::before,
  .rk-section-accent-yellow::before {
    content: ''; position: absolute; left: var(--rk-space-5); right: var(--rk-space-5); top: 0;
    height: 2px; border-radius: var(--rk-radius-pill); transform: translateY(-1px);
  }
  .rk-section-accent-magenta::before { background: linear-gradient(90deg, transparent, var(--rk-magenta), transparent); }
  .rk-section-accent-purple::before { background: linear-gradient(90deg, transparent, var(--rk-purple), transparent); }
  .rk-section-accent-green::before { background: linear-gradient(90deg, transparent, var(--rk-green), transparent); }
  .rk-section-accent-yellow::before { background: linear-gradient(90deg, transparent, var(--rk-yellow), transparent); }
  .rk-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--rk-space-2); }
  .rk-section-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; color: var(--rk-text-faint); text-transform: uppercase; }
  .rk-section-title { font-family: var(--rk-font-display); font-size: 16px; font-weight: 700; margin-top: 2px; color: var(--rk-text); }
  .rk-section-hero .rk-section-title { font-size: clamp(18px, 3.4vw, 22px); }
  .rk-section-subtitle { font-size: 12px; color: var(--rk-text-soft); margin-top: 2px; }
  .rk-section-action { font-size: 12px; font-weight: 600; color: var(--rk-purple); white-space: nowrap; text-decoration: none; background: none; border: none; cursor: pointer; }
  .rk-section-body { display: flex; flex-direction: column; gap: var(--rk-space-2); min-width: 0; }

  /* --- RetrokePodium: Top 3 con composicion real, no fila plana --- */
  .rk-podium { display: flex; align-items: flex-end; justify-content: center; gap: var(--rk-space-3); padding-top: var(--rk-space-4); }
  .rk-podium-slot { display: flex; flex-direction: column; align-items: center; gap: var(--rk-space-2); width: 92px; animation: rkPodiumIn var(--rk-duration-slow) var(--rk-ease) both; }
  .rk-podium-slot:nth-child(1) { animation-delay: 0.05s; }
  .rk-podium-slot:nth-child(2) { animation-delay: 0.15s; }
  .rk-podium-slot:nth-child(3) { animation-delay: 0.25s; }
  @keyframes rkPodiumIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .rk-podium-avatar {
    width: 52px; height: 52px; border-radius: var(--rk-radius-pill); display: flex; align-items: center; justify-content: center;
    font-size: 24px; background: rgba(255,255,255,0.06); border: 2px solid var(--rk-border-strong);
  }
  .rk-podium-slot-1 .rk-podium-avatar { width: 64px; height: 64px; font-size: 30px; border-color: var(--rk-yellow); box-shadow: var(--rk-glow-yellow); }
  .rk-podium-slot-2 .rk-podium-avatar { border-color: rgba(255,255,255,0.5); box-shadow: 0 0 20px -6px rgba(255,255,255,0.5); }
  .rk-podium-slot-3 .rk-podium-avatar { border-color: var(--rk-magenta); box-shadow: var(--rk-glow-magenta); }
  .rk-podium-name { font-size: 12.5px; font-weight: 700; color: var(--rk-text); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rk-podium-score { font-family: var(--rk-font-display); font-weight: 800; font-size: 13px; }
  .rk-podium-base { width: 100%; border-radius: var(--rk-radius-sm) var(--rk-radius-sm) 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 6px; font-weight: 800; font-family: var(--rk-font-display); }
  .rk-podium-slot-1 .rk-podium-base { height: 64px; background: linear-gradient(180deg, rgba(244,208,63,0.28), rgba(244,208,63,0.05)); color: var(--rk-yellow); }
  .rk-podium-slot-2 .rk-podium-base { height: 44px; background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03)); color: rgba(255,255,255,0.85); }
  .rk-podium-slot-3 .rk-podium-base { height: 30px; background: linear-gradient(180deg, rgba(233,30,140,0.24), rgba(233,30,140,0.05)); color: var(--rk-magenta); }

  /* --- RetrokeEmptyState --- */
  .rk-empty { text-align: center; padding: var(--rk-space-5) var(--rk-space-2); color: var(--rk-text-faint); }
  .rk-empty-icon { font-size: 28px; margin-bottom: var(--rk-space-2); filter: drop-shadow(0 0 12px rgba(139,92,246,0.5)); }
  .rk-empty-text { font-size: 13px; line-height: 1.5; color: var(--rk-text-soft); }
  .rk-empty-action { margin-top: var(--rk-space-3); }

  /* --- RetrokeSkeleton --- */
  .rk-skeleton { display: flex; flex-direction: column; gap: var(--rk-space-2); }
  .rk-skeleton-line {
    height: 12px; border-radius: var(--rk-radius-pill);
    background: linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%);
    background-size: 200% 100%;
    animation: rkSkeletonSweep 1.6s ease-in-out infinite;
  }
  @keyframes rkSkeletonSweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @media (prefers-reduced-motion: reduce) {
    .rk-section, .rk-podium-slot, .rk-score-animate .rk-score-value, .rk-skeleton-line { animation: none !important; }
  }
`
