// HeroBackdropPhoto -- la foto grupal (4 personas, luz neon) como fondo
// atmosferico DETRAS del titulo del hero (kicker + logo + subtitulo), en
// vez de personajes recortados al costado.
//
// v2: la foto ahora es full-bleed -- estira de punta a punta de la
// pantalla (no solo del ancho de rk-hub-hero-wrap, que tiene max-width
// 980/1280px) usando el truco clasico de "romper" el contenedor con
// left:50% + width:100vw + translateX(-50%), asi calza perfecto en
// cualquier viewport sin dejar franjas del grid a los costados.
//
// v4 (stacking fix): este componente ahora se renderiza como hijo directo
// del contenedor raiz de SessionHub.jsx, YA NO anidado dentro de
// rk-hub-hero-wrap. Motivo: el usuario pidio que el ecualizador quede
// delante de esta foto pero detras del texto del hero -- eso es imposible
// de lograr si la foto y el texto viven dentro del MISMO contenedor con
// z-index propio (rk-hub-hero-wrap), porque un hijo nunca puede pintarse
// por fuera del "paquete" de stacking context de su padre, sin importar
// que z-index interno tenga. Sacando la foto a nivel raiz, los 3 elementos
// quedan como hermanos reales que compiten con z-index propio: esta foto
// (z-index bajo) < RetroEqualizer.jsx (z-index 20, sin tocar, se reusa en
// otras 6 pantallas) < rk-hub-page (z-index alto, contiene el texto del
// hero, la busqueda y la grilla).
//
// Al pasar a ser hijo directo de la raiz (que tiene el padding-top pt-28/
// sm:pt-32 = 112px/128px), el top ya no necesita ser negativo -- top:0
// ahora SI es el borde real de la pantalla. A cambio, como perdio el
// bottom:0 atado a rk-hub-hero-wrap, el alto se fija explicitamente por
// breakpoint calculando padding-top + min-height de rk-hub-hero-wrap en
// cada uno (ver .hero-backdrop).
//
// Fusion con la pagina: sin mix-blend-mode contra el fondo real (la foto
// no tiene canal alfa y ademas el propio .hero-backdrop tiene transform,
// asi que cualquier mix-blend-mode aca quedaria atrapado en su propio
// contexto de apilamiento -- por eso el blend de .hero-backdrop-tint solo
// mezcla contra sus hermanos DENTRO de este componente, que es justamente
// lo que se necesita). La legibilidad del texto se logra con un degrade
// vertical opaco (mismo color que --rk-bg-0) que oscurece la franja
// central, dejando que la foto respire mas arriba y abajo.
export default function HeroBackdropPhoto() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <div className="hero-backdrop-glow glow-a" />
      <div className="hero-backdrop-glow glow-b" />

      <picture>
        <source srcSet="/landing/hero-group.webp" type="image/webp" />
        <img src="/landing/hero-group.png" alt="" className="hero-backdrop-img" />
      </picture>

      <div className="hero-backdrop-fade" />
      <div className="hero-backdrop-tint" />

      <style>{`
        /* Hijo directo de la raiz (ver comentario arriba): top:0 ya es el
           borde real de la pantalla. El alto se fija por breakpoint =
           padding-top de la raiz + min-height de rk-hub-hero-wrap en ese
           mismo breakpoint, para que la foto siga cubriendo justo hasta
           donde termina el hero:
             <640px:  112px (pt-28)     + 420px (hero-wrap) = 532px
             >=640px: 128px (sm:pt-32)  + 420px              = 548px
             >=1024px:128px             + 520px (hero-wrap lg) = 648px
           z-index 15: por encima del grid de fondo (RetroNeonBg, z:0) pero
           por debajo del ecualizador (RetroEqualizer, z:20) -- justo lo que
           pidio el usuario ("el ecualizador delante de la imagen"). */
        .hero-backdrop {
          position: absolute;
          top: 0;
          left: 50%;
          width: 100vw;
          height: 532px;
          transform: translateX(-50%);
          z-index: 15;
          overflow: hidden;
          pointer-events: none;
        }
        @media (min-width: 640px) {
          .hero-backdrop { height: 548px; }
        }
        @media (min-width: 1024px) {
          .hero-backdrop { height: 648px; }
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
          width: 30%;
          height: 44%;
          background: #E91E8C;
        }
        .glow-b {
          bottom: 2%;
          right: 10%;
          width: 28%;
          height: 42%;
          background: #22D3EE;
          animation-delay: -3s;
        }
        @keyframes heroBackdropPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.48; }
        }

        /* Full-bleed: la imagen estira al 100% del ancho de pantalla
           (heredado de .hero-backdrop en 100vw) y cubre el alto disponible
           sin dejar bandas vacias a los costados en ningun breakpoint. */
        .hero-backdrop-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 50% 22%;
          display: block;
          filter: saturate(1.18) contrast(1.06) brightness(0.9);
          opacity: 0.9;
        }

        /* Franja oscura vertical donde vive el texto (kicker/logo/
           subtitulo). Ojo: como .hero-backdrop ahora se extiende ~112-128px
           mas arriba que rk-hub-hero-wrap (ver arriba), el texto ya NO
           queda al 50% de esta caja sino mas abajo, cerca del 58-60% --
           los stops estan recalculados para esa proporcion, dejando bien
           despejada la franja superior (ahi es donde antes quedaba el
           hueco negro, ahora se ve la foto) y una transicion limpia hacia
           el resto de la pagina en la base. */
        .hero-backdrop-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(5,3,10,0.1) 0%,
            rgba(5,3,10,0.02) 14%,
            rgba(5,3,10,0.18) 30%,
            rgba(5,3,10,0.58) 44%,
            rgba(5,3,10,0.85) 58%,
            rgba(5,3,10,0.85) 68%,
            rgba(5,3,10,0.55) 80%,
            rgba(5,3,10,0.16) 92%,
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

        /* La relacion ancho/alto disponible cambia mucho entre breakpoints
           (celular angosto y bajo vs. desktop ancho y mas alto) -- se
           reajusta el encuadre vertical y la opacidad en cada tramo para
           que las 4 caras del grupo se sigan viendo bien encuadradas y el
           texto siga legible, sin perder nunca el ancho completo. */
        @media (max-width: 480px) {
          .hero-backdrop-img { object-position: 50% 10%; opacity: 0.68; }
        }
        @media (min-width: 481px) and (max-width: 767px) {
          .hero-backdrop-img { object-position: 50% 15%; opacity: 0.76; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .hero-backdrop-img { object-position: 50% 18%; opacity: 0.84; }
        }
        @media (min-width: 1440px) {
          .hero-backdrop-img { object-position: 50% 26%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-backdrop-glow { animation: none; }
        }
      `}</style>
    </div>
  )
}
