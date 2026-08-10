// Retroke Visual System 2.0 (Fase 2). Evolucion de WorldSection.jsx --
// misma API (eyebrow/title/subtitle/action/size/children) para que
// reemplazarlo en cada pantalla, pagina por pagina en Fase 3, sea un
// cambio mecanico. La diferencia es que aca el tamano/rol SI cambia como
// se ve, no solo cuanto espacio ocupa en el grid (el problema central que
// encontro la auditoria: todas las secciones de World se ven identicas).
//
// size: 'sm' | 'md' | 'lg' -- controla el ancho en el grid, igual que antes.
// variant: 'default' | 'hero' -- 'hero' es para el modulo protagonista de
//   la pantalla (ej. "Ahora en Retroke"), con el mismo tratamiento de glow
//   + gradiente en capas que ya usa DisplayResult.jsx.
// accent: 'magenta' | 'purple' | 'green' | 'yellow' | null -- linea de
//   acento superior, para diferenciar de un vistazo que tipo de contenido
//   es (ej. verde para "en vivo", amarillo para ranking/XP).
export default function RetrokeSection({ eyebrow, title, subtitle, action, size = 'md', variant = 'default', accent = null, className, children }) {
  var sizeClass =
    size === 'lg' ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' :
    size === 'md' ? 'md:col-span-2 lg:col-span-1' :
    ''

  var classes = ['rk-section', sizeClass]
  if (variant === 'hero') classes.push('rk-section-hero')
  if (accent) classes.push('rk-section-accent-' + accent)
  if (className) classes.push(className)

  return (
    <section className={classes.filter(Boolean).join(' ')}>
      <div className="rk-section-head">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="rk-section-eyebrow">{eyebrow}</div>}
          <h3 className="rk-section-title">{title}</h3>
          {subtitle && <p className="rk-section-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="rk-section-body">{children}</div>
    </section>
  )
}
