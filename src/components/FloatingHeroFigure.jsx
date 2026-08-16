import RetrokeIcon from './retroke/RetrokeIcon'

// FloatingHeroFigure -- el cantante con luz neon (foto real, subida por el
// usuario) flotando DETRAS del texto del hero (logo/titulo), como fondo
// atmosferico -- no al lado, para no correr la posicion del titulo que ya
// estaba bien.
//
// Bug resuelto (v1 mostraba un cuadrado negro): mix-blend-mode solo puede
// "ver" y fundirse con el fondo real de la pagina si NINGUN ancestro entre
// la imagen y ese fondo tiene transform / perspective / opacity<1 / filter
// -- cualquiera de esos crea su propio "contexto de apilamiento" y aisla el
// blend adentro de si mismo, asi que la imagen deja de fundirse con
// RetroNeonBg/el gradiente y el negro solido de la foto se ve como un
// cuadrado negro encima de todo. La v1 tenia un wrapper con
// transform+will-change (para el parallax con el mouse) por encima de la
// imagen -- ese era el wrapper que rompia el blend.
//
// Esta version es deliberadamente mas simple: SIN wrappers con transform.
// El centrado se hace con flexbox (no con transform: translate(-50%,-50%)),
// y la unica animacion (flotar) se anima con las propiedades `translate` /
// `rotate` SEPARADAS (no el shorthand `transform`) directamente sobre la
// propia imagen -- que si puede tener transform/opacity/mix-blend-mode
// sobre si misma sin problema, el riesgo es solo en los ANCESTROS.
export default function FloatingHeroFigure() {
  return (
    <div className="hero-figure-bg" aria-hidden="true">
      <div className="hero-figure-glow hero-figure-glow-a" />
      <div className="hero-figure-glow hero-figure-glow-b" />
      <div className="hero-figure-orbit" />

      <span className="hero-figure-spark spark-1"><RetrokeIcon name="star" size={16} glow /></span>
      <span className="hero-figure-spark spark-2"><RetrokeIcon name="music" size={18} glow /></span>
      <span className="hero-figure-spark spark-3"><RetrokeIcon name="fire" size={16} glow /></span>

      <picture>
        <source srcSet="/landing/hero-singer.webp" type="image/webp" />
        <img src="/landing/hero-singer.png" alt="" className="hero-figure-img" />
      </picture>

      <style>{`
        .hero-figure-bg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
        }
        .hero-figure-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: heroGlowPulse 5s ease-in-out infinite;
        }
        .hero-figure-glow-a {
          top: 8%;
          left: 18%;
          width: 40%;
          height: 40%;
          background: #E91E8C;
        }
        .hero-figure-glow-b {
          bottom: 6%;
          right: 16%;
          width: 38%;
          height: 38%;
          background: #22D3EE;
          animation-delay: -2.5s;
        }
        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.32; }
          50% { opacity: 0.5; }
        }

        .hero-figure-orbit {
          position: absolute;
          width: 46%;
          max-width: 320px;
          aspect-ratio: 3.2 / 1;
          border: 1.5px solid rgba(255,255,255,0.18);
          border-radius: 50%;
          box-shadow: 0 0 20px -6px rgba(139,92,246,0.6);
          animation: heroOrbitPulse 4.5s ease-in-out infinite;
        }
        @keyframes heroOrbitPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.75; }
        }

        .hero-figure-img {
          position: relative;
          width: min(72vw, 480px);
          max-width: 480px;
          height: auto;
          object-fit: contain;
          display: block;
          mix-blend-mode: screen;
          opacity: 0.6;
          animation: heroFigureFloat 6s ease-in-out infinite;
        }
        @keyframes heroFigureFloat {
          0%, 100% { translate: 0 0; rotate: -1deg; }
          50% { translate: 0 -12px; rotate: 1deg; }
        }

        .hero-figure-spark {
          position: absolute;
          pointer-events: none;
          animation: heroSparkFloat 3.6s ease-in-out infinite;
        }
        .spark-1 { top: 12%; right: 20%; color: #F4D03F; animation-delay: 0s; }
        .spark-2 { top: 50%; left: 8%; color: #22D3EE; animation-delay: -1.2s; }
        .spark-3 { bottom: 16%; right: 10%; color: #E91E8C; animation-delay: -2.2s; }
        @keyframes heroSparkFloat {
          0%, 100% { translate: 0 0; opacity: 0.65; }
          50% { translate: 0 -8px; opacity: 1; }
        }

        @media (max-width: 640px) {
          .hero-figure-img { width: min(78vw, 340px); opacity: 0.5; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-figure-img, .hero-figure-glow, .hero-figure-orbit, .hero-figure-spark {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
