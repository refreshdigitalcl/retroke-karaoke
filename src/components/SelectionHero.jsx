import { useEffect, useRef } from 'react'

// SelectionHero -- cabecera de la pantalla de seleccion (SessionHub.jsx).
// Quinta iteracion:
// - Orden invertido: el logo va primero, el texto "El karaoke cambio para
//   siempre." queda pegado justo debajo (antes iba arriba, suelto). El
//   usuario no queria colores en ese texto (se habia probado un gradiente
//   animado y no gusto) -- vuelve a ser blanco simple, pero ahora con un
//   efecto parallax real: se mueve mas lento que el scroll de la pagina
//   (ver useKickerParallax), asi se siente con profundidad en vez de
//   plano, sin depender de color para llamar la atencion.
// - El pill de "X salas activas" YA NO vive aca -- se saco del hero por
//   pedido del usuario y ahora se dibuja junto a la barra de busqueda en
//   SessionHub.jsx (mas cerca de donde realmente importa: justo antes de
//   la accion de buscar). Por eso este componente ya no recibe activeCount.
// - El subtitulo se mantiene, ahora como cierre del bloque de texto antes
//   de la barra de busqueda (que pasa a ser el elemento principal debajo).

function useKickerParallax(ref) {
  useEffect(function () {
    if (typeof window === 'undefined') return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    var el = ref.current
    if (!el) return

    var ticking = false

    function apply() {
      ticking = false
      // Factor bajo (0.18) y tope de 26px -- se nota el "despegue" del
      // texto respecto del logo (que no se mueve) al hacer scroll, sin
      // que se vaya lejos ni rompa la lectura.
      var offset = Math.min(26, window.scrollY * 0.18)
      el.style.transform = 'translateY(' + (-offset) + 'px)'
      el.style.opacity = String(Math.max(0, 1 - window.scrollY / 220))
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return function () {
      window.removeEventListener('scroll', onScroll)
    }
  }, [ref])
}

export default function SelectionHero() {
  var kickerRef = useRef(null)
  useKickerParallax(kickerRef)

  return (
    <header className="rk-shero">
      <img
        src="/landing/retroke-logo-oficial-neon.png"
        alt="RETROKE"
        className="rk-shero-wordmark"
      />

      <p className="rk-shero-kicker" ref={kickerRef}>El karaoke cambió para siempre.</p>

      <p className="rk-shero-subtitle">
        Selecciona una sala activa para comenzar a vivir la experiencia.
      </p>

      <style>{`
        .rk-shero {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
        }
        .rk-shero-wordmark {
          margin: 0;
          /* +25% sobre el tamaño anterior (clamp(5.12rem, 19.2vw, 12rem),
             que a su vez ya era un +60% del original) */
          height: clamp(6.4rem, 24vw, 15rem);
          width: auto;
          display: block;
          filter: drop-shadow(0 0 26px rgba(139,92,246,0.45)) drop-shadow(0 0 50px rgba(233,30,140,0.28));
          animation: rkSheroGlow 4.5s ease-in-out infinite, rkSheroFadeIn 0.6s ease 0.13s both;
        }
        /* En celular el logo se sentia chico igual (el piso del clamp
           pesa mas ahi que el techo) -- este breakpoint le da un piso
           propio: +35% sobre el tamaño anterior en vez del +25% general
           de arriba. */
        @media (max-width: 640px) {
          .rk-shero-wordmark { height: clamp(6.91rem, 24vw, 15rem); }
        }
        @keyframes rkSheroGlow {
          0%, 100% { filter: drop-shadow(0 0 26px rgba(139,92,246,0.45)) drop-shadow(0 0 50px rgba(233,30,140,0.28)); }
          50% { filter: drop-shadow(0 0 38px rgba(139,92,246,0.65)) drop-shadow(0 0 64px rgba(233,30,140,0.42)); }
        }
        .rk-shero-kicker {
          /* transform/opacity los controla useKickerParallax por JS (scroll)
             -- a proposito SIN animation acá, para que la animacion de
             entrada no le pise el valor calculado en cada frame (una
             animation con fill-mode:both gana por sobre un inline style
             mientras esta "sostenida", asi que el parallax nunca se veria
             si esto tuviera su propio keyframe de fade-in). */
          margin: 10px 0 0;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 1px 12px rgba(0,0,0,0.55);
          will-change: transform, opacity;
        }
        .rk-shero-subtitle {
          margin: 18px 0 0;
          max-width: 440px;
          font-size: clamp(13.5px, 1.6vw, 15.5px);
          color: var(--rk-text-soft, rgba(255,255,255,0.6));
          animation: rkSheroFadeIn 0.6s ease 0.2s both;
        }
        @keyframes rkSheroFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rk-shero-wordmark, .rk-shero-subtitle {
            animation: none;
          }
        }
      `}</style>
    </header>
  )
}
