// Retroke Visual System 2.0 (Fase 2). Sistema de iconos propio, trazo
// simple de una sola tinta (mismo lenguaje que ya prueban FloatingDecor.jsx
// y RetroEqualizer.jsx: SVG dibujado a mano, sin libreria externa, color
// heredado via currentColor para poder pintarlo y hacerle glow con CSS).
// Reemplaza los emojis de INTERFAZ (medallas, racha, mic, insignia, globo,
// candado, etc.) y tambien las reacciones (fuego/corazon/aplauso/risa/mic),
// segun se definio en la conversacion de Fase 2. Los avatares que elige
// cada cantante (🐸🔥👽 etc.) NO son parte de este sistema -- son contenido
// elegido por el usuario, no iconografia de la interfaz.
//
// Uso: <RetrokeIcon name="fire" size={18} glow />
import { forwardRef } from 'react'

const ICONS = {
  medal: (
    <>
      <circle cx="12" cy="15" r="6" />
      <circle cx="12" cy="15" r="2.6" />
      <path d="M9 10 6 3" />
      <path d="M15 10 18 3" />
    </>
  ),
  fire: <path fill="currentColor" stroke="none" d="M12 2c0 3-4 5.2-4 9.2A4 4 0 0 0 12 21a4 4 0 0 0 4-4.8c0 0-1 1.3-2 1.3-1.7 0-2.2-1.6-1.2-3 .9-1.3 1.6-1.9 1.2-4C13.6 8 12 6 12 2Z" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </>
  ),
  star: <path fill="currentColor" stroke="none" d="M12 2.5 14.6 9l7 .6-5.3 4.5 1.6 6.8L12 17.3 5.9 20.9l1.6-6.8L2.4 9.6l7-.6Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3c2.8 2.8 2.8 15.2 0 18" />
      <path d="M12 3c-2.8 2.8-2.8 15.2 0 18" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  check: <polyline points="5 13 10 18 19 7" />,
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
      <path d="M7 6H4a3 3 0 0 0 3 5" />
      <path d="M17 6h3a3 3 0 0 1-3 5" />
      <line x1="12" y1="13" x2="12" y2="17" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </>
  ),
  music: (
    <>
      <circle cx="7.5" cy="18" r="3" fill="currentColor" stroke="none" />
      <line x1="10.5" y1="18" x2="10.5" y2="4" />
      <path d="M10.5 4 17 6v4l-6.5-2" />
    </>
  ),
  moon: <path fill="currentColor" stroke="none" d="M20 14.8A8.5 8.5 0 1 1 9.2 4a7 7 0 0 0 10.8 10.8Z" />,
  heart: <path fill="currentColor" stroke="none" d="M12 21s-7.2-4.4-9.4-8.9C1.2 8.7 2.4 5.3 5.6 4.5c2.1-.5 4.1.5 6.4 2.7 2.3-2.2 4.3-3.2 6.4-2.7 3.2.8 4.4 4.2 3 7.6C19.2 16.6 12 21 12 21Z" />,
  clap: <path fill="currentColor" stroke="none" d="M12 2 13.4 9 21 10.4 13.4 12 12 21 10.6 12 3 10.4 10.6 9Z" />,
  laugh: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M8 14c.8 2 2.2 3 4 3s3.2-1 4-3" />
    </>
  ),
  home: (
    <>
      <path d="M3 11 12 3l9 8" />
      <path d="M5 11v9h14v-9" />
      <rect x="10" y="15" width="4" height="5" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4" height="7" rx="2" />
      <rect x="17" y="14" width="4" height="7" rx="2" />
    </>
  ),
  pin: (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11Z" />
    </>
  )
}

const RetrokeIcon = forwardRef(function RetrokeIcon({ name, size = 20, glow = false, className, style, ...rest }, ref) {
  var glyph = ICONS[name]
  if (!glyph) return null

  var glowStyle = glow ? { filter: 'drop-shadow(0 0 ' + Math.max(4, Math.round(size * 0.35)) + 'px currentColor)' } : {}

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={'rk-icon' + (className ? ' ' + className : '')}
      style={{ ...glowStyle, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {glyph}
    </svg>
  )
})

export default RetrokeIcon

// Mapa reacciones -> icono. Los VALORES que se guardan en status_reactions
// siguen siendo los mismos emoji de siempre (el check constraint de la
// tabla no cambia) -- esto es solo la capa de presentacion: si el emoji
// guardado es uno de estos 5, se muestra el vector en vez del emoji nativo
// del sistema operativo.
export const REACTION_ICON_MAP = {
  '🔥': 'fire',
  '❤️': 'heart',
  '👏': 'clap',
  '😂': 'laugh',
  '🎤': 'mic'
}
