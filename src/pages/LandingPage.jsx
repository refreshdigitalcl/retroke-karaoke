import { useEffect, useRef, useState } from 'react'

var FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Audiowide&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap'

function useGoogleFonts() {
  useEffect(function () {
    if (document.getElementById('retroke-landing-fonts')) return
    var link = document.createElement('link')
    link.id = 'retroke-landing-fonts'
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
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [])

  return (
    <div ref={ref} className={'reveal' + (visible ? ' reveal-visible' : '')}>
      {props.children}
    </div>
  )
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
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting && !started) {
          started = true
          var target = props.target
          var duration = 900
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
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return function () { observer.disconnect() }
  }, [props.target])

  return <span ref={ref}>{value}{props.suffix || ''}</span>
}

function useMouseGlow(ref) {
  useEffect(function () {
    var el = ref.current
    if (!el) return
    function onMove(e) {
      var rect = el.getBoundingClientRect()
      var x = ((e.clientX - rect.left) / rect.width) * 100
      var y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--mx', x + '%')
      el.style.setProperty('--my', y + '%')
    }
    el.addEventListener('mousemove', onMove)
    return function () { el.removeEventListener('mousemove', onMove) }
  }, [])
}

var MODES = [
  { emoji: '🍺', name: 'RETROKE BAR', accent: '#E91E8C', img: '/landing/modo-bar.jpg',
    desc: 'Deja el papel y el caos. Cada mesa se anota desde su celular y tu local se convierte en el tema de la semana.',
    diff: 'Lo único pensado para varios locales a la vez.',
    features: ['Panel DJ profesional en vivo', 'Cola de cantantes sin límite', 'Reacciones y memes del público', 'Multi-Bar: todos tus locales, un solo panel', 'Estadísticas y ranking por local', 'Branding con tu marca'] },
  { emoji: '🎧', name: 'RETROKE DJ', accent: '#8B5CF6', img: '/landing/modo-dj.jpg',
    desc: 'Lleva tu experiencia contigo. Un panel que controla todo el show desde tu celular, en cualquier evento.',
    diff: 'Pensado para moverte de evento en evento.',
    features: ['Panel 100% portátil', 'Control total del show en vivo', 'Calificaciones y reacciones en tiempo real', 'Configuración que viaja contigo', 'Imagen profesional frente al cliente', 'Funciona en cualquier local, sin instalar nada'] },
  { emoji: '🏠', name: 'RETROKE HOME', accent: '#F4D03F', img: '/landing/modo-home.jpg',
    desc: 'Tu TV se convierte en escenario. Tus invitados usan su propio celular como micrófono, sin instalar nada.',
    diff: 'El único modo pensado para la casa, no el negocio.',
    features: ['Sin apps que instalar', 'El celular es el micrófono', 'Invitados ilimitados', 'Reacciones en vivo entre amigos', 'Ideal para cumpleaños y juntas', 'Próximamente: Vocal Score'] }
]

var REQUISITOS = [
  {
    tier: 'Esencial', icon: '🟢', accent: '#7ED957', subtitle: 'Todo lo que necesitas para comenzar.',
    items: [
      'Navegador web actualizado (Chrome, Edge, Brave, Safari o Firefox).',
      'Conexión a Internet estable (10 Mbps o superior).',
      'Compatible con computadores, notebooks, tablets y Smart TVs.',
      'Funciona también con Internet móvil 4G o 5G.',
      'Micrófono funcional para las funciones que lo requieran.'
    ]
  },
  {
    tier: 'Recomendado', icon: '🔵', accent: '#8B5CF6', subtitle: 'Para una experiencia más fluida y estable.', highlight: true,
    items: [
      'Google Chrome, Brave o Safari actualizados.',
      'Acceder siempre directo desde el navegador.',
      'No abrir los enlaces desde apps como Gmail — usan un navegador interno propio. Copia el enlace o ábrelo directo en Chrome, Brave o Safari.',
      'Conexión de 30 Mbps o superior.',
      'Pantalla Full HD (1920×1080) o superior.',
      'Para equipos de DJ o Bar, conexión por cable (Ethernet) cuando sea posible.'
    ]
  },
  {
    tier: 'Experiencia Premium', icon: '🟣', accent: '#E91E8C', subtitle: 'Para disfrutar Retroke al máximo.',
    items: [
      'Computador o notebook de buen rendimiento.',
      'Conexión a Internet estable de alta velocidad.',
      'Sistema de sonido de buena calidad.',
      'Micrófonos profesionales para una mejor experiencia.',
      'Smart TV o monitor Full HD / 4K.',
      'Red Wi-Fi de 5 GHz para mayor estabilidad en celulares.'
    ]
  }
]

var FAQS = [
  { q: '¿Cómo creo mi cuenta?', a: 'Eliges tu plan (Bar, DJ o Home) en la página de precios y creas tu cuenta en menos de un minuto. Sin tarjeta para empezar gratis.' },
  { q: '¿Qué hago después de registrarme?', a: 'Entras directo a tu panel. Ahí defines el nombre de tu sala, y te aparece el QR que la gente va a escanear para anotarse.' },
  { q: '¿Cómo dejo mi TV lista para usar Retroke?', a: 'Abre el navegador de la TV (o un notebook conectado a ella) directo en Chrome, Brave o Safari, entra a tu sala, y déjala en pantalla completa. Ya queda operativo.' },
  { q: '¿Por qué no debo abrir el link desde Gmail u otra app?', a: 'Esas apps usan su propio navegador interno, más limitado, y pueden bloquear que el video se reproduzca solo. Siempre copia el link y ábrelo directo en Chrome, Brave o Safari.' },
  { q: '¿Necesito instalar algo?', a: 'No. Todo funciona desde el navegador, tanto en la TV como en el celular de cada persona.' }
]

function VintageEqualizer() {
  var bars = [0.4, 0.7, 0.5, 0.9, 0.6, 1, 0.55, 0.85, 0.45, 0.75, 0.5, 0.65]
  return (
    <div className="vintage-eq" aria-hidden="true">
      {bars.map(function (h, i) {
        return <span key={i} style={{ animationDelay: (i * 0.09) + 's', '--h': h }} />
      })}
    </div>
  )
}

function Screenshot(props) {
  return (
    <div className={'screenshot-frame' + (props.className ? ' ' + props.className : '')}>
      <img src={props.src} alt={props.alt} loading="lazy" />
    </div>
  )
}

function FaqItem(props) {
  var openState = useState(false)
  var open = openState[0]
  var setOpen = openState[1]
  return (
    <div className={'faq-item' + (open ? ' open' : '')}>
      <button className="faq-question" onClick={function () { setOpen(!open) }} aria-expanded={open}>
        <span>{props.q}</span>
        <span className="faq-toggle">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="faq-answer">{props.a}</p>}
    </div>
  )
}

export default function LandingPage() {
  useGoogleFonts()
  var reducedMotion = usePrefersReducedMotion()
  var heroRef = useRef(null)
  useMouseGlow(heroRef)

  var navScrolledState = useState(false)
  var navScrolled = navScrolledState[0]
  var setNavScrolled = navScrolledState[1]

  var menuOpenState = useState(false)
  var menuOpen = menuOpenState[0]
  var setMenuOpen = menuOpenState[1]

  var parallaxState = useState(0)
  var parallaxY = parallaxState[0]
  var setParallaxY = parallaxState[1]

  useEffect(function () {
    function onScroll() {
      setNavScrolled(window.scrollY > 40)
      if (!reducedMotion) setParallaxY(window.scrollY)
    }
    window.addEventListener('scroll', onScroll)
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [reducedMotion])

  return (
    <div className={'retroke-landing' + (reducedMotion ? ' reduced-motion' : '')}>
      <nav className={'landing-nav' + (navScrolled ? ' scrolled' : '')}>
        <div className="landing-nav-inner">
          <a href="/inicio" className="landing-logo-link">
            <img src="/landing/retroke-logo.png" alt="Retroke" className="landing-logo-img" />
          </a>
          <div className="landing-nav-links">
            <a href="#modos">Modos</a>
            <a href="#vivelo">Vívelo</a>
            <a href="#requisitos">Requisitos</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-nav-actions">
            <a href="/dj" className="landing-btn landing-btn-ghost small">Iniciar sesión</a>
            <a href="/precios" className="landing-btn landing-btn-primary small">Comenzar gratis</a>
          </div>
          <button className="landing-nav-burger" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={function () { setMenuOpen(!menuOpen) }}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="landing-nav-mobile">
            <a href="#modos" onClick={function () { setMenuOpen(false) }}>Modos</a>
            <a href="#vivelo" onClick={function () { setMenuOpen(false) }}>Vívelo</a>
            <a href="#requisitos" onClick={function () { setMenuOpen(false) }}>Requisitos</a>
            <a href="#faq" onClick={function () { setMenuOpen(false) }}>FAQ</a>
            <a href="/dj" className="landing-btn landing-btn-ghost">Iniciar sesión</a>
            <a href="/precios" className="landing-btn landing-btn-primary">Comenzar gratis</a>
          </div>
        )}
      </nav>

      {/* 1. HERO */}
      <header className="landing-hero" ref={heroRef}>
        <div className="hero-bg-photo" style={{ backgroundImage: 'url(/landing/hero-nueva.jpg)', transform: reducedMotion ? 'none' : ('translateY(' + Math.min(parallaxY * 0.15, 60) + 'px)') }} />
        <div className="hero-bg-overlay" />
        <div className="hero-mouse-glow" aria-hidden="true" />
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="landing-hero-inner">
          <p className="eyebrow">✨ Una plataforma de entretenimiento en vivo</p>
          <img src="/landing/retroke-logo.png" alt="RETROKE" className="hero-brand-logo" />
          <p className="hero-tagline">Vienes a vivir el escenario.</p>
          <p className="hero-sub">
            No vienes solo a cantar. Retroke transforma cualquier bar, evento o junta en
            casa en un show real — cola en vivo, micrófono desde el celular, y un público
            que participa de verdad.
          </p>
          <div className="hero-ctas">
            <a href="/precios" className="landing-btn landing-btn-primary large">Comenzar gratis</a>
            <a href="#modos" className="landing-btn landing-btn-ghost large">Ver demo</a>
          </div>
          <div className="hero-feature-strip">
            <div className="hero-feature-item">
              <span className="hero-feature-icon">🎛️</span>
              <div>
                <strong><CountUp target={3} /> modos</strong>
                <span>Bar, DJ y Home</span>
              </div>
            </div>
            <div className="hero-feature-divider" />
            <div className="hero-feature-item">
              <span className="hero-feature-icon">🌐</span>
              <div>
                <strong><CountUp target={100} suffix="%" /></strong>
                <span>Desde el navegador</span>
              </div>
            </div>
            <div className="hero-feature-divider" />
            <div className="hero-feature-item">
              <span className="hero-feature-icon">🚀</span>
              <div>
                <strong>Gratis</strong>
                <span>Para empezar hoy</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint" aria-hidden="true"><span /></div>
      </header>

      {/* 2. MODALIDADES */}
      <section className="landing-section" id="modos">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">En qué consiste cada modalidad</p>
            <h2 className="section-title center">Bar. DJ. Home.</h2>
            <p className="section-lead center-margin">
              El mismo sistema, adaptado a donde lo necesites.
            </p>
            <div className="modes-grid">
              {MODES.map(function (m) {
                return (
                  <div className="mode-card" key={m.name} style={{ '--accent': m.accent }}>
                    <div className="mode-card-img"><img src={m.img} alt={m.name} loading="lazy" /></div>
                    <div className="mode-card-body">
                      <span className="mode-emoji">{m.emoji}</span>
                      <p className="mode-name">{m.name}</p>
                      <p className="mode-desc">{m.desc}</p>
                      <p className="mode-diff">⚡ {m.diff}</p>
                      <ul className="mode-features">
                        {m.features.map(function (f) { return <li key={f}>{f}</li> })}
                      </ul>
                      <a href="/precios" className="mode-cta">Descubrir {m.name.split(' ')[1]} →</a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 3. CANTA UNO, LO VIVEN TODOS */}
      <section className="landing-section publico-section" id="vivelo">
        <div className="landing-hero-glow glow-magenta" style={{ bottom: '0%', left: '0%' }} />
        <Reveal>
          <div className="landing-section-inner vivelo-grid">
            <div>
              <h2 className="section-title big gradient-text">CANTA UNO.<br />LO VIVEN TODOS.</h2>
              <p className="section-lead left">
                Nadie es simplemente espectador. Mientras alguien canta, el público entero
                se convierte en jurado: reacciona en vivo, pone la nota final, y cada
                presentación queda con sus propias estadísticas — todo desde el celular
                de cada persona, en tiempo real, sin pedir el micrófono.
              </p>
              <div className="vivelo-stat-row">
                <div className="vivelo-stat"><strong>⭐ 1-10</strong><span>Nota del público en vivo</span></div>
                <div className="vivelo-stat"><strong>🔥 En vivo</strong><span>Reacciones que se cuentan solas</span></div>
                <div className="vivelo-stat"><strong>📊 Al toque</strong><span>Estadísticas de cada show</span></div>
              </div>
              <div className="flow-chain">
                <span className="flow-step">🎤 Alguien canta</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">❤️ El público reacciona</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">⭐ Se pone nota</span>
                <span className="flow-arrow">→</span>
                <span className="flow-step">🎉 Queda en las estadísticas</span>
              </div>
            </div>
            <Screenshot src="/landing/vivelo-calificacion.jpg" alt="El público califica y reacciona en vivo desde su celular" />
          </div>
        </Reveal>
      </section>

      {/* 4. REQUISITOS DEL SISTEMA */}
      <section className="landing-section requisitos-section" id="requisitos">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">💻 Requisitos del sistema</p>
            <h2 className="section-title center">Funciona directo desde el navegador</h2>
            <p className="section-lead center-margin">
              Retroke no requiere instalar ninguna aplicación.
            </p>
            <div className="req-ladder" aria-hidden="true">
              <span className="req-ladder-line" />
            </div>
            <div className="req-grid">
              {REQUISITOS.map(function (r, ri) {
                return (
                  <div className={'req-card' + (r.highlight ? ' req-card-highlight' : '')} key={r.tier} style={{ '--accent': r.accent }}>
                    {r.highlight && <span className="req-badge">Más elegido</span>}
                    <div className="req-icon-badge">{r.icon}</div>
                    <p className="req-tier">{r.tier}</p>
                    <p className="req-subtitle">{r.subtitle}</p>
                    <ul className="req-list">
                      {r.items.map(function (it, i) {
                        return <li key={i} style={{ transitionDelay: (ri * 80 + i * 60) + 'ms' }}>{it}</li>
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 5. FAQ - Antes de empezar */}
      <section className="landing-section" id="faq">
        <Reveal>
          <div className="landing-section-inner faq-inner">
            <p className="section-eyebrow center">Antes de empezar</p>
            <h2 className="section-title center">De la cuenta a tu primera noche</h2>
            <div className="faq-list">
              {FAQS.map(function (f) { return <FaqItem key={f.q} q={f.q} a={f.a} /> })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA FINAL */}
      <section className="landing-final-cta">
        <div className="landing-hero-glow glow-magenta" style={{ top: '-10%', left: '10%' }} />
        <div className="landing-hero-glow glow-purple" style={{ bottom: '-10%', right: '10%' }} />
        <VintageEqualizer />
        <div className="landing-section-inner final-cta-inner">
          <h2 className="final-cta-title">MÁS QUE UN KARAOKE,<br />UN ESCENARIO PARA TODOS.</h2>
          <div className="hero-ctas center">
            <a href="/precios" className="landing-btn landing-btn-primary large">Comenzar gratis</a>
          </div>
        </div>
        <VintageEqualizer />
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <img src="/landing/retroke-logo.png" alt="Retroke" className="landing-logo-img small" />
        <p className="footer-tagline">El karaoke se vive diferente.</p>
        <p className="footer-copy">© {new Date().getFullYear()} Retroke. Todos los derechos reservados.</p>
      </footer>

      <style>{`
        .retroke-landing { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; overflow-x: hidden; }
        .retroke-landing * { box-sizing: border-box; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .reduced-motion .reveal { opacity: 1; transform: none; transition: none; }
        .reduced-motion * { animation: none !important; }

        .landing-nav { position: sticky; top: 0; z-index: 50; padding: 14px 6vw; transition: background 0.25s ease, border-color 0.25s ease, padding 0.25s ease; border-bottom: 1px solid transparent; }
        .landing-nav.scrolled { background: rgba(6, 3, 9, 0.85); backdrop-filter: blur(14px); border-bottom-color: rgba(139, 92, 246, 0.25); padding: 9px 6vw; }
        .landing-nav-inner { max-width: 1260px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .landing-logo-link { display: flex; align-items: center; }
        .landing-logo-img { height: 54px; width: auto; display: block; }
        .landing-logo-img.small { height: 40px; margin: 0 auto 10px; }
        .landing-nav-links { display: flex; gap: 26px; font-size: 13.5px; font-weight: 600; color: #b7aecb; }
        .landing-nav-links a { color: inherit; text-decoration: none; transition: color 0.15s; }
        .landing-nav-links a:hover { color: #fff; }
        .landing-nav-actions { display: flex; gap: 10px; align-items: center; }
        .landing-nav-burger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 8px; }
        .landing-nav-burger span { width: 20px; height: 2px; background: #fff; border-radius: 2px; }
        .landing-nav-mobile { display: flex; flex-direction: column; gap: 16px; padding: 20px 4px 8px; font-size: 14px; font-weight: 600; color: #d7d0e6; }
        .landing-nav-mobile a { color: inherit; text-decoration: none; }

        .landing-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease; white-space: nowrap; cursor: pointer; }
        .landing-btn:focus-visible { outline: 2px solid #F4D03F; outline-offset: 3px; }
        .landing-btn.small { padding: 9px 18px; font-size: 12.5px; }
        .landing-btn.large { padding: 17px 36px; font-size: 16px; }
        .landing-btn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 30px -4px rgba(233, 30, 140, 0.7); }
        .landing-btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 6px 40px -4px rgba(233, 30, 140, 0.9); }
        .landing-btn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139, 92, 246, 0.5); backdrop-filter: blur(6px); }
        .landing-btn-ghost:hover { border-color: #8B5CF6; background: rgba(139,92,246,0.15); transform: translateY(-2px); }

        .screenshot-frame { border-radius: 16px; overflow: hidden; border: 1.5px solid rgba(244,208,63,0.35); box-shadow: 0 24px 70px -20px rgba(139,92,246,0.55); }
        .screenshot-frame img { display: block; width: 100%; height: auto; }

        /* Hero */
        .landing-hero { position: relative; padding: 130px 6vw 60px; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
        .hero-bg-photo { position: absolute; inset: -5%; background-size: cover; background-position: center 30%; opacity: 0.42; will-change: transform; }
        .hero-bg-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(6,3,9,0.55) 0%, rgba(6,3,9,0.78) 55%, #060309 100%), radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.25), transparent 60%); }
        .hero-mouse-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 30%), rgba(233,30,140,0.16), transparent 70%); transition: background 0.1s ease; }
        .hero-scanlines { position: absolute; inset: 0; pointer-events: none; opacity: 0.04; background-image: repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px); }
        .landing-hero-glow { position: absolute; width: 34rem; height: 34rem; border-radius: 999px; filter: blur(95px); opacity: 0.28; pointer-events: none; }
        .glow-magenta { background: #E91E8C; top: -8rem; left: -10rem; }
        .glow-purple { background: #8B5CF6; bottom: -10rem; right: -8rem; }
        .landing-hero-inner { position: relative; z-index: 2; max-width: 780px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #F4D03F; margin-bottom: 22px; font-weight: 600; }
        .hero-brand-logo { width: min(460px, 92%); height: auto; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 50px rgba(233,30,140,0.4)); }
        .hero-tagline { font-family: 'Audiowide', cursive; font-size: clamp(1.1rem, 2.4vw, 1.7rem); color: #fff; margin-bottom: 22px; letter-spacing: 0.5px; }
        .hero-sub { font-size: 17px; line-height: 1.7; color: #c3bcd4; max-width: 520px; margin-bottom: 34px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .hero-feature-strip {
          display: flex; align-items: center; gap: 0; margin: 42px auto 10px;
          padding: 18px 34px; border-radius: 999px; flex-wrap: wrap; justify-content: center;
          background: rgba(255,255,255,0.045); border: 1.5px solid rgba(244,208,63,0.35);
          box-shadow: 0 0 40px -10px rgba(233,30,140,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
        }
        .hero-feature-item { display: flex; align-items: center; gap: 12px; padding: 0 22px; }
        .hero-feature-icon { font-size: 24px; filter: drop-shadow(0 0 8px rgba(244,208,63,0.6)); }
        .hero-feature-item strong { font-family: 'Audiowide', cursive; font-size: 18px; display: block; background: linear-gradient(90deg, #F4D03F, #E91E8C); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: 0.3px; }
        .hero-feature-item span { font-size: 11.5px; color: #b7aecb; font-weight: 600; }
        .hero-feature-divider { width: 1.5px; height: 32px; background: linear-gradient(180deg, transparent, rgba(139,92,246,0.5), transparent); }
        @media (max-width: 560px) { .hero-feature-strip { padding: 16px 20px; gap: 4px; } .hero-feature-divider { display: none; } .hero-feature-item { padding: 6px 10px; } }
        .hero-scroll-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); width: 22px; height: 36px; border: 2px solid rgba(255,255,255,0.3); border-radius: 12px; z-index: 2; }
        .hero-scroll-hint span { display: block; width: 3px; height: 8px; background: #F4D03F; border-radius: 2px; margin: 6px auto; animation: scrollhint 1.6s ease-in-out infinite; }
        @keyframes scrollhint { 0% { opacity: 0; transform: translateY(0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(10px); } }

        .landing-section { padding: 84px 6vw; position: relative; }
        .landing-section-inner { max-width: 1260px; margin: 0 auto; position: relative; z-index: 2; }
        .center-text { text-align: center; }
        .section-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8B5CF6; font-weight: 600; margin-bottom: 10px; }
        .section-eyebrow.center { text-align: center; }
        .section-title { font-family: 'Audiowide', cursive; font-size: clamp(1.4rem, 2.4vw, 2rem); line-height: 1.3; margin-bottom: 16px; max-width: 640px; letter-spacing: 0.5px; }
        .section-title.center { margin-left: auto; margin-right: auto; text-align: center; }
        .section-title.big { font-size: clamp(1.7rem, 3.6vw, 2.7rem); }
        .gradient-text { background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .section-lead { font-size: 16px; line-height: 1.75; color: #c3bcd4; max-width: 620px; margin: 0 auto; }
        .section-lead.left { margin: 0 0 26px; }
        .section-lead.center-margin { margin: 0 auto 20px; }

        /* Modes */
        .modes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 36px; }
        .mode-card { border-radius: 22px; overflow: hidden; background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), rgba(12,8,16,0.6)); border: 1.5px solid color-mix(in srgb, var(--accent) 40%, transparent); transition: transform 0.25s ease, border-color 0.25s ease; }
        .mode-card:hover { transform: translateY(-6px); border-color: var(--accent); }
        .mode-card-img { height: 150px; overflow: hidden; }
        .mode-card-img img { width: 100%; height: 100%; object-fit: cover; }
        .mode-card-body { padding: 22px 24px 26px; }
        .mode-emoji { font-size: 28px; display: block; margin-bottom: 10px; }
        .mode-name { font-family: 'Audiowide', cursive; font-size: 14px; color: var(--accent); margin-bottom: 10px; letter-spacing: 0.5px; }
        .mode-desc { font-size: 13px; color: #d7d0e6; line-height: 1.55; margin-bottom: 12px; }
        .mode-diff { font-size: 11.5px; font-weight: 700; color: var(--accent); margin-bottom: 16px; padding: 8px 12px; background: color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 10px; border-left: 2px solid var(--accent); }
        .mode-features { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 6px; }
        .mode-features li { font-size: 12.5px; color: #c3bcd4; padding-left: 16px; position: relative; }
        .mode-features li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 800; }
        .mode-cta { font-size: 13px; font-weight: 800; color: var(--accent); text-decoration: none; }
        .mode-cta:hover { text-decoration: underline; }

        /* Publico */
        .publico-section { padding-top: 100px; }
        .vivelo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        .flow-chain { display: flex; align-items: center; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
        .vivelo-stat-row { display: flex; gap: 14px; flex-wrap: wrap; margin: 26px 0 6px; }
        .vivelo-stat { padding: 12px 18px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(244,208,63,0.3); }
        .vivelo-stat strong { display: block; font-family: 'Audiowide', cursive; font-size: 14px; color: #F4D03F; margin-bottom: 3px; letter-spacing: 0.3px; }
        .vivelo-stat span { font-size: 11px; color: #a79fbb; font-weight: 600; }
        .flow-step { font-weight: 700; font-size: 13.5px; padding: 9px 18px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.35); }
        .flow-arrow { color: #8B5CF6; font-size: 15px; }

        /* Requisitos */
        .requisitos-section { background: linear-gradient(180deg, transparent, rgba(139,92,246,0.05), transparent); }
        .req-ladder { max-width: 900px; margin: 8px auto 0; height: 2px; position: relative; }
        .req-ladder-line { position: absolute; top: 0; left: 8%; right: 8%; height: 2px; background: linear-gradient(90deg, #7ED957, #8B5CF6, #E91E8C); opacity: 0.5; border-radius: 2px; }
        .req-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 40px; align-items: start; }
        .req-card { position: relative; border-radius: 22px; padding: 30px 26px; background: rgba(255,255,255,0.03); border: 1.5px solid color-mix(in srgb, var(--accent) 40%, transparent); transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .req-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px -20px color-mix(in srgb, var(--accent) 60%, transparent); }
        .req-card-highlight { background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 14%, transparent), rgba(255,255,255,0.03)); border-width: 2px; box-shadow: 0 0 40px -14px color-mix(in srgb, var(--accent) 70%, transparent); }
        .req-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #0a0612; font-size: 10.5px; font-weight: 800; padding: 5px 14px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .req-icon-badge { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent); margin-bottom: 16px; }
        .req-tier { font-family: 'Audiowide', cursive; font-size: 15px; color: var(--accent); margin-bottom: 6px; letter-spacing: 0.5px; }
        .req-subtitle { font-size: 12.5px; color: #9b92ad; margin-bottom: 18px; font-weight: 600; }
        .req-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 11px; }
        .req-list li { font-size: 12.5px; color: #c3bcd4; line-height: 1.55; padding-left: 16px; position: relative; opacity: 0; transform: translateX(-8px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .reveal-visible .req-list li { opacity: 1; transform: translateX(0); }
        .reduced-motion .req-list li { opacity: 1; transform: none; }
        .req-list li::before { content: '•'; position: absolute; left: 0; color: var(--accent); font-weight: 800; }
        @media (max-width: 900px) { .req-grid { grid-template-columns: 1fr; } .req-ladder { display: none; } }

        /* FAQ */
        .faq-inner { max-width: 760px; }
        .faq-list { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; }
        .faq-item { border: 1.5px solid rgba(139,92,246,0.3); border-radius: 14px; background: rgba(255,255,255,0.02); overflow: hidden; }
        .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; background: none; border: none; color: #fff; font-weight: 700; font-size: 14px; text-align: left; cursor: pointer; }
        .faq-toggle { color: #F4D03F; font-size: 18px; font-weight: 800; flex-shrink: 0; }
        .faq-answer { padding: 0 22px 20px; font-size: 13.5px; color: #a79fbb; line-height: 1.6; }

        /* Final CTA */
        .landing-final-cta { position: relative; padding: 90px 6vw; text-align: center; overflow: hidden; }
        .final-cta-inner { position: relative; z-index: 2; }
        .final-cta-title { font-family: 'Audiowide', cursive; font-size: clamp(1.5rem, 3.6vw, 2.6rem); line-height: 1.35; margin-bottom: 30px; background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: 0.5px; }
        .vintage-eq { position: relative; z-index: 1; display: flex; align-items: flex-end; justify-content: center; gap: 6px; height: 44px; margin: 0 auto 30px; max-width: 480px; }
        .vintage-eq span { width: 6px; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #F4D03F, #E91E8C 60%, #8B5CF6); box-shadow: 0 0 10px -1px rgba(233,30,140,0.7); height: calc(var(--h) * 44px); animation: eqBounce 1.1s ease-in-out infinite; transform-origin: bottom; }
        @keyframes eqBounce { 0%, 100% { transform: scaleY(0.5); opacity: 0.7; } 50% { transform: scaleY(1); opacity: 1; } }
        .landing-final-cta .vintage-eq:last-child { margin: 30px auto 0; }

        /* Footer */
        .landing-footer { padding: 44px 6vw 30px; border-top: 1px solid rgba(139,92,246,0.2); text-align: center; }
        .footer-tagline { font-size: 13px; color: #9b92ad; margin-bottom: 18px; }
        .footer-copy { font-size: 12px; color: #6c6480; padding-top: 18px; border-top: 1px solid rgba(139,92,246,0.12); max-width: 400px; margin: 0 auto; }

        @media (max-width: 900px) {
          .landing-nav-links, .landing-nav-actions { display: none; }
          .landing-nav-burger { display: flex; }
          .modes-grid { grid-template-columns: 1fr; }
          .vivelo-grid { grid-template-columns: 1fr; text-align: center; }
          .vivelo-grid .section-lead.left { margin: 0 auto 26px; }
          .flow-chain { justify-content: center; }
          .req-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
