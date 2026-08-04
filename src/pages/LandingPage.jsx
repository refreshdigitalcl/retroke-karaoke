import { useEffect, useRef, useState } from 'react'

var FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap'

function useGoogleFonts() {
  useEffect(function () {
    if (document.getElementById('retroke-landing-fonts-v2')) return
    var link = document.createElement('link')
    link.id = 'retroke-landing-fonts-v2'
    link.rel = 'stylesheet'
    link.href = FONTS_HREF
    document.head.appendChild(link)
  }, [])
}

function usePrefersReducedMotion() {
  var state = useState(false)
  var reduced = state[0]
  var setReduced = state[1]
  useEffect(function () {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    function onChange() { setReduced(mq.matches) }
    mq.addEventListener('change', onChange)
    return function () { mq.removeEventListener('change', onChange) }
  }, [])
  return reduced
}

function Reveal(props) {
  var ref = useRef(null)
  var visibleState = useState(false)
  var visible = visibleState[0]
  var setVisible = visibleState[1]
  useEffect(function () {
    var el = ref.current
    if (!el) return
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.15 })
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [])
  return <div ref={ref} className={'r-reveal' + (visible ? ' visible' : '')} style={props.delay ? { transitionDelay: props.delay } : undefined}>{props.children}</div>
}

function CountUp(props) {
  var ref = useRef(null)
  var valueState = useState(0)
  var value = valueState[0]
  var setValue = valueState[1]
  useEffect(function () {
    var el = ref.current
    if (!el) return
    var started = false
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !started) {
        started = true
        var target = props.target
        var duration = 1000
        var startTime = null
        function step(ts) {
          if (!startTime) startTime = ts
          var progress = Math.min(1, (ts - startTime) / duration)
          setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
        observer.disconnect()
      }
    }, { threshold: 0.4 })
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [props.target])
  return <span ref={ref}>{value}{props.suffix || ''}</span>
}

var STEPS = [
  { n: '01', title: 'Escanear', desc: 'Cada mesa accede desde su propio teléfono, sin instalar nada.' },
  { n: '02', title: 'Registrar', desc: 'El cantante elige su canción y entra a la cola en segundos.' },
  { n: '03', title: 'Interpretar', desc: 'La pantalla principal guía la presentación en tiempo real.' },
  { n: '04', title: 'Participar', desc: 'El público reacciona y califica desde el mismo dispositivo.' }
]

var MODES = [
  {
    name: 'Bar', accent: '#E8336B', bg: '/landing/bg-bar.jpg',
    desc: 'Para locales que operan karaoke de forma regular y necesitan control sobre múltiples puntos de atención.',
    points: ['Panel de operación en vivo', 'Gestión de múltiples locales', 'Estadísticas por sesión', 'Identidad de marca propia', 'Reacciones del público en vivo', 'Cola de cantantes sin límite']
  },
  {
    name: 'DJ', accent: '#8B5CF6', bg: '/landing/bg-dj.jpg',
    desc: 'Para animadores y operadores que trabajan en distintos eventos y necesitan un sistema que los acompañe.',
    points: ['Configuración portátil', 'Control total del evento', 'Calificación en tiempo real', 'Sin instalación en el local', 'Funciona en cualquier notebook', 'Imagen profesional frente al cliente']
  },
  {
    name: 'Home', accent: '#4F8AE8', bg: '/landing/bg-home.jpg',
    desc: 'Para uso doméstico: convierte cualquier televisor en un escenario, sin equipos adicionales.',
    points: ['Funciona desde el navegador', 'El teléfono es el micrófono', 'Sin límite de invitados', 'Análisis vocal — próximamente', 'Ideal para cumpleaños y juntas', 'Sin costo para comenzar']
  }
]

var TRUST_POINTS = [
  { title: 'Procesamiento local', desc: 'El análisis de la voz ocurre en el propio dispositivo del cantante. El audio nunca se transmite a un servidor.' },
  { title: 'Sin instalaciones', desc: 'Retroke funciona por completo desde el navegador. No requiere descargar ni instalar ninguna aplicación, en ningún dispositivo.' },
  { title: 'Pagos verificados', desc: 'Los cobros se procesan a través de Mercado Pago, con confirmación automática de cada transacción.' }
]

export default function LandingPage() {
  useGoogleFonts()
  var reducedMotion = usePrefersReducedMotion()

  var navScrolledState = useState(false)
  var navScrolled = navScrolledState[0]
  var setNavScrolled = navScrolledState[1]

  var menuOpenState = useState(false)
  var menuOpen = menuOpenState[0]
  var setMenuOpen = menuOpenState[1]

  useEffect(function () {
    function onScroll() { setNavScrolled(window.scrollY > 24) }
    window.addEventListener('scroll', onScroll)
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div className={'r-page' + (reducedMotion ? ' reduced-motion' : '')}>
      <nav className={'r-nav' + (navScrolled ? ' scrolled' : '')}>
        <div className="r-nav-inner">
          <a href="/inicio" className="r-logo-link">
            <img src="/landing/retroke-logo.png" alt="Retroke" className="r-logo-img" />
          </a>
          <div className="r-nav-links">
            <a href="#producto">Producto</a>
            <a href="#modos">Modalidades</a>
            <a href="#confianza">Confianza</a>
            <a href="#planes">Planes</a>
          </div>
          <div className="r-nav-actions">
            <a href="/dj" className="r-link-btn">Iniciar sesión</a>
            <a href="/precios" className="r-btn r-btn-primary small">Comenzar</a>
            <a href="/downloads/retroke.apk" download className="apk-nav-btn" title="Descargar la app de Retroke para Android">
              <img src="/landing/retroke-mic-icon.png" alt="" className="apk-nav-icon" />
              <span className="apk-nav-text">Descargar APK</span>
            </a>
          </div>
          <button className="r-nav-burger" aria-label="Abrir menú" onClick={function () { setMenuOpen(!menuOpen) }}>
            <span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="r-nav-mobile">
            <a href="#producto" onClick={function () { setMenuOpen(false) }}>Producto</a>
            <a href="#modos" onClick={function () { setMenuOpen(false) }}>Modalidades</a>
            <a href="#confianza" onClick={function () { setMenuOpen(false) }}>Confianza</a>
            <a href="#planes" onClick={function () { setMenuOpen(false) }}>Planes</a>
            <a href="/dj" className="r-link-btn">Iniciar sesión</a>
            <a href="/precios" className="r-btn r-btn-primary">Comenzar</a>
            <a href="/downloads/retroke.apk" download className="apk-nav-btn" title="Descargar la app de Retroke para Android">
              <img src="/landing/retroke-mic-icon.png" alt="" className="apk-nav-icon" />
              <span className="apk-nav-text">Descargar APK</span>
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="r-hero">
        <div className="r-hero-field" aria-hidden="true">
          <span className="r-hero-glow g1" />
          <span className="r-hero-glow g2" />
          <span className="r-hero-glow g3" />
          <span className="r-hero-grid" />
          <span className="r-hero-beam b1" />
          <span className="r-hero-beam b2" />
        </div>
        <div className="r-hero-inner">
          <div className="r-hero-logo-frame">
            <span className="r-logo-frame-ring" />
            <span className="r-logo-spark s1" /><span className="r-logo-spark s2" /><span className="r-logo-spark s3" /><span className="r-logo-spark s4" />
            <img src="/landing/retroke-logo.png" alt="Retroke" className="r-hero-logo" />
          </div>
          <p className="r-eyebrow">Plataforma de entretenimiento en vivo</p>
          <h1 className="r-hero-title">
            Todos tienen un lugar en el escenario.
          </h1>
          <p className="r-hero-sub">
            Retroke coordina la cola, el escenario y la audiencia en tiempo real,
            en una sola plataforma que funciona desde cualquier navegador.
          </p>
          <div className="r-hero-ctas">
            <a href="/precios" className="r-btn r-btn-primary large">Comenzar ahora</a>
            <a href="#producto" className="r-btn r-btn-secondary large">Ver cómo funciona</a>
          </div>
          <div className="r-hero-stats">
            <div><strong><CountUp target={3} /></strong><span>Modalidades de uso</span></div>
            <div className="r-stat-divider" />
            <div><strong><CountUp target={100} suffix="%" /></strong><span>Basado en navegador</span></div>
            <div className="r-stat-divider" />
            <div><strong>0</strong><span>Instalaciones requeridas</span></div>
          </div>
          <div className="r-hero-eq" aria-hidden="true">
            {Array.from({ length: 20 }).map(function (_, i) {
              return <span key={i} style={{ animationDelay: (i * 0.08) + 's' }} />
            })}
          </div>
        </div>
      </header>

      {/* PRODUCTO */}
      <section className="r-section r-bg-circuit" id="producto">
        <span className="r-laser r-laser-1" aria-hidden="true" />
        <span className="r-laser r-laser-2" aria-hidden="true" />
        <span className="r-laser r-laser-3" aria-hidden="true" />
        <span className="r-retro-sun" aria-hidden="true" />
        <span className="r-circuit-line l1" aria-hidden="true" />
        <span className="r-circuit-line l2" aria-hidden="true" />
        <span className="r-circuit-dot d1" aria-hidden="true" />
        <span className="r-circuit-dot d2" aria-hidden="true" />
        <Reveal>
          <div className="r-section-inner r-split">
            <div className="r-split-text">
              <p className="r-kicker">Por qué es diferente</p>
              <h2 className="r-h2">Una sola plataforma coordina toda la experiencia.</h2>
              <p className="r-p">
                La mayoría de los sistemas de karaoke resuelven solo la reproducción.
                Retroke coordina, además, quién participa, en qué orden, y cómo
                reacciona el público — todo sincronizado en tiempo real, sin
                intervención manual.
              </p>
            </div>
            <div className="r-split-visual">
              <img src="/landing/premium-friends.jpg" alt="Una cantante interpretando su canción mientras el público reacciona en vivo" loading="lazy" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* COMO FUNCIONA */}
      <section className="r-section r-section-alt r-bg-floor" id="como-funciona">
        <span className="r-floor-topglow" aria-hidden="true" />
        <span className="r-floor-grid" aria-hidden="true" />
        <span className="r-neon-mic" aria-hidden="true">🎤</span>
        <span className="r-neon-vinyl" aria-hidden="true">
          <span className="r-vinyl-ring" />
          <span className="r-vinyl-hole" />
        </span>
        <span className="r-note n1" aria-hidden="true">♪</span>
        <span className="r-note n2" aria-hidden="true">♫</span>
        <span className="r-note n3" aria-hidden="true">♪</span>
        <Reveal>
          <div className="r-section-inner">
            <p className="r-kicker center">Cómo funciona</p>
            <h2 className="r-h2 center">Todo lo que necesita para vivir la experiencia.</h2>
            <div className="r-steps">
              {STEPS.map(function (s, i) {
                var colors = ['#e8336b', '#8b3ce0', '#22c3e6', '#4f8ae8']
                return (
                  <div className="r-step" key={s.n} style={{ '--step-color': colors[i], borderTopColor: colors[i] }}>
                    <span className="r-step-n" style={{ color: colors[i], textShadow: '0 0 16px ' + colors[i] + '88' }}>{s.n}</span>
                    <p className="r-step-title">{s.title}</p>
                    <p className="r-step-desc">{s.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* MODALIDADES */}
      <section className="r-section" id="modos">
        <Reveal>
          <div className="r-section-inner">
            <p className="r-kicker center">Para quién está pensado</p>
            <h2 className="r-h2 center">Tres modalidades, un mismo sistema.</h2>
            <div className="r-modes">
              {MODES.map(function (m) {
                return (
                  <div className="r-mode-card" key={m.name} style={{ '--accent': m.accent }}>
                    <div className="r-mode-header">
                      <img src={m.bg} alt={'Retroke ' + m.name} loading="lazy" />
                      <span className="r-mode-header-fade" />
                      <span className="r-mode-header-scan" />
                    </div>
                    <div className="r-mode-body">
                      <span className="r-mode-dot" />
                      <p className="r-mode-name">{m.name}</p>
                      <p className="r-mode-desc">{m.desc}</p>
                      <ul className="r-mode-points">
                        {m.points.map(function (p) { return <li key={p}>{p}</li> })}
                      </ul>
                      <a href="/precios" className="r-mode-link">Ver planes para {m.name} →</a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* PRUEBA VISUAL / DJ */}
      <section className="r-section r-section-alt r-bg-ambient" style={{ backgroundImage: 'url(/landing/bg-publico.jpg)' }}>
        <span className="r-ambient-fade" aria-hidden="true" />
        <Reveal>
          <div className="r-section-inner r-split reverse">
            <div className="r-split-visual r-visual-emojis">
              <img src="/landing/premium-dj.jpg" alt="Operador controlando una sesión de Retroke en vivo" loading="lazy" />
              <span className="r-float-emoji e1" aria-hidden="true">🔥</span>
              <span className="r-float-emoji e2" aria-hidden="true">🤯</span>
              <span className="r-float-emoji e3" aria-hidden="true">🫠</span>
              <span className="r-float-emoji e4" aria-hidden="true">😍</span>
            </div>
            <div className="r-split-text">
              <p className="r-kicker">El público como protagonista</p>
              <h2 className="r-h2">Cada actuación se convierte en un evento colectivo.</h2>
              <p className="r-p">
                Mientras alguien canta, la audiencia califica y reacciona desde su
                propio teléfono. El resultado queda registrado al instante, y cada
                sesión acumula estadísticas propias — sin que el operador tenga que
                gestionar nada manualmente.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CONFIANZA */}
      <section className="r-section r-bg-network" id="confianza">
        <span className="r-network-glow" aria-hidden="true" />
        <Reveal>
          <div className="r-section-inner">
            <p className="r-kicker center">Por qué confiar en Retroke</p>
            <h2 className="r-h2 center">Construido sobre una arquitectura seria.</h2>
            <div className="r-trust-grid">
              {TRUST_POINTS.map(function (t, i) {
                var colors = ['#e8336b', '#8b3ce0', '#22c3e6']
                return (
                  <div className="r-trust-card" key={t.title} style={{ '--tc-accent': colors[i] }}>
                    <p className="r-trust-title">{t.title}</p>
                    <p className="r-trust-desc">{t.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* PLANES */}
      <section className="r-section r-bg-disco" id="planes">
        <span className="r-disco-beam db1" aria-hidden="true" />
        <span className="r-disco-beam db2" aria-hidden="true" />
        <span className="r-disco-beam db3" aria-hidden="true" />
        <span className="r-disco-dot dd1" aria-hidden="true" />
        <span className="r-disco-dot dd2" aria-hidden="true" />
        <span className="r-disco-dot dd3" aria-hidden="true" />
        <span className="r-disco-dot dd4" aria-hidden="true" />
        <Reveal>
          <div className="r-section-inner center-text">
            <p className="r-kicker center">Planes</p>
            <h2 className="r-h2 center">Una solución para cada forma de vivir Retroke.</h2>
            <p className="r-p center-p">
              Desde reuniones en casa hasta operaciones profesionales en bares y eventos,
              encuentre el plan ideal para cada experiencia.
            </p>
            <a href="/precios" className="r-btn r-btn-primary large">Ver planes y precios</a>
          </div>
        </Reveal>
      </section>

      {/* CTA FINAL */}
      <section className="r-final">
        <span className="r-final-glow g1" aria-hidden="true" />
        <span className="r-final-glow g2" aria-hidden="true" />
        <Reveal>
          <div className="r-section-inner r-final-grid">
            <div className="r-final-text">
              <h2 className="r-final-title">El escenario es solo el comienzo.<br />La experiencia la crean todos.</h2>
              <a href="/precios" className="r-btn r-btn-primary large">Comenzar ahora</a>
            </div>
            <div className="r-final-phone-wrap">
              <div className="r-final-phone">
                <div className="r-phone-notch" />
                <img src="/landing/iphone-registro.jpg" alt="Registro para cantar en Retroke, desde el celular" />
              </div>
              <span className="r-final-phone-glow" aria-hidden="true" />
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="r-footer">
        <div className="r-footer-inner">
          <a href="/inicio" className="r-footer-logo-link">
            <img src="/landing/retroke-logo.png" alt="Retroke" className="r-logo-img footer" />
          </a>
          <nav className="r-footer-links">
            <a href="#producto">Producto</a>
            <a href="#modos">Modalidades</a>
            <a href="#confianza">Confianza</a>
            <a href="#planes">Planes</a>
          </nav>
          <div className="r-footer-actions">
            <a href="/dj" className="r-link-btn">Iniciar sesión</a>
            <a href="/precios" className="r-btn r-btn-primary small">Comenzar</a>
          </div>
        </div>
        <div className="r-footer-divider" />
        <p className="r-footer-copy">© {new Date().getFullYear()} Retroke. Todos los derechos reservados.</p>
      </footer>

      <style>{`
        .r-page { background: #08080b; color: #f2f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; overflow-x: hidden; }
        .r-page * { box-sizing: border-box; }
        .r-reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .r-reveal.visible { opacity: 1; transform: translateY(0); }
        .reduced-motion .r-reveal { opacity: 1; transform: none; transition: none; }
        .reduced-motion * { animation: none !important; }
        .reduced-motion .r-hero-logo { filter: drop-shadow(0 0 40px rgba(232,51,107,0.35)) drop-shadow(0 0 80px rgba(76,63,224,0.25)); }

        /* Nav */
        .r-nav { position: sticky; top: 0; z-index: 50; padding: 20px 6vw; transition: background 0.25s ease, border-color 0.25s ease, padding 0.25s ease; border-bottom: 1px solid transparent; }
        .r-nav.scrolled { background: rgba(8,8,11,0.85); backdrop-filter: blur(14px); border-bottom-color: rgba(255,255,255,0.08); padding: 14px 6vw; }
        .r-nav-inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .r-logo-img { height: 40px; width: auto; display: block; }
        .r-logo-img.small { height: 34px; margin-bottom: 14px; }
        .r-hero-logo-frame { position: relative; width: min(420px, 78vw); margin: 0 auto 32px; padding: 34px 30px; border-radius: 22px; background: radial-gradient(ellipse at 50% 30%, rgba(139,60,224,0.18), rgba(14,14,18,0.6) 70%); border: 1px solid rgba(255,255,255,0.09); backdrop-filter: blur(6px); }
        .r-logo-frame-ring { position: absolute; inset: 0; border-radius: 22px; padding: 1.5px; background: linear-gradient(120deg, #e8336b, #8b3ce0, #22c3e6, #e8336b); background-size: 300% 300%; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: ringChase 6s linear infinite; }
        @keyframes ringChase { to { background-position: 300% 50%; } }
        .r-logo-spark { position: absolute; width: 4px; height: 4px; border-radius: 999px; background: #fff; box-shadow: 0 0 8px 2px currentColor; animation: sparkTwinkle 2.6s ease-in-out infinite; }
        .s1 { top: 14%; left: 10%; color: #ff6fa5; animation-delay: 0s; }
        .s2 { top: 70%; left: 6%; color: #22c3e6; animation-delay: -0.8s; }
        .s3 { top: 20%; right: 8%; color: #8b7bff; animation-delay: -1.6s; }
        .s4 { bottom: 12%; right: 14%; color: #ff6fa5; animation-delay: -2.2s; }
        @keyframes sparkTwinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.4); } }
        .r-hero-logo { position: relative; width: 100%; height: auto; display: block; filter: drop-shadow(0 0 40px rgba(232,51,107,0.45)) drop-shadow(0 0 90px rgba(76,63,224,0.35)); animation: heroLogoGlow 4s ease-in-out infinite; }
        @keyframes heroLogoGlow {
          0%, 100% { filter: drop-shadow(0 0 40px rgba(232,51,107,0.35)) drop-shadow(0 0 80px rgba(76,63,224,0.25)); }
          50% { filter: drop-shadow(0 0 56px rgba(232,51,107,0.5)) drop-shadow(0 0 100px rgba(76,63,224,0.4)); }
        }
        .r-nav-links { display: flex; gap: 32px; font-size: 13.5px; font-weight: 500; color: #a3a3ad; }
        .r-nav-links a { color: inherit; text-decoration: none; transition: color 0.15s ease; }
        .r-nav-links a:hover { color: #fff; }
        .r-nav-actions { display: flex; align-items: center; gap: 22px; }

        .apk-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px 7px 8px;
          border-radius: 999px;
          text-decoration: none;
          background: linear-gradient(160deg, rgba(20,10,30,0.95), rgba(10,6,16,0.95));
          border: 1.5px solid rgba(233,30,140,0.7);
          box-shadow: 0 0 12px 1px rgba(233,30,140,0.5), 0 0 22px 3px rgba(139,92,246,0.3);
          animation: apkNavFloat3d 3.6s ease-in-out infinite;
          transform-style: preserve-3d;
          perspective: 500px;
        }
        .apk-nav-btn:hover {
          animation-play-state: paused;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 0 18px 2px rgba(233,30,140,0.75), 0 0 30px 5px rgba(139,92,246,0.45);
        }
        @keyframes apkNavFloat3d {
          0%, 100% { transform: rotateY(-6deg) rotateX(2deg); }
          50% { transform: rotateY(6deg) rotateX(-2deg); }
        }
        .apk-nav-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(233,30,140,0.9));
          animation: apkIconPulse 2.2s ease-in-out infinite;
        }
        .apk-nav-text {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.4px;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6, #F4D03F);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: apkTextShimmer 3s linear infinite;
          white-space: nowrap;
        }
        @keyframes apkIconPulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(233,30,140,0.9)); }
          50% { filter: drop-shadow(0 0 8px rgba(244,208,63,1)); }
        }
        @keyframes apkTextShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        .r-nav-mobile .apk-nav-btn { align-self: flex-start; }
        .r-link-btn { color: #d4d4dc; text-decoration: none; font-size: 13.5px; font-weight: 500; }
        .r-link-btn:hover { color: #fff; }
        .r-nav-burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
        .r-nav-burger span { width: 18px; height: 1.5px; background: #f2f2f5; }
        .r-nav-mobile { display: flex; flex-direction: column; gap: 16px; padding: 20px 4px 4px; font-size: 14px; font-weight: 500; color: #d4d4dc; }
        .r-nav-mobile a { color: inherit; text-decoration: none; }

        /* Buttons */
        .r-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 22px; transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease; white-space: nowrap; cursor: pointer; font-family: 'Inter', sans-serif; }
        .r-btn.small { padding: 8px 16px; font-size: 13px; }
        .r-btn.large { padding: 14px 28px; font-size: 15px; }
        .r-btn-primary { background: linear-gradient(100deg, #e8336b, #8b3ce0); color: #fff; box-shadow: 0 4px 24px -6px rgba(232,51,107,0.55); }
        .r-btn-primary:hover { background: linear-gradient(100deg, #ff4d81, #a355ff); box-shadow: 0 6px 32px -4px rgba(232,51,107,0.75); transform: translateY(-1px); }
        .r-btn-secondary { background: rgba(232,51,107,0.06); color: #f2f2f5; border: 1px solid rgba(232,51,107,0.35); }
        .r-btn-secondary:hover { border-color: rgba(232,51,107,0.7); background: rgba(232,51,107,0.12); }

        /* Hero */
        .r-hero { position: relative; padding: 120px 6vw 90px; overflow: hidden; }
        .r-hero-field { position: absolute; inset: 0; pointer-events: none; }
        .r-hero-glow { position: absolute; width: 32rem; height: 32rem; border-radius: 999px; filter: blur(110px); opacity: 0.38; animation: heroFloat 12s ease-in-out infinite; }
        .g1 { background: #e8336b; top: -10rem; left: -8rem; }
        .g2 { background: #4c3fe0; top: -4rem; right: -10rem; animation-delay: -4s; }
        .g3 { background: #22c3e6; bottom: -14rem; left: 30%; width: 26rem; height: 26rem; opacity: 0.24; animation-delay: -8s; }
        @keyframes heroFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, 4%) scale(1.08); }
        }
        .r-hero-grid { position: absolute; inset: 0; opacity: 0.045; background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 64px 64px; mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent); animation: gridDrift 30s linear infinite; }
        @keyframes gridDrift { from { background-position: 0 0, 0 0; } to { background-position: 64px 64px, 64px 64px; } }
        .r-hero-beam { position: absolute; top: -10%; width: 2px; height: 55%; background: linear-gradient(180deg, rgba(232,51,107,0.35), transparent); opacity: 0.5; transform-origin: top center; animation: beamSweep 9s ease-in-out infinite; }
        .b1 { left: 38%; animation-delay: 0s; }
        .b2 { left: 60%; background: linear-gradient(180deg, rgba(76,63,224,0.35), transparent); animation-delay: -4.5s; }
        @keyframes beamSweep {
          0%, 100% { transform: rotate(-6deg); opacity: 0.35; }
          50% { transform: rotate(6deg); opacity: 0.6; }
        }
        .r-hero-eq { display: flex; align-items: flex-end; justify-content: center; gap: 4px; height: 30px; margin-top: 52px; opacity: 0.55; }
        .r-hero-eq span { width: 3px; border-radius: 2px; background: linear-gradient(180deg, #e8336b, #4c3fe0); height: 6px; animation: eqBounce 1.2s ease-in-out infinite; }
        @keyframes eqBounce { 0%, 100% { height: 5px; } 50% { height: 26px; } }
        .r-hero-inner { position: relative; z-index: 2; max-width: 740px; margin: 0 auto; text-align: center; }
        .r-eyebrow { font-size: 13px; letter-spacing: 0.5px; color: #8f8f99; margin-bottom: 24px; font-weight: 500; }
        .r-hero-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(2.1rem, 5vw, 3.6rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 24px; background: linear-gradient(100deg, #fff 10%, #ff6fa5 35%, #8b7bff 60%, #22c3e6 80%, #fff 100%); background-size: 250% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: heroTitleShift 8s ease-in-out infinite; }
        @keyframes heroTitleShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .r-hero-sub { font-size: 17px; line-height: 1.65; color: #b0b0b8; max-width: 520px; margin: 0 auto 38px; }
        .r-hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 56px; }
        .r-hero-stats { display: flex; align-items: center; justify-content: center; gap: 30px; }
        .r-hero-stats strong { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; display: block; background: linear-gradient(100deg, #ff6fa5, #8b7bff); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .r-hero-stats span { font-size: 12px; color: #8f8f99; }
        .r-stat-divider { width: 1px; height: 28px; background: linear-gradient(180deg, transparent, rgba(232,51,107,0.5), transparent); }

        /* Sections */
        .r-section { padding: 110px 6vw; position: relative; overflow: hidden; }
        .r-section-alt { background: #0c0c10; }
        .r-section-inner { max-width: 1160px; margin: 0 auto; position: relative; z-index: 2; }
        .center-text { text-align: center; }

        /* Fondo "Por que es diferente": circuito retro sutil */
        .r-bg-circuit { background: radial-gradient(ellipse 70% 60% at 15% 10%, rgba(232,51,107,0.08), transparent 60%); }
        .r-laser { position: absolute; height: 1.5px; width: 60%; opacity: 0.55; filter: blur(0.4px); }
        .r-laser-1 { top: 12%; left: -10%; background: linear-gradient(90deg, transparent, #ff2f78, transparent); transform: rotate(-8deg); box-shadow: 0 0 12px 1px rgba(255,47,120,0.6); animation: laserSweep 7s ease-in-out infinite; }
        .r-laser-2 { top: 55%; right: -10%; width: 50%; background: linear-gradient(90deg, transparent, #22c3e6, transparent); transform: rotate(6deg); box-shadow: 0 0 12px 1px rgba(34,195,230,0.6); animation: laserSweep 9s ease-in-out infinite reverse; animation-delay: -3s; }
        .r-laser-3 { bottom: 10%; left: 10%; width: 40%; background: linear-gradient(90deg, transparent, #8b3ce0, transparent); transform: rotate(-4deg); box-shadow: 0 0 12px 1px rgba(139,60,224,0.6); animation: laserSweep 8s ease-in-out infinite; animation-delay: -5s; }
        @keyframes laserSweep { 0%, 100% { opacity: 0.25; transform: translateY(0) rotate(-8deg); } 50% { opacity: 0.7; transform: translateY(10px) rotate(-4deg); } }
        .r-retro-sun { position: absolute; top: 8%; right: 6%; width: 180px; height: 180px; border-radius: 999px; background: linear-gradient(180deg, #ff6fa5, #8b3ce0 60%, transparent 60%); opacity: 0.14; background-size: 100% 8px; -webkit-mask-image: repeating-linear-gradient(180deg, black 0px, black 3px, transparent 3px, transparent 6px); mask-image: repeating-linear-gradient(180deg, black 0px, black 3px, transparent 3px, transparent 6px); animation: heroFloat 10s ease-in-out infinite; }
        .r-circuit-line { position: absolute; background: linear-gradient(90deg, transparent, rgba(232,51,107,0.35), transparent); height: 1px; opacity: 0.5; }
        .l1 { top: 22%; left: 0; width: 40%; animation: circuitFlow 8s ease-in-out infinite; }
        .l2 { bottom: 18%; right: 0; width: 32%; background: linear-gradient(90deg, transparent, rgba(76,63,224,0.35), transparent); animation: circuitFlow 8s ease-in-out infinite reverse; animation-delay: -3s; }
        @keyframes circuitFlow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.6; } }
        .r-circuit-dot { position: absolute; width: 5px; height: 5px; border-radius: 999px; background: #e8336b; box-shadow: 0 0 10px 2px rgba(232,51,107,0.7); animation: dotPulse 2.4s ease-in-out infinite; }
        .d1 { top: 22%; left: 40%; }
        .d2 { bottom: 18%; right: 32%; background: #4c3fe0; box-shadow: 0 0 10px 2px rgba(76,63,224,0.7); animation-delay: -1.2s; }

        /* Fondo "Como funciona": piso perspectiva synthwave */
        .r-bg-floor { }
        .r-floor-topglow { position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 70%; height: 40%; background: radial-gradient(ellipse, rgba(139,60,224,0.22), transparent 70%); }

        .r-neon-mic { position: absolute; top: 12%; right: 9%; font-size: 64px; opacity: 0.5; filter: drop-shadow(0 0 18px rgba(232,51,107,0.7)) drop-shadow(0 0 34px rgba(232,51,107,0.4)); animation: micSway 6s ease-in-out infinite; transform-origin: top center; }
        @keyframes micSway { 0%, 100% { transform: rotate(-6deg) translateY(0); } 50% { transform: rotate(6deg) translateY(-8px); } }

        .r-neon-vinyl { position: absolute; bottom: 10%; left: 6%; width: 120px; height: 120px; display: block; animation: vinylSpin 12s linear infinite; opacity: 0.4; }
        @keyframes vinylSpin { to { transform: rotate(360deg); } }
        .r-vinyl-ring { position: absolute; inset: 0; border-radius: 999px; border: 2px solid rgba(34,195,230,0.6); box-shadow: 0 0 20px 2px rgba(34,195,230,0.4), inset 0 0 0 14px rgba(255,255,255,0.02), inset 0 0 0 15px rgba(34,195,230,0.25), inset 0 0 0 30px rgba(255,255,255,0.02), inset 0 0 0 31px rgba(34,195,230,0.18); }
        .r-vinyl-hole { position: absolute; top: 50%; left: 50%; width: 12px; height: 12px; border-radius: 999px; background: #22c3e6; transform: translate(-50%, -50%); box-shadow: 0 0 10px 2px rgba(34,195,230,0.8); }

        .r-note { position: absolute; font-family: 'Space Grotesk', sans-serif; opacity: 0.55; animation: noteFloat 5s ease-in-out infinite; }
        .n1 { top: 20%; left: 14%; font-size: 30px; color: #ff6fa5; text-shadow: 0 0 14px rgba(255,111,165,0.7); animation-delay: 0s; }
        .n2 { top: 62%; right: 20%; font-size: 24px; color: #8b7bff; text-shadow: 0 0 14px rgba(139,123,255,0.7); animation-delay: -1.8s; }
        .n3 { bottom: 16%; right: 40%; font-size: 20px; color: #22c3e6; text-shadow: 0 0 14px rgba(34,195,230,0.7); animation-delay: -3.2s; }
        @keyframes noteFloat { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-14px) rotate(6deg); } }
        .r-floor-grid {
          position: absolute; left: 0; right: 0; bottom: 0; height: 48%;
          background-image: linear-gradient(rgba(232,51,107,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(232,51,107,0.28) 1px, transparent 1px);
          background-size: 46px 46px;
          transform: perspective(340px) rotateX(62deg);
          transform-origin: bottom;
          mask-image: linear-gradient(to top, black, transparent 85%);
          opacity: 0.75;
        }


        /* Fondo "El publico como protagonista": foto ambiental */
        .r-bg-ambient { background-size: cover; background-position: center 30%; }
        .r-ambient-fade { position: absolute; inset: 0; background: linear-gradient(180deg, #0c0c10 0%, rgba(12,12,16,0.86) 35%, rgba(12,12,16,0.86) 65%, #0c0c10 100%); }

        /* Fondo "Confianza": red de nodos */
        .r-bg-network { background-image: radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px); background-size: 30px 30px; }
        .r-network-glow { position: absolute; top: 10%; left: 50%; transform: translateX(-50%); width: 60%; height: 60%; background: radial-gradient(ellipse, rgba(76,63,224,0.26), transparent 65%); animation: heroFloat 14s ease-in-out infinite; }

        /* Fondo "Planes": luces de disco */
        .r-bg-disco { background: #0c0c10; }
        .r-disco-beam { position: absolute; top: -20%; width: 3px; height: 140%; opacity: 0.35; transform-origin: top center; filter: blur(1px); }
        .db1 { left: 20%; background: linear-gradient(180deg, rgba(232,51,107,0.6), transparent); animation: discoSweep 10s ease-in-out infinite; }
        .db2 { left: 50%; background: linear-gradient(180deg, rgba(34,195,230,0.6), transparent); animation: discoSweep 8s ease-in-out infinite reverse; animation-delay: -2s; }
        .db3 { left: 78%; background: linear-gradient(180deg, rgba(139,60,224,0.6), transparent); animation: discoSweep 11s ease-in-out infinite; animation-delay: -5s; }
        @keyframes discoSweep { 0%, 100% { transform: rotate(-16deg); opacity: 0.2; } 50% { transform: rotate(16deg); opacity: 0.45; } }
        .r-disco-dot { position: absolute; width: 6px; height: 6px; border-radius: 999px; box-shadow: 0 0 14px 3px currentColor; animation: discoFloat 6s ease-in-out infinite; }
        .dd1 { top: 18%; left: 12%; color: #ff6fa5; background: #ff6fa5; animation-delay: 0s; }
        .dd2 { top: 30%; right: 14%; color: #22c3e6; background: #22c3e6; animation-delay: -1.5s; }
        .dd3 { bottom: 22%; left: 22%; color: #ffd23f; background: #ffd23f; animation-delay: -3s; }
        .dd4 { bottom: 30%; right: 22%; color: #8b7bff; background: #8b7bff; animation-delay: -4.5s; }
        @keyframes discoFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-14px) scale(1.3); opacity: 1; } }
        .r-kicker { display: inline-flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #ff6fa5; margin-bottom: 18px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(232,51,107,0.35); background: rgba(232,51,107,0.08); text-shadow: 0 0 12px rgba(232,51,107,0.6); }
        .r-kicker::before { content: ''; width: 6px; height: 6px; border-radius: 999px; background: currentColor; box-shadow: 0 0 8px 2px currentColor; }
        .r-kicker.center { margin-left: auto; margin-right: auto; }
        .r-h2 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 3vw, 2.3rem); font-weight: 700; line-height: 1.25; letter-spacing: -0.01em; margin-bottom: 20px; max-width: 620px; text-shadow: 0 0 30px rgba(232,51,107,0.18); }
        .r-h2.center { margin-left: auto; margin-right: auto; text-align: center; }
        .r-p { font-size: 15.5px; line-height: 1.75; color: #a3a3ad; max-width: 520px; }
        .r-p.center-p { margin: 0 auto 36px; max-width: 560px; }

        .r-split { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
        .r-split.reverse .r-split-text { order: 2; }
        .r-split.reverse .r-split-visual { order: 1; }
        .r-split-visual { border-radius: 16px; overflow: hidden; border: 1px solid rgba(232,51,107,0.3); box-shadow: 0 0 0 1px rgba(232,51,107,0.06), 0 30px 70px -30px rgba(232,51,107,0.35); }
        .r-visual-emojis { position: relative; overflow: visible; }
        .r-visual-emojis img { border-radius: 16px; }
        .r-float-emoji { position: absolute; font-size: 34px; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.5)); animation: emojiFloat 4.5s ease-in-out infinite; }
        .e1 { top: -16px; left: -14px; animation-delay: 0s; }
        .e2 { top: 14%; right: -18px; font-size: 30px; animation-delay: -1.2s; }
        .e3 { bottom: 10%; left: -20px; font-size: 32px; animation-delay: -2.4s; }
        .e4 { bottom: -16px; right: 10%; animation-delay: -3.4s; }
        @keyframes emojiFloat { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-12px) rotate(4deg); } }
        .r-split-visual img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* Steps */
        .r-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; margin-top: 56px; }
        .r-step { border-top: 2px solid rgba(232,51,107,0.35); padding-top: 20px; }
        .r-step-n { font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #6c6c78; font-weight: 600; display: block; margin-bottom: 14px; }
        .r-step-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; margin-bottom: 8px; }
        .r-step-desc { font-size: 13.5px; color: #8f8f99; line-height: 1.6; }

        /* Modes */
        .r-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 56px; }
        .r-mode-card { position: relative; border-radius: 14px; background: #0e0e12; border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent); transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease; overflow: hidden; box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 8%, transparent), 0 20px 50px -34px color-mix(in srgb, var(--accent) 70%, transparent); }
        .r-mode-card::before { content: ''; position: absolute; inset: -1px; border-radius: 14px; padding: 1px; background: linear-gradient(135deg, var(--accent), transparent 40%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.3s ease; }
        .r-mode-card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px -24px color-mix(in srgb, var(--accent) 60%, transparent); }
        .r-mode-card:hover::before { opacity: 1; }
        .r-mode-header { position: relative; height: 168px; overflow: hidden; transform: translateZ(0); }
        .r-mode-header img { width: 100%; height: 100%; object-fit: cover; filter: saturate(1.3) contrast(1.05); transition: transform 0.5s ease; transform: scale(1.08); backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .r-mode-card:hover .r-mode-header img { transform: scale(1.18); }
        .r-mode-header-fade { position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent) 0%, rgba(14,14,18,0.2) 55%, #0e0e12 100%); }
        .r-mode-header-scan { position: absolute; inset: 0; background: linear-gradient(120deg, transparent 40%, color-mix(in srgb, var(--accent) 35%, transparent) 50%, transparent 60%); background-size: 250% 250%; animation: modeScan 5s ease-in-out infinite; opacity: 0.7; }
        @keyframes modeScan { 0% { background-position: 120% 0%; } 100% { background-position: -20% 100%; } }
        .r-mode-body { padding: 26px 28px 32px; }
        .r-mode-dot { display: block; width: 8px; height: 8px; border-radius: 999px; background: var(--accent); margin-bottom: 20px; box-shadow: 0 0 12px 2px color-mix(in srgb, var(--accent) 70%, transparent); animation: dotPulse 2.4s ease-in-out infinite; position: relative; z-index: 2; }
        @keyframes dotPulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .r-mode-name, .r-mode-desc, .r-mode-points, .r-mode-link { position: relative; z-index: 2; }
        .r-mode-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px; margin-bottom: 12px; }
        .r-mode-desc { font-size: 13.5px; color: #a3a3ad; line-height: 1.6; margin-bottom: 22px; }
        .r-mode-points { list-style: none; padding: 0; margin: 0 0 26px; display: flex; flex-direction: column; gap: 10px; }
        .r-mode-points li { font-size: 13px; color: #c4c4cc; padding-left: 16px; position: relative; }
        .r-mode-points li::before { content: ''; position: absolute; left: 0; top: 7px; width: 5px; height: 5px; border-radius: 999px; background: var(--accent); }
        .r-mode-link { font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
        .r-mode-link:hover { text-decoration: underline; }

        /* Trust */
        .r-trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 56px; }
        .r-trust-card { padding: 28px 26px; border-radius: 14px; background: linear-gradient(160deg, color-mix(in srgb, var(--tc-accent) 10%, transparent), #0e0e12 60%); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid var(--tc-accent); transition: border-color 0.25s ease, transform 0.25s ease; }
        .r-trust-card:hover { transform: translateY(-4px); border-color: var(--tc-accent); box-shadow: 0 18px 44px -26px var(--tc-accent); }
        .r-trust-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15.5px; margin-bottom: 10px; color: var(--tc-accent); }
        .r-trust-desc { font-size: 13px; color: #8f8f99; line-height: 1.65; }

        /* Final CTA */
        .r-final { padding: 110px 6vw; border-top: 1px solid rgba(255,255,255,0.08); position: relative; overflow: hidden; }
        .r-final-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: center; }
        .r-final-text { text-align: left; }
        .r-final-phone-wrap { position: relative; display: flex; justify-content: center; }
        .r-final-phone { position: relative; width: 220px; border-radius: 34px; padding: 10px; background: #111; border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 0 0 1px rgba(232,51,107,0.15), 0 40px 80px -30px rgba(76,63,224,0.55); animation: phoneFloat 5s ease-in-out infinite; }
        .r-phone-notch { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 70px; height: 16px; border-radius: 999px; background: #111; z-index: 2; }
        .r-final-phone img { width: 100%; display: block; border-radius: 24px; }
        @keyframes phoneFloat { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-16px) rotate(2deg); } }
        .r-final-phone-glow { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); width: 60%; height: 30px; background: radial-gradient(ellipse, rgba(232,51,107,0.5), transparent 70%); filter: blur(10px); animation: phoneGlowPulse 5s ease-in-out infinite; }
        @keyframes phoneGlowPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        @media (max-width: 900px) { .r-final-grid { grid-template-columns: 1fr; } .r-final-text { text-align: center; } .r-final-phone-wrap { order: -1; } }
        .r-final-glow { position: absolute; width: 26rem; height: 26rem; border-radius: 999px; filter: blur(110px); opacity: 0.3; }
        .r-final-glow.g1 { background: #e8336b; top: -6rem; left: 5%; }
        .r-final-glow.g2 { background: #4c3fe0; bottom: -8rem; right: 8%; }
        .r-final-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.8rem, 3.8vw, 2.8rem); font-weight: 600; line-height: 1.25; letter-spacing: -0.01em; margin-bottom: 34px; background: linear-gradient(100deg, #fff 10%, #ff6fa5 50%, #8b7bff 85%); -webkit-background-clip: text; background-clip: text; color: transparent; }

        /* Footer */
        .r-footer { padding: 56px 6vw 40px; border-top: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, transparent, rgba(232,51,107,0.03)); }
        .r-footer-inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; padding-bottom: 34px; }
        .r-footer-logo-link { display: block; }
        .r-logo-img.footer { height: 54px; width: auto; display: block; filter: drop-shadow(0 0 20px rgba(232,51,107,0.3)); }
        .r-footer-links { display: flex; gap: 30px; font-size: 13.5px; font-weight: 500; color: #a3a3ad; }
        .r-footer-links a { color: inherit; text-decoration: none; transition: color 0.15s ease; }
        .r-footer-links a:hover { color: #fff; }
        .r-footer-actions { display: flex; align-items: center; gap: 20px; }
        .r-footer-divider { max-width: 1240px; margin: 0 auto; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); }
        .r-footer-copy { font-size: 12px; color: #6c6c78; text-align: center; padding-top: 26px; }
        @media (max-width: 700px) { .r-footer-inner { flex-direction: column; text-align: center; } }

        @media (max-width: 900px) {
          .r-nav-links, .r-nav-actions { display: none; }
          .r-nav-burger { display: flex; }
          .r-split, .r-split.reverse { grid-template-columns: 1fr; gap: 36px; }
          .r-split.reverse .r-split-text, .r-split.reverse .r-split-visual { order: unset; }
          .r-steps { grid-template-columns: repeat(2, 1fr); gap: 32px; }
          .r-modes { grid-template-columns: 1fr; }
          .r-trust-grid { grid-template-columns: 1fr; }
          .r-hero-stats { gap: 18px; }
        }
        @media (max-width: 560px) {
          .r-steps { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
