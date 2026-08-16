import { useEffect, useRef } from 'react'
import RetrokeIcon from './retroke/RetrokeIcon'

// FloatingHeroFigure -- el cantante con luz neon (foto real, subida por el
// usuario) flotando sobre la pantalla de seleccion de salas, con el mismo
// lenguaje de "elemento flotante + glow al pasar el mouse" que referencio
// el usuario de otros sitios (imagen de referencia "Dive into New World").
//
// La foto tiene fondo negro solido (sin canal alpha). En vez de recortar el
// fondo con color-key (arriesgado: el pelo y la chaqueta tambien tienen
// zonas muy oscuras, se hubieran agujereado), se usa mix-blend-mode:
// "screen" -- el negro puro no aporta nada bajo screen, asi que el fondo de
// la foto se funde solo con el fondo oscuro de la pagina y unicamente
// queda flotando el brillo neon + la piel/ropa iluminada. Cero recorte
// manual, cero halo cuadrado visible.
//
// Interaccion:
//  - Flotacion + inclinacion sutil automatica via CSS (siempre activa,
//    tambien en celular donde no hay mouse).
//  - Parallax real siguiendo el cursor, SOLO si el dispositivo tiene un
//    puntero fino (mouse/trackpad) -- se detecta con matchMedia antes de
//    escuchar mousemove, para no gastar el evento en touch.
//  - Glow de fondo (dos manchas magenta/cian, mismos colores que ya trae
//    la iluminacion de la propia foto) que se intensifica en hover.

export default function FloatingHeroFigure() {
  var wrapRef = useRef(null)
  var tiltRef = useRef(null)

  useEffect(function () {
    if (typeof window === 'undefined') return
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return
    var wrap = wrapRef.current
    var tilt = tiltRef.current
    if (!wrap || !tilt) return

    var raf = null

    function onMove(e) {
      var rect = wrap.getBoundingClientRect()
      var px = (e.clientX - rect.left) / rect.width - 0.5
      var py = (e.clientY - rect.top) / rect.height - 0.5
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(function () {
        tilt.style.transform =
          'rotateY(' + (px * 14) + 'deg) rotateX(' + (py * -14) + 'deg) translate(' + (px * -10) + 'px,' + (py * -10) + 'px)'
      })
    }

    function onLeave() {
      if (raf) cancelAnimationFrame(raf)
      tilt.style.transform = 'rotateY(0deg) rotateX(0deg) translate(0,0)'
    }

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    return function () {
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="hero-figure" ref={wrapRef} aria-hidden="true">
      <div className="hero-figure-glow hero-figure-glow-a" />
      <div className="hero-figure-glow hero-figure-glow-b" />

      <div className="hero-figure-orbit" />

      <span className="hero-figure-spark spark-1"><RetrokeIcon name="star" size={16} glow /></span>
      <span className="hero-figure-spark spark-2"><RetrokeIcon name="music" size={18} glow /></span>
      <span className="hero-figure-spark spark-3"><RetrokeIcon name="fire" size={16} glow /></span>

      <div className="hero-figure-tilt" ref={tiltRef}>
        <div className="hero-figure-float">
          <picture>
            <source srcSet="/landing/hero-singer.webp" type="image/webp" />
            <img src="/landing/hero-singer.png" alt="" className="hero-figure-img" />
          </picture>
        </div>
      </div>

      <style>{`
        .hero-figure {
          position: relative;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          perspective: 900px;
        }
        .hero-figure-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(54px);
          opacity: 0.55;
          transition: opacity 0.4s ease, transform 0.4s ease;
          pointer-events: none;
        }
        .hero-figure-glow-a {
          top: 6%;
          left: 2%;
          width: 62%;
          height: 62%;
          background: #E91E8C;
        }
        .hero-figure-glow-b {
          bottom: 4%;
          right: 0%;
          width: 58%;
          height: 58%;
          background: #22D3EE;
        }
        .hero-figure:hover .hero-figure-glow {
          opacity: 0.8;
          transform: scale(1.08);
        }

        .hero-figure-orbit {
          position: absolute;
          left: 50%;
          bottom: 6%;
          width: 78%;
          height: 22%;
          transform: translateX(-50%);
          border: 1.5px solid rgba(255,255,255,0.28);
          border-radius: 50%;
          box-shadow: 0 0 22px -4px rgba(139,92,246,0.7);
          animation: heroOrbitPulse 4.5s ease-in-out infinite;
        }
        @keyframes heroOrbitPulse {
          0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.9; transform: translateX(-50%) scale(1.04); }
        }

        .hero-figure-tilt {
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.25s ease-out;
          will-change: transform;
        }
        .hero-figure-float {
          width: 100%;
          height: 100%;
          animation: heroFigureFloat 5.5s ease-in-out infinite;
        }
        @keyframes heroFigureFloat {
          0%, 100% { transform: translateY(0) rotate(-1.2deg); }
          50% { transform: translateY(-14px) rotate(1.2deg); }
        }
        .hero-figure-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          mix-blend-mode: screen;
          filter: drop-shadow(0 14px 30px rgba(0,0,0,0.55));
        }

        .hero-figure-spark {
          position: absolute;
          color: #F4D03F;
          animation: heroSparkFloat 3.6s ease-in-out infinite;
          pointer-events: none;
        }
        .spark-1 { top: 8%; right: 10%; color: #F4D03F; animation-delay: 0s; }
        .spark-2 { top: 46%; left: 2%; color: #22D3EE; animation-delay: -1.2s; }
        .spark-3 { bottom: 14%; right: 4%; color: #E91E8C; animation-delay: -2.2s; }
        @keyframes heroSparkFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.75; }
          50% { transform: translateY(-9px) scale(1.15); opacity: 1; }
        }

        @media (max-width: 1023px) {
          .hero-figure { max-width: 260px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-figure-float, .hero-figure-orbit, .hero-figure-spark { animation: none; }
          .hero-figure-tilt { transition: none; }
        }
      `}</style>
    </div>
  )
}
