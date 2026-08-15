import { useEffect, useState } from 'react'
import RetrokeIcon from './retroke/RetrokeIcon'

// RetrokeNavbar -- navegacion global compartida (rediseño maestro, "pantalla
// de seleccion + navegacion global"). Reemplaza el <nav> que antes vivia
// hardcodeado dentro de SessionHub.jsx (tres links de texto plano en una
// barra translucida) por un unico componente reutilizable: una placa
// flotante tipo consola/vidrio, con una marca a la izquierda, indicador de
// pagina activa y un punto de actividad en Retroke World. Pensado para
// poder reemplazar tambien el nav de LandingPage.jsx mas adelante sin
// duplicar CSS, aunque por ahora solo se usa en SessionHub (el resto de la
// app no se toca sin que se pida explicitamente).
//
// props:
//   active: 'inicio' | 'world' | 'precios' | null -- que item marcar como
//     pagina actual. null = ninguno (caso de SessionHub, que no es
//     literalmente ninguna de esas tres rutas).
//   links: permite sobreescribir los items por defecto si otra pantalla
//     necesita distintos accesos, sin duplicar el componente.

var DEFAULT_LINKS = [
  { key: 'inicio', label: 'Inicio', href: '/inicio' },
  { key: 'world', label: 'Retroke World', href: '/world', pulse: true },
  { key: 'precios', label: 'Planes y precios', href: '/precios' }
]

function useScrolled(threshold) {
  var scrolledState = useState(false)
  var scrolled = scrolledState[0]
  var setScrolled = scrolledState[1]

  useEffect(function () {
    function onScroll() {
      setScrolled(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [threshold])

  return scrolled
}

function MenuGlyph(props) {
  var open = props.open
  return (
    <span className={'rk-nav-glyph' + (open ? ' is-open' : '')} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

export default function RetrokeNavbar(props) {
  var active = props.active || null
  var links = props.links || DEFAULT_LINKS

  var scrolled = useScrolled(24)

  var openState = useState(false)
  var open = openState[0]
  var setOpen = openState[1]

  useEffect(function () {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    var prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return function () {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      <nav
        className={'rk-nav-plate' + (scrolled ? ' is-scrolled' : '')}
        aria-label="Navegacion principal de Retroke"
      >
        <a href="/" className="rk-nav-mark" aria-label="Retroke, ir al inicio">
          <img src="/landing/retroke-mic-icon.png" alt="" />
        </a>

        <div className="rk-nav-links">
          {links.map(function (item) {
            var isActive = active === item.key
            return (
              <a
                key={item.key}
                href={item.href}
                className={'rk-nav-link' + (isActive ? ' is-active' : '')}
              >
                <span>{item.label}</span>
                {item.pulse && <span className="rk-nav-pulse-dot" aria-hidden="true" />}
              </a>
            )
          })}
        </div>

        <button
          type="button"
          className="rk-nav-toggle"
          onClick={function () { setOpen(true) }}
          aria-label="Abrir navegacion"
          aria-expanded={open}
        >
          <MenuGlyph open={false} />
        </button>
      </nav>

      {open && (
        <div className="rk-nav-drawer-scrim" onClick={function () { setOpen(false) }}>
          <div
            className="rk-nav-drawer"
            onClick={function (e) { e.stopPropagation() }}
            role="dialog"
            aria-modal="true"
            aria-label="Navegacion"
          >
            <div className="rk-nav-drawer-head">
              <img src="/landing/retroke-mic-icon.png" alt="" className="rk-nav-drawer-mark" />
              <button
                type="button"
                className="rk-nav-drawer-close"
                onClick={function () { setOpen(false) }}
                aria-label="Cerrar navegacion"
              >
                <RetrokeIcon name="plus" size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="rk-nav-drawer-links">
              {links.map(function (item) {
                var isActive = active === item.key
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className={'rk-nav-drawer-link' + (isActive ? ' is-active' : '')}
                  >
                    <span>{item.label}</span>
                    {item.pulse && <span className="rk-nav-pulse-dot" aria-hidden="true" />}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rk-nav-plate {
          position: fixed;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: var(--rk-z-sticky, 40);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px 6px 6px;
          border-radius: var(--rk-radius-pill, 999px);
          background: rgba(10, 6, 15, 0.55);
          border: 1px solid var(--rk-border-strong, rgba(255,255,255,0.18));
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px rgba(139,92,246,0.12),
            0 12px 30px -14px rgba(0,0,0,0.75);
          transition: background 0.35s ease, box-shadow 0.35s ease, padding 0.35s ease, top 0.35s ease;
        }
        .rk-nav-plate::before {
          content: '';
          position: absolute;
          left: 14%;
          right: 14%;
          top: 0;
          height: 1px;
          border-radius: var(--rk-radius-pill, 999px);
          background: linear-gradient(90deg, transparent, rgba(233,30,140,0.65), rgba(139,92,246,0.65), transparent);
          opacity: 0.85;
        }
        .rk-nav-plate.is-scrolled {
          top: 10px;
          padding: 5px 7px 5px 5px;
          background: rgba(8, 4, 13, 0.82);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px rgba(139,92,246,0.22),
            0 14px 34px -12px rgba(0,0,0,0.85);
        }

        .rk-nav-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          flex-shrink: 0;
          background: radial-gradient(circle at 35% 30%, rgba(233,30,140,0.35), rgba(20,10,25,0.9) 70%);
          border: 1px solid rgba(244,208,63,0.5);
          box-shadow: 0 0 12px -2px rgba(233,30,140,0.7);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .rk-nav-mark:hover {
          box-shadow: 0 0 18px -1px rgba(233,30,140,0.9);
          transform: scale(1.05);
        }
        .rk-nav-mark img {
          width: 18px;
          height: 18px;
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(233,30,140,0.8));
        }

        .rk-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 4px;
        }
        .rk-nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: var(--rk-radius-pill, 999px);
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.68);
          text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .rk-nav-link:hover,
        .rk-nav-link:focus-visible {
          color: #fff;
          background: rgba(255,255,255,0.06);
        }
        .rk-nav-link.is-active {
          color: #fff;
        }
        .rk-nav-link.is-active::after {
          content: '';
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 3px;
          height: 2px;
          border-radius: var(--rk-radius-pill, 999px);
          background: linear-gradient(90deg, var(--rk-magenta, #E91E8C), var(--rk-purple, #8B5CF6));
          box-shadow: 0 0 8px 1px rgba(139,92,246,0.8);
        }
        .rk-nav-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--rk-green, #7ED957);
          box-shadow: 0 0 6px 1px rgba(126,217,87,0.9);
          animation: rkNavPulse 1.8s ease-in-out infinite;
        }
        @keyframes rkNavPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.75); }
        }

        .rk-nav-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .rk-nav-glyph {
          display: flex;
          flex-direction: column;
          gap: 3.5px;
        }
        .rk-nav-glyph span {
          display: block;
          width: 15px;
          height: 1.5px;
          border-radius: 1px;
          background: #fff;
        }

        @media (max-width: 767px) {
          .rk-nav-links { display: none; }
          .rk-nav-toggle { display: flex; }
        }

        .rk-nav-drawer-scrim {
          position: fixed;
          inset: 0;
          z-index: var(--rk-z-overlay, 50);
          background: rgba(4, 2, 8, 0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: rkNavScrimIn 0.25s ease-out;
        }
        @keyframes rkNavScrimIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .rk-nav-drawer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 22px 20px calc(28px + env(safe-area-inset-bottom, 0px));
          border-radius: 26px 26px 0 0;
          background: linear-gradient(180deg, rgba(20,10,26,0.98), rgba(8,4,12,0.99));
          border-top: 1px solid rgba(139,92,246,0.35);
          box-shadow: 0 -20px 50px -20px rgba(0,0,0,0.9);
          animation: rkNavDrawerIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes rkNavDrawerIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rk-nav-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .rk-nav-drawer-mark {
          width: 26px;
          height: 26px;
          object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(233,30,140,0.8));
        }
        .rk-nav-drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
        }
        .rk-nav-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rk-nav-drawer-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 14px;
          border-radius: 16px;
          font-family: var(--rk-font-display, 'Space Grotesk', sans-serif);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.82);
          text-decoration: none;
          border: 1px solid transparent;
        }
        .rk-nav-drawer-link.is-active {
          color: #fff;
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.4);
        }

        @media (prefers-reduced-motion: reduce) {
          .rk-nav-pulse-dot { animation: none; }
          .rk-nav-drawer, .rk-nav-drawer-scrim { animation: none; }
        }
      `}</style>
    </>
  )
}
