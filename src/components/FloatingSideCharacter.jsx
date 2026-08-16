import { useEffect, useRef } from 'react'

// FloatingSideCharacter -- personajes flotantes a los costados de la
// pantalla de seleccion de salas (zonas marcadas por el usuario, junto al
// ecualizador), con parallax real siguiendo el mouse.
//
// A diferencia del primer intento (FloatingHeroFigure con la foto de fondo
// negro solido), estos PNG vienen con transparencia real -- se confirmo
// pixel a pixel que las esquinas son alpha=0. Eso significa que YA NO hace
// falta mix-blend-mode ni preocuparse por contextos de apilamiento: se
// puede animar transform (flotar + inclinar con el mouse) tranquilamente,
// incluso en un wrapper, sin que nada se rompa.
//
// Se posicionan con position:absolute directamente contra el contenedor
// raiz de la pagina (el mismo `min-h-screen relative` del que cuelga
// RetroEqualizer), NO adentro de rk-hub-hero-wrap ni de rk-hub-page --
// asi anclan contra el borde real de la pantalla (junto al ecualizador,
// como en la zona marcada por el usuario) sin empujar ni alterar el ancho
// o alto reservado para el titulo, que sigue viviendo en su propio wrap
// centrado. pointer-events:none en todo el arbol, asi nunca bloquean
// clicks en el buscador o las tarjetas de sala aunque se superpongan
// visualmente.
//
// side: 'left' | 'right' -- de que lado va.
// accentRgb: color del glow de fondo, en formato "r,g,b".

export default function FloatingSideCharacter(props) {
  var side = props.side
  var accentRgb = props.accentRgb
  var webp = props.webp
  var png = props.png

  var figureRef = useRef(null)
  var tiltRef = useRef(null)

  useEffect(function () {
    if (typeof window === 'undefined') return
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return
    var tilt = tiltRef.current
    var figure = figureRef.current
    if (!tilt || !figure) return

    var raf = null

    function onMove(e) {
      var rect = figure.getBoundingClientRect()
      var cx = rect.left + rect.width / 2
      var cy = rect.top + rect.height / 2
      var dx = (e.clientX - cx) / (window.innerWidth / 2)
      var dy = (e.clientY - cy) / (window.innerHeight / 2)
      var clampedDx = Math.max(-1, Math.min(1, dx))
      var clampedDy = Math.max(-1, Math.min(1, dy))

      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(function () {
        tilt.style.transform =
          'rotateY(' + (clampedDx * 10) + 'deg) rotateX(' + (clampedDy * -8) + 'deg) translate(' + (clampedDx * 12) + 'px,' + (clampedDy * 8) + 'px)'

        // Distancia del mouse al centro del personaje (0 = encima, 1+ = lejos)
        // -- controla el glow via una custom property, sin tocar React state
        // (esto corre en cada frame de mousemove, un setState ahi seria
        // carisimo).
        var dist = Math.sqrt(Math.pow(e.clientX - cx, 2) + Math.pow(e.clientY - cy, 2))
        var proximity = Math.max(0, 1 - dist / 420)
        figure.style.setProperty('--proximity', proximity.toFixed(2))
      })
    }

    window.addEventListener('mousemove', onMove)
    return function () {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      className={'hero-side-figure side-' + side}
      ref={figureRef}
      style={{ '--accent-rgb': accentRgb }}
      aria-hidden="true"
    >
      <div className="hero-side-glow" />
      <div className="hero-side-tilt" ref={tiltRef}>
        <div className="hero-side-float">
          <picture>
            <source srcSet={webp} type="image/webp" />
            <img src={png} alt="" className="hero-side-img" />
          </picture>
        </div>
      </div>

      <style>{`
        .hero-side-figure {
          display: none;
          position: absolute;
          top: clamp(88px, 13vh, 136px);
          height: clamp(380px, 54vh, 600px);
          width: clamp(190px, 17vw, 300px);
          pointer-events: none;
          z-index: 0;
          perspective: 1000px;
        }
        /* Arrancan justo despues de las barras del ecualizador
           (w-[70px] + left/right-3 = ~82px desde el borde). */
        .side-left { left: clamp(84px, 7vw, 118px); }
        .side-right { right: clamp(84px, 7vw, 118px); }

        .hero-side-glow {
          position: absolute;
          inset: 6%;
          border-radius: 50%;
          background: rgba(var(--accent-rgb), 0.45);
          filter: blur(50px);
          opacity: calc(0.28 + var(--proximity, 0) * 0.4);
          transition: opacity 0.25s ease;
        }

        .hero-side-tilt {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hero-side-float {
          width: 100%;
          height: 100%;
          animation: heroSideFloat 6.5s ease-in-out infinite;
        }
        .side-right .hero-side-float { animation-delay: -3s; }
        @keyframes heroSideFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }

        .hero-side-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom center;
          display: block;
          filter: drop-shadow(0 18px 30px rgba(0,0,0,0.5)) drop-shadow(0 0 26px rgba(var(--accent-rgb), calc(0.35 + var(--proximity, 0) * 0.35)));
        }

        /* Recien a partir de 1280px hay espacio real a los costados del
           hero (centrado, max-width 980px) sin que el personaje pise el
           titulo -- por debajo de eso se quedan ocultos para no competir
           con el ecualizador ni el texto en pantallas mas angostas. */
        @media (min-width: 1280px) {
          .hero-side-figure { display: block; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-side-float { animation: none; }
          .hero-side-tilt { transition: none; }
        }
      `}</style>
    </div>
  )
}
