// Bloque bento reutilizable de Retroke World (punto 35 del prompt maestro:
// bento grid + jerarquia, no todos los modulos iguales). Cada seccion de
// World.jsx (y las que vengan despues -- Ranking, Desafios, Escenarios,
// etc.) se envuelve en esto para compartir el mismo look & feel: titulo,
// subtitulo opcional, accion a la derecha (ej "Ver todo ->") y un tamano
// que controla cuanto ocupa en el grid.

export default function WorldSection(props) {
  var size = props.size || 'md' // 'sm' | 'md' | 'lg'
  var sizeClass =
    size === 'lg' ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' :
    size === 'md' ? 'md:col-span-2 lg:col-span-1' :
    ''

  return (
    <section className={'world-section ' + sizeClass + (props.className ? ' ' + props.className : '')}>
      <div className="world-section-head">
        <div style={{ minWidth: 0 }}>
          {props.eyebrow && <div className="world-section-eyebrow">{props.eyebrow}</div>}
          <h3 className="world-section-title">{props.title}</h3>
          {props.subtitle && <p className="world-section-subtitle">{props.subtitle}</p>}
        </div>
        {props.action}
      </div>
      <div className="world-section-body">{props.children}</div>
    </section>
  )
}
