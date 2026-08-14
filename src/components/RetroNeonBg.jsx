// Fondo retro-neon compartido: grid sutil + dos manchas de glow en las
// esquinas (magenta arriba-izquierda, violeta abajo-derecha), fijas al
// viewport para que sigan ahi al hacer scroll. Es el mismo tratamiento que
// se uso primero en PricingPage.jsx y despues en World.jsx -- se extrae aca
// como componente para no duplicar el mismo bloque de CSS en cada pantalla
// nueva que lo pida (punto 48 del prompt maestro: no duplicar).
//
// Uso: colocar como PRIMER hijo de un contenedor con position: relative (o
// cualquiera con stacking context propio), y darle al contenido real que va
// encima className="relative z-10" (o similar) para que quede pintado por
// arriba del fondo fijo.
export default function RetroNeonBg() {
  return (
    <div className="rk-neon-bg" aria-hidden="true">
      <div className="rk-neon-bg-grid" />
      <div className="rk-neon-bg-blob-a" />
      <div className="rk-neon-bg-blob-b" />
      <style>{`
        .rk-neon-bg { pointer-events: none; position: fixed; inset: 0; z-index: 0; }
        .rk-neon-bg-grid {
          position: absolute; inset: 0; opacity: 0.06;
          background-image: linear-gradient(rgba(139,92,246,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .rk-neon-bg-blob-a { position: absolute; top: -160px; left: -160px; width: 32rem; height: 32rem; border-radius: 50%; opacity: 0.25; filter: blur(64px); background: #E91E8C; }
        .rk-neon-bg-blob-b { position: absolute; bottom: -160px; right: -160px; width: 32rem; height: 32rem; border-radius: 50%; opacity: 0.25; filter: blur(64px); background: #8B5CF6; }
      `}</style>
    </div>
  )
}
