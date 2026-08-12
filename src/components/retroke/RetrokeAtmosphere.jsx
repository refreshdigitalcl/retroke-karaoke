import FloatingDecor from '../FloatingDecor'
import RetroEqualizer from '../RetroEqualizer'

// Retroke Visual System 2.0 (Fase 2). No inventa decoracion nueva -- envuelve
// FloatingDecor/RetroEqualizer (ya probados en SessionHub.jsx) para que
// cualquier pantalla de World pueda sumar la misma atmosfera de escenario
// (luces, humo, ecualizador) sin duplicar ese codigo. El contenedor padre
// debe tener position: relative para que esto se posicione encima como
// fondo (position: absolute, pointer-events: none, z-index bajo).
//
// variant:
//  'full'       -> luces + humo + iconos flotantes + ecualizador (paginas hero, ej. World)
//  'equalizer'  -> solo las barras, mas sutil (paginas de contenido denso, ej. Rankings)
//  'none'       -> no renderiza nada (para pantallas donde la atmosfera distraeria)
// grid: agrega el "cuarto" de grid en perspectiva (piso + techo + paredes
//   laterales, cada una en un color de marca distinto, convergiendo al
//   centro) mas el horizonte con degrade -- referencia synthwave aprobada
//   (piso) mas la referencia de "grid room" (las 4 caras). Pensado para el
//   hero de World, no para secciones de contenido denso donde competiria
//   con texto real.
export default function RetrokeAtmosphere({ variant = 'full', scanlines = false, grid = false }) {
  if (variant === 'none' && !grid) return null

  return (
    <div className="rk-atmosphere" aria-hidden="true">
      {grid && <div className="rk-atmosphere-horizon" />}
      {grid && (
        <div className="rk-atmosphere-tunnel">
          <div className="rk-tunnel-face rk-tunnel-floor" />
          <div className="rk-tunnel-face rk-tunnel-ceiling" />
          <div className="rk-tunnel-face rk-tunnel-left" />
          <div className="rk-tunnel-face rk-tunnel-right" />
        </div>
      )}
      {variant === 'full' && <FloatingDecor hideVinyl />}
      {(variant === 'full' || variant === 'equalizer') && <RetroEqualizer />}
      {scanlines && <div className="rk-atmosphere-scanlines" />}
    </div>
  )
}
