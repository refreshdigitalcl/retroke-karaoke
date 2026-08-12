// Cabecera de Retroke World (puntos 7-8 del prompt maestro). Solo
// presentacion -- los numeros reales (escenarios activos, artistas en
// escena) los trae WorldLive, que se muestra justo debajo.
//
// El eyebrow de texto "RETROKE WORLD" se reemplazo por el logo oficial
// (public/landing/retroke-world-logo.png, mismo archivo que uso el usuario --
// no se regenero ni se recoloreo, solo se inserto como <img>).

export default function WorldHero() {
  return (
    <header className="world-hero">
      <img
        src="/landing/retroke-world-logo.png"
        alt="Retroke World"
        className="world-hero-logo"
      />
      <h1 className="world-hero-title">Donde la comunidad vive el escenario</h1>
      <p className="world-hero-subtitle">
        Rankings, tendencias, desafios y quien esta cantando ahora mismo, en un solo lugar.
      </p>
    </header>
  )
}
