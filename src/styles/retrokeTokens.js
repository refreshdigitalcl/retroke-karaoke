// Retroke Visual System 2.0 (Fase 2, ver retroke-visual-system-2.0-auditoria.md).
// Espejo en JS de las variables CSS --rk-* definidas en index.css -- para
// los pocos casos donde un valor literal es necesario en JS (elegir un
// color segun la posicion del podio, props de un <svg>, etc.) en vez de
// repetir el mismo hex suelto en cada archivo nuevo, que fue exactamente
// el problema de consistencia que encontro la auditoria (tres negros de
// fondo ligeramente distintos, tamanos de fuente sueltos por archivo).
// Los componentes que solo necesitan CSS deberian usar var(--rk-*)
// directamente en vez de importar esto.

export const RETROKE_COLORS = {
  magenta: '#E91E8C',
  purple: '#8B5CF6',
  green: '#7ED957',
  yellow: '#F4D03F'
}

export const RETROKE_BG = {
  0: '#05030a',
  1: '#0a0512',
  2: '#1a0b2e',
  gradient: 'radial-gradient(circle at 50% 0%, #1a0b2e 0%, #0a0512 55%, #05030a 100%)'
}

// Orden fijo para el podio (posicion 1, 2, 3) y para cualquier lugar que
// necesite "el color N-esimo" de la identidad Retroke (ej. RetroEqualizer).
export const RETROKE_ACCENT_ORDER = [RETROKE_COLORS.magenta, RETROKE_COLORS.purple, RETROKE_COLORS.green, RETROKE_COLORS.yellow]

export function retrokeGlow(color, strength) {
  var alpha = strength === 'strong' ? 0.85 : 0.65
  var blur = strength === 'strong' ? 36 : 22
  var spread = strength === 'strong' ? -2 : -4
  var rgb = hexToRgb(color)
  return '0 0 ' + blur + 'px ' + spread + 'px rgba(' + rgb + ', ' + alpha + ')'
}

function hexToRgb(hex) {
  var clean = hex.replace('#', '')
  var r = parseInt(clean.substring(0, 2), 16)
  var g = parseInt(clean.substring(2, 4), 16)
  var b = parseInt(clean.substring(4, 6), 16)
  return r + ', ' + g + ', ' + b
}

export const RETROKE_RADIUS = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 999
}

export const RETROKE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
