// Cabecera de Retroke World (puntos 7-8 del prompt maestro). Solo
// presentacion -- los numeros reales (escenarios activos, artistas en
// escena) los trae WorldLive, que se muestra justo debajo.

export default function WorldHero() {
  return (
    <header className="world-hero">
      <div className="world-hero-eyebrow">RETROKE WORLD</div>
      <h1 className="world-hero-title">Donde la comunidad vive el escenario</h1>
      <p className="world-hero-subtitle">
        Rankings, tendencias, desafios y quien esta cantando ahora mismo, en un solo lugar.
      </p>
    </header>
  )
}
