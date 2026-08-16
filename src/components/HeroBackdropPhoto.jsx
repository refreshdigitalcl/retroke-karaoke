// HeroBackdropPhoto -- la foto grupal (4 personas, luz neon) como fondo
// atmosferico DETRAS del titulo del hero (kicker + logo + subtitulo), en
// vez de personajes recortados al costado. Reemplaza el intento anterior
// de dos figuras con parallax: el usuario pidio simplificar a una sola
// imagen de fondo, bien fusionada con la pagina.
//
// Tecnica de fusion (para que no se vea como un rectangulo pegado encima
// del grid): un unico elemento hace de mascara CSS (mask-image, no
// mix-blend-mode -- esta foto no tiene canal alfa, asi que la transparencia
// hacia los bordes se logra recortando con un gradiente radial en vez de
// depender del alfa del PNG) que desvanece la imagen hacia los 4 bordes,
// mas un degrade vertical opaco (mismo color que --rk-bg-gradient) que
// oscurece la franja central donde va el texto, para que el kicker/logo/
// subtitulo mantengan contraste y legibilidad sin perder la foto en los
// extremos superior e inferior.
export default function HeroBackdropPhoto() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <div className="hero-backdrop-glow glow-a" />
      <div className="hero-backdrop-glow glow-b" />

      <div className="hero-backdrop-mask">
        <picture>
          <source srcSet="/landing/hero-group.webp" type="image/webp" />
          <img src="/landing/hero-group.png" alt="" className="hero-backdrop-img" />
        </picture>
      </div>

      <div className="hero-backdrop-fade" />
      <div className="hero-backdrop-tint" />

      <style>{`
        .hero-backdrop {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-backdrop-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.4;
          animation: heroBackdropPulse 6s ease-in-out infinite;
        }
        .glow-a {
          top: 4%;
          left: 12%;
          width: 44%;
          height: 44%;
          background: #E91E8C;
        }
        .glow-b {
          bottom: 2%;
          right: 10%;
          width: 42%;
          height: 42%;
          background: #22D3EE;
          animation-delay: -3s;
        }
        @keyframes heroBackdropPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.48; }
        }

        .hero-backdrop-mask {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          -webkit-mask-image: radial-gradient(ellipse 62% 88% at 50% 42%, #000 45%, transparent 92%);
          mask-image: radial-gradient(ellipse 62% 88% at 50% 42%, #000 45%, transparent 92%);
        }
        .hero-backdrop-img {
          width: min(120%, 1180px);
          max-width: none;
          height: 100%;
          object-fit: cover;
          object-position: 50% 18%;
          display: block;
          filter: saturate(1.18) contrast(1.06) brightness(0.9);
          opacity: 0.88;
        }

        /* Franja oscura vertical donde vive el texto (kicker/logo/
           subtitulo), dejando que la foto respire mas arriba y abajo. */
        .hero-backdrop-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            var(--rk-bg-0, #05030a) 0%,
            rgba(5,3,10,0.35) 14%,
            rgba(5,3,10,0.72) 34%,
            rgba(5,3,10,0.86) 50%,
            rgba(5,3,10,0.7) 66%,
            rgba(5,3,10,0.3) 84%,
            var(--rk-bg-0, #05030a) 100%
          );
        }

        /* Tinte de marca para que los tonos de la foto queden coherentes
           con el resto del sistema visual (magenta/violeta), en vez de
           competir como una foto "pegada" con su propia iluminacion. */
        .hero-backdrop-tint {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 30%, rgba(139,92,246,0.22) 0%, transparent 70%),
            linear-gradient(180deg, rgba(233,30,140,0.1), transparent 40%, rgba(34,211,238,0.08));
          mix-blend-mode: screen;
        }

        @media (max-width: 640px) {
          .hero-backdrop-img { object-position: 50% 14%; opacity: 0.75; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-backdrop-glow { animation: none; }
        }
      `}</style>
    </div>
  )
}
