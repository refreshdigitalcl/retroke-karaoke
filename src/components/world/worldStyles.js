// Estilos compartidos de Retroke World -- extraidos de World.jsx para que
// las "vistas profundas" (Rankings.jsx, y las que vengan despues: Desafios,
// Escenarios) puedan reusar exactamente el mismo look & feel (bento, retro-
// neon) sin duplicar 150 lineas de CSS en cada pagina (punto 48 del prompt
// maestro: no duplicar). Cada pagina que la usa agrega sus propias clases
// especificas (ej. .rk-tabs en Rankings.jsx) en su propio <style> aparte.

export const WORLD_STYLES = `
  .world-page {
    min-height: 100vh;
    background: radial-gradient(circle at 50% 0%, #1a0b2e 0%, #0a0512 55%, #05030a 100%);
    color: #fff;
    font-family: system-ui, sans-serif;
    padding: 44px 18px 80px;
  }
  .world-inner { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }

  .world-hero { text-align: center; max-width: 640px; margin: 0 auto; }
  .world-hero-eyebrow {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.22em;
    background: linear-gradient(100deg, #fff 10%, #E91E8C 35%, #8B5CF6 60%, #F4D03F 85%, #fff 100%);
    background-size: 240% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: worldShift 7s ease-in-out infinite;
  }
  .world-hero-title {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 700;
    font-size: clamp(24px, 5vw, 36px);
    margin-top: 10px;
    line-height: 1.15;
  }
  .world-hero-subtitle { margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.55); }
  @keyframes worldShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .world-live {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    padding: 18px 20px; border-radius: 20px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    max-width: 640px; margin: 0 auto; width: 100%;
  }
  .world-live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #7ED957;
  }
  .world-live-dot {
    width: 8px; height: 8px; border-radius: 999px; background: #7ED957;
    box-shadow: 0 0 10px 2px rgba(126,217,87,0.8);
    animation: worldPulse 1.6s ease-in-out infinite;
  }
  @keyframes worldPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
  .world-live-stats { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; }
  .world-live-stat { text-align: center; }
  .world-live-stat-value { font-size: 24px; font-weight: 800; color: #F4D03F; }
  .world-live-stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

  .world-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .world-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .world-grid { grid-template-columns: repeat(3, 1fr); } }

  .world-section {
    border-radius: 22px; padding: 20px;
    background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.1);
    display: flex; flex-direction: column; gap: 14px; min-width: 0;
  }
  .world-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .world-section-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); text-transform: uppercase; }
  .world-section-title { font-size: 16px; font-weight: 700; margin-top: 2px; }
  .world-section-subtitle { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
  .world-section-action { font-size: 12px; font-weight: 600; color: #8B5CF6; white-space: nowrap; text-decoration: none; background: none; border: none; cursor: pointer; }
  .world-section-body { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

  .world-empty { text-align: center; padding: 18px 8px; color: rgba(255,255,255,0.45); }
  .world-empty-icon { font-size: 26px; margin-bottom: 6px; }
  .world-empty-text { font-size: 13px; line-height: 1.5; }

  .world-skeleton { display: flex; flex-direction: column; gap: 8px; }
  .world-skeleton-line { height: 12px; border-radius: 999px; background: rgba(255,255,255,0.08); animation: worldSkeletonPulse 1.4s ease-in-out infinite; }
  @keyframes worldSkeletonPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

  .world-nowplaying-link { text-decoration: none; color: inherit; }
  .world-nowplaying-card {
    display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 14px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  }
  .world-nowplaying-art { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .world-nowplaying-art img { width: 100%; height: 100%; object-fit: cover; }
  .world-nowplaying-info { flex: 1; min-width: 0; }
  .world-nowplaying-name { font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-nowplaying-song { font-size: 11.5px; color: rgba(255,255,255,0.55); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-nowplaying-venue { font-size: 10.5px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .world-nowplaying-badge { font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em; color: #7ED957; background: rgba(126,217,87,0.12); border-radius: 999px; padding: 4px 8px; white-space: nowrap; flex-shrink: 0; }

  .world-scenario-row { display: flex; align-items: center; gap: 8px; padding: 8px 4px; text-decoration: none; color: inherit; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .world-scenario-row:last-child { border-bottom: none; }
  .world-scenario-row-link:hover { background: rgba(255,255,255,0.03); border-radius: 10px; }
  .world-scenario-dot { width: 7px; height: 7px; border-radius: 999px; background: #7ED957; flex-shrink: 0; }
  .world-scenario-name { font-size: 13px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-scenario-city { font-size: 11px; color: rgba(255,255,255,0.4); }
  .world-scenario-status { font-size: 9.5px; font-weight: 800; color: #7ED957; letter-spacing: 0.06em; }

  .world-rank-row { display: flex; align-items: center; gap: 10px; }
  .world-rank-medal { width: 22px; font-size: 14px; font-weight: 700; text-align: center; flex-shrink: 0; }
  .world-rank-avatar { font-size: 20px; flex-shrink: 0; }
  .world-rank-info { flex: 1; min-width: 0; }
  .world-rank-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-rank-level { font-size: 11px; color: rgba(255,255,255,0.45); }
  .world-rank-xp { font-size: 13px; font-weight: 700; color: #F4D03F; flex-shrink: 0; }

  .world-trend-row { display: flex; align-items: center; gap: 10px; padding: 5px 2px; }
  .world-trend-art { width: 34px; height: 34px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .world-trend-art img { width: 100%; height: 100%; object-fit: cover; }
  .world-trend-info { flex: 1; min-width: 0; }
  .world-trend-name { font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-trend-artist { font-size: 11px; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .world-trend-count { font-size: 12px; font-weight: 800; color: #F4D03F; flex-shrink: 0; white-space: nowrap; }

  .world-xp-track { width: 100%; height: 8px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden; }
  .world-xp-fill { height: 100%; background: linear-gradient(90deg, #E91E8C, #8B5CF6); }

  .world-cta-btn {
    display: inline-block; text-align: center; font-size: 13px; font-weight: 700; color: #fff;
    padding: 10px 16px; border-radius: 12px;
    background: linear-gradient(90deg, #E91E8C, #8B5CF6); text-decoration: none;
  }

  .world-footer-link { text-align: center; color: rgba(255,255,255,0.45); font-size: 13px; text-decoration: underline; }
`
