import { useEffect, useRef } from 'react'

const COLORS = ['#E91E8C', '#8B5CF6', '#7ED957', '#F4D03F']
const BAR_COUNT = 6

function EqualizerColumn({ side }) {
  const barsRef = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      barsRef.current.forEach((bar) => {
        if (bar) {
          // Antes animaba `height` (propiedad de layout: cada cambio
          // fuerza reflow, no solo repaint/composite). 12 barras
          // reflowing cada 450ms era un costo real, sobre todo en TV
          // boxes/navegadores debiles. transform:scaleY con
          // transform-origin:bottom logra el mismo efecto visual pero
          // el navegador lo resuelve solo en el compositor (GPU), sin
          // tocar layout.
          bar.style.transform = `scaleY(${(15 + Math.random() * 70) / 100})`
        }
      })
    }, 450)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      // z-20: por encima de HeroBackdropPhoto (z-0) y del texto del hero
      // (z-1) en SessionHub.jsx, para que el ecualizador quede siempre
      // visible sobre la foto de fondo en vez de taparlo -- sigue por
      // debajo del navbar flotante (z-index var(--rk-z-sticky), 40).
      className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-3' : 'right-3'} w-[70px] flex items-end gap-[5px] opacity-55 pointer-events-none z-20`}
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="w-2 rounded-sm transition-transform duration-500 ease-in-out"
          style={{
            background: COLORS[i % COLORS.length],
            height: '100%',
            transformOrigin: 'bottom',
            transform: `scaleY(${(20 + Math.random() * 40) / 100})`
          }}
        />
      ))}
    </div>
  )
}

export default function RetroEqualizer() {
  return (
    <>
      <EqualizerColumn side="left" />
      <EqualizerColumn side="right" />
    </>
  )
}
