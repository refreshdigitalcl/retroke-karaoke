import { useEffect, useRef, useState } from 'react'

var FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Bungee&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap'

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
    <div ref={ref} className={'reveal' + (visible ? ' reveal-visible' : '')} style={props.delay ? { transitionDelay: props.delay } : undefined}>
      {props.children}
    </div>
  )
}

// Numero que cuenta hacia arriba cuando entra en pantalla.
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

// Fondo con brillo que sigue al mouse suavemente (sin librerias externas).
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
  {
    emoji: '🍺', name: 'RETROKE BAR', accent: '#E91E8C', img: '/landing/panel-dj.jpg',
    tagline: 'Para bares, pubs y locales.',
    desc: 'Deja el papel y el caos. Cada mesa se anota desde su celular y tu local se convierte en el tema de la semana.',
    features: ['Panel DJ profesional', 'Cola en vivo', 'Reacciones y memes', 'Multi-Bar']
  },
  {
    emoji: '🎧', name: 'RETROKE DJ', accent: '#8B5CF6', img: '/landing/resultado-reacciones.jpg',
    tagline: 'Para DJs y animadores.',
    desc: 'Lleva tu experiencia contigo. Un panel que controla todo el show desde tu celular, en cualquier evento.',
    features: ['Panel portátil', 'Control total del show', 'Calificaciones en vivo', 'Imagen profesional']
  },
  {
    emoji: '🏠', name: 'RETROKE HOME', accent: '#F4D03F', img: '/landing/mobile-registro.jpg',
    tagline: 'Para casas y fiestas.',
    desc: 'Tu TV se convierte en escenario. Tus invitados usan su propio celular como micrófono, sin instalar nada.',
    features: ['Sin apps que instalar', 'El celular es el micrófono', 'Invitados ilimitados', 'Próx.: Vocal Score']
  }
]

var STEPS = [
  { n: '01', title: 'Elige', desc: 'Tu canción, desde el celular.' },
  { n: '02', title: 'Regístrate', desc: 'Entras a la cola en segundos.' },
  { n: '03', title: 'Sube', desc: 'La pantalla y el escenario, tuyos.' },
  { n: '04', title: 'Vívelo', desc: 'El público reacciona y califica.' }
]

var PLANS = [
  { group: 'BAR', name: 'Bar Free', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'BAR', name: 'Bar Pro', price: '$24.990 / mes', accent: '#E91E8C', recommended: true },
  { group: 'DJ', name: 'DJ Free', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'DJ', name: 'DJ Pro', price: '$19.990 / mes', accent: '#8B5CF6' },
  { group: 'HOME', name: 'Home Basic', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'HOME', name: 'Home Pro', price: '$7.990 / mes', accent: '#F4D03F' }
]

var FAQS = [
  { q: '¿Necesito instalar una app?', a: 'No. Retroke funciona completo desde el navegador — tanto en la TV como en el celular de cada persona.' },
  { q: '¿Cómo empiezo gratis?', a: 'Eliges tu plan (Bar, DJ o Home) y creas tu cuenta en menos de un minuto. Sin tarjeta para probar.' },
  { q: '¿Qué es el Retroke Score?', a: 'Un puntaje calculado en el mismo celular de quien canta — afinación, ritmo, estabilidad y energía — sin subir audio a ningún servidor.' },
  { q: '¿Puedo usarlo en varios locales?', a: 'Sí, el plan Bar Pro incluye Multi-Bar: administras todos tus locales desde un solo panel.' }
]

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
            <a href="#que-es">Qué es</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#modos">Modos</a>
            <a href="#planes">Planes</a>
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
            <a href="#que-es" onClick={function () { setMenuOpen(false) }}>Qué es</a>
            <a href="#como-funciona" onClick={function () { setMenuOpen(false) }}>Cómo funciona</a>
            <a href="#modos" onClick={function () { setMenuOpen(false) }}>Modos</a>
            <a href="#planes" onClick={function () { setMenuOpen(false) }}>Planes</a>
            <a href="#faq" onClick={function () { setMenuOpen(false) }}>FAQ</a>
            <a href="/dj" className="landing-btn landing-btn-ghost">Iniciar sesión</a>
            <a href="/precios" className="landing-btn landing-btn-primary">Comenzar gratis</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="landing-hero" ref={heroRef}>
        <div className="hero-bg-photo" style={{ backgroundImage: 'url(/landing/hero-atmosfera.jpg)', transform: reducedMotion ? 'none' : ('translateY(' + Math.min(parallaxY * 0.15, 60) + 'px)') }} />
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
            <a href="#que-es" className="landing-btn landing-btn-ghost large">Ver demo</a>
          </div>
          <div className="hero-stats">
            <div><strong><CountUp target={3} /></strong><span>Modos: Bar, DJ, Home</span></div>
            <div><strong><CountUp target={100} suffix="%" /></strong><span>Desde el navegador</span></div>
            <div><strong><CountUp target={0} suffix="$" /></strong><span>Para empezar</span></div>
          </div>
          <Screenshot src="/landing/sala-espera.jpg" alt="Vista previa en vivo de la sala de espera de Retroke" className="hero-preview" />
        </div>
        <div className="hero-scroll-hint" aria-hidden="true"><span /></div>
      </header>

      {/* QUE ES / POR QUE ES DIFERENTE */}
      <section className="landing-section" id="que-es">
        <Reveal>
          <div className="landing-section-inner center-text">
            <p className="section-eyebrow center">¿Qué es Retroke?</p>
            <h2 className="section-title big">NO ES SOLO KARAOKE.</h2>
            <p className="section-lead">
              Es una plataforma que transforma una canción en una experiencia. Uno canta,
              el público reacciona desde su celular en tiempo real, y cada turno puede
              convertirse en el momento que todos recuerdan al día siguiente.
            </p>
            <div className="pill-row">
              <span className="pill">🎤 Canta</span>
              <span className="pill">🔥 Reacciona</span>
              <span className="pill">⭐ Califica</span>
              <span className="pill">🎉 Disfruta</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* VIVELO - proof visual */}
      <section className="landing-section vivelo-section">
        <div className="landing-hero-glow glow-purple" style={{ top: '10%', right: '5%' }} />
        <Reveal>
          <div className="landing-section-inner vivelo-grid">
            <div>
              <p className="section-eyebrow">Por qué es diferente</p>
              <h2 className="section-title gradient-text">NO LO MIRES. VÍVELO.</h2>
              <p className="section-lead left">
                Mientras alguien canta, la pantalla muestra la letra, un dato real y
                verificado del artista, y las reacciones del público apareciendo en vivo
                — todo al mismo tiempo, legible desde la última mesa.
              </p>
            </div>
            <Screenshot src="/landing/video-datos-artista.jpg" alt="Pantalla de reproducción con letra y datos reales del artista" />
          </div>
        </Reveal>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" id="como-funciona">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Cómo funciona</p>
            <h2 className="section-title center">De la mesa al escenario</h2>
            <div className="steps-grid">
              {STEPS.map(function (s, i) {
                return (
                  <div className="step-card" key={s.n}>
                    <span className="step-number">{s.n}</span>
                    <p className="step-title">{s.title}</p>
                    <p className="step-desc">{s.desc}</p>
                    {i < STEPS.length - 1 && <span className="step-connector" />}
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* MODOS */}
      <section className="landing-section" id="modos">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Una experiencia, tres formas de vivirla</p>
            <h2 className="section-title center">Bar. DJ. Home.</h2>
            <div className="modes-grid">
              {MODES.map(function (m) {
                return (
                  <div className="mode-card" key={m.name} style={{ '--accent': m.accent }}>
                    <div className="mode-card-img"><img src={m.img} alt={m.name} loading="lazy" /></div>
                    <div className="mode-card-body">
                      <span className="mode-emoji">{m.emoji}</span>
                      <p className="mode-name">{m.name}</p>
                      <p className="mode-tagline">{m.tagline}</p>
                      <p className="mode-desc">{m.desc}</p>
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

      {/* REACCIONES + RANKINGS */}
      <section className="landing-section publico-section">
        <div className="landing-hero-glow glow-magenta" style={{ bottom: '0%', left: '0%' }} />
        <Reveal>
          <div className="landing-section-inner center-text">
            <h2 className="section-title big gradient-text">CANTA UNO. LO VIVEN TODOS.</h2>
            <p className="section-lead">
              Nadie es simplemente espectador. Cada persona reacciona, califica y aparece
              en el ranking de la noche — todo desde su propio celular, en tiempo real.
            </p>
            <div className="publico-screens">
              <Screenshot src="/landing/video-memes-overlay.jpg" alt="Memes del público apareciendo sobre el video en vivo" />
              <Screenshot src="/landing/resultado-reacciones.jpg" alt="Resultado final con público, nota y reacciones" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* VOCAL SCORE / IA */}
      <section className="landing-section vocalscore-section">
        <Reveal>
          <div className="landing-section-inner center-text">
            <p className="section-eyebrow center">Próximamente</p>
            <h2 className="section-title big">Retroke Vocal Score</h2>
            <p className="section-lead">
              Estamos desarrollando una nueva forma de analizar tu interpretación —
              afinación, ritmo, estabilidad y presencia vocal — para ayudarte a mejorar,
              no para juzgarte. Parte de Retroke Home y los planes compatibles.
            </p>
          </div>
        </Reveal>
      </section>

      {/* PLANES */}
      <section className="landing-section" id="planes">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Planes</p>
            <h2 className="section-title center">Elige tu experiencia</h2>
            <div className="plans-grid">
              {PLANS.map(function (p) {
                return (
                  <div className={'plan-mini' + (p.recommended ? ' recommended' : '')} key={p.name} style={{ '--accent': p.accent }}>
                    {p.recommended && <span className="plan-mini-badge">Recomendado</span>}
                    <p className="plan-mini-group">{p.group}</p>
                    <p className="plan-mini-name">{p.name}</p>
                    <p className="plan-mini-price">{p.price}</p>
                  </div>
                )
              })}
            </div>
            <div className="center-text" style={{ marginTop: '36px' }}>
              <a href="/precios" className="landing-btn landing-btn-primary">Ver todos los planes</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="landing-section" id="faq">
        <Reveal>
          <div className="landing-section-inner faq-inner">
            <p className="section-eyebrow center">Preguntas frecuentes</p>
            <h2 className="section-title center">Antes de empezar</h2>
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
        <div className="landing-section-inner final-cta-inner">
          <h2 className="final-cta-title">CANTA UNO.<br />LO VIVEN TODOS.</h2>
          <p className="final-cta-sub">Retroke transforma cualquier canción en un momento para recordar.</p>
          <div className="hero-ctas center">
            <a href="/precios" className="landing-btn landing-btn-primary large">Comenzar gratis</a>
            <a href="#planes" className="landing-btn landing-btn-ghost large">Ver planes</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <img src="/landing/retroke-logo.png" alt="Retroke" className="landing-logo-img small" />
            <p className="footer-tagline">El karaoke se vive diferente.</p>
          </div>
          <div>
            <p className="footer-col-title">Productos</p>
            <a href="#modos">Bar</a>
            <a href="#modos">DJ</a>
            <a href="#modos">Home</a>
          </div>
          <div>
            <p className="footer-col-title">Recursos</p>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="/precios">Planes</a>
            <a href="#faq">Preguntas frecuentes</a>
          </div>
          <div>
            <p className="footer-col-title">Cuenta</p>
            <a href="/dj">Iniciar sesión</a>
            <a href="/precios">Crear cuenta</a>
          </div>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Retroke. Todos los derechos reservados.</p>
      </footer>

      <style>{`
        .retroke-landing { background: #060309; color: #fff; font-family: 'Manrope', sans-serif; overflow-x: hidden; }
        .retroke-landing * { box-sizing: border-box; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .reduced-motion .reveal { opacity: 1; transform: none; transition: none; }
        .reduced-motion * { animation: none !important; }

        /* Nav */
        .landing-nav { position: sticky; top: 0; z-index: 50; padding: 14px 6vw; transition: background 0.25s ease, border-color 0.25s ease, padding 0.25s ease; border-bottom: 1px solid transparent; }
        .landing-nav.scrolled { background: rgba(6, 3, 9, 0.85); backdrop-filter: blur(14px); border-bottom-color: rgba(139, 92, 246, 0.25); padding: 9px 6vw; }
        .landing-nav-inner { max-width: 1260px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .landing-logo-link { display: flex; align-items: center; }
        .landing-logo-img { height: 42px; width: auto; display: block; }
        .landing-logo-img.small { height: 36px; margin-bottom: 10px; }
        .landing-nav-links { display: flex; gap: 26px; font-size: 13.5px; font-weight: 600; color: #b7aecb; }
        .landing-nav-links a { color: inherit; text-decoration: none; transition: color 0.15s; }
        .landing-nav-links a:hover { color: #fff; }
        .landing-nav-actions { display: flex; gap: 10px; align-items: center; }
        .landing-nav-burger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 8px; }
        .landing-nav-burger span { width: 20px; height: 2px; background: #fff; border-radius: 2px; }
        .landing-nav-mobile { display: flex; flex-direction: column; gap: 16px; padding: 20px 4px 8px; font-size: 14px; font-weight: 600; color: #d7d0e6; }
        .landing-nav-mobile a { color: inherit; text-decoration: none; }

        /* Buttons */
        .landing-btn { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease; white-space: nowrap; cursor: pointer; }
        .landing-btn:focus-visible { outline: 2px solid #F4D03F; outline-offset: 3px; }
        .landing-btn.small { padding: 9px 18px; font-size: 12.5px; }
        .landing-btn.large { padding: 17px 36px; font-size: 16px; }
        .landing-btn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 30px -4px rgba(233, 30, 140, 0.7); }
        .landing-btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 6px 40px -4px rgba(233, 30, 140, 0.9); }
        .landing-btn-ghost { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(139, 92, 246, 0.5); backdrop-filter: blur(6px); }
        .landing-btn-ghost:hover { border-color: #8B5CF6; background: rgba(139,92,246,0.15); transform: translateY(-2px); }

        /* Screenshot frame */
        .screenshot-frame { border-radius: 16px; overflow: hidden; border: 1.5px solid rgba(244,208,63,0.35); box-shadow: 0 24px 70px -20px rgba(139,92,246,0.55), 0 0 0 1px rgba(255,255,255,0.03); transition: transform 0.3s ease; }
        .screenshot-frame:hover { transform: translateY(-4px); }
        .screenshot-frame img { display: block; width: 100%; height: auto; }

        /* Hero */
        .landing-hero { position: relative; padding: 130px 6vw 60px; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
        .hero-bg-photo { position: absolute; inset: -5% -5% -5% -5%; background-size: cover; background-position: center 30%; opacity: 0.4; will-change: transform; }
        .hero-bg-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(6,3,9,0.55) 0%, rgba(6,3,9,0.75) 55%, #060309 100%), radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.25), transparent 60%); }
        .hero-mouse-glow { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 30%), rgba(233,30,140,0.16), transparent 70%); transition: background 0.1s ease; }
        .hero-scanlines { position: absolute; inset: 0; pointer-events: none; opacity: 0.04; background-image: repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px); }
        .landing-hero-glow { position: absolute; width: 34rem; height: 34rem; border-radius: 999px; filter: blur(95px); opacity: 0.28; pointer-events: none; }
        .glow-magenta { background: #E91E8C; top: -8rem; left: -10rem; }
        .glow-purple { background: #8B5CF6; bottom: -10rem; right: -8rem; }
        .landing-hero-inner { position: relative; z-index: 2; max-width: 780px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #F4D03F; margin-bottom: 22px; font-weight: 600; }
        .hero-brand-logo { width: min(460px, 92%); height: auto; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 50px rgba(233,30,140,0.4)); }
        .hero-tagline { font-family: 'Bungee', cursive; font-size: clamp(1.2rem, 2.6vw, 1.8rem); color: #fff; margin-bottom: 22px; }
        .hero-sub { font-size: 17px; line-height: 1.7; color: #c3bcd4; max-width: 520px; margin-bottom: 34px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .hero-stats { display: flex; gap: 34px; margin: 40px 0 46px; flex-wrap: wrap; justify-content: center; }
        .hero-stats strong { font-family: 'Bungee', cursive; font-size: 24px; display: block; background: linear-gradient(90deg, #F4D03F, #E91E8C); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero-stats span { font-size: 12px; color: #9b92ad; font-weight: 600; }
        .hero-preview { max-width: 560px; width: 100%; }
        .hero-scroll-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); width: 22px; height: 36px; border: 2px solid rgba(255,255,255,0.3); border-radius: 12px; z-index: 2; }
        .hero-scroll-hint span { display: block; width: 3px; height: 8px; background: #F4D03F; border-radius: 2px; margin: 6px auto; animation: scrollhint 1.6s ease-in-out infinite; }
        @keyframes scrollhint { 0% { opacity: 0; transform: translateY(0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(10px); } }

        /* Sections shared */
        .landing-section { padding: 84px 6vw; position: relative; }
        .landing-section-inner { max-width: 1260px; margin: 0 auto; position: relative; z-index: 2; }
        .center-text { text-align: center; }
        .section-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8B5CF6; font-weight: 600; margin-bottom: 10px; }
        .section-eyebrow.center { text-align: center; }
        .section-title { font-family: 'Bungee', cursive; font-size: clamp(1.5rem, 2.6vw, 2.2rem); line-height: 1.25; margin-bottom: 18px; max-width: 640px; }
        .section-title.center { margin-left: auto; margin-right: auto; text-align: center; }
        .section-title.big { font-size: clamp(1.9rem, 4vw, 3rem); max-width: 780px; margin-left: auto; margin-right: auto; }
        .gradient-text { background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .section-lead { font-size: 16px; line-height: 1.75; color: #c3bcd4; max-width: 620px; margin: 0 auto; }
        .section-lead.left { margin: 0; }

        .pill-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 30px; }
        .pill { font-weight: 700; font-size: 13.5px; padding: 10px 20px; border-radius: 999px; background: rgba(139,92,246,0.12); border: 1.5px solid rgba(139,92,246,0.4); color: #fff; }

        /* Vivelo */
        .vivelo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }

        /* Steps */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 40px; }
        .step-card { position: relative; padding-right: 14px; }
        .step-number { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #F4D03F; display: block; margin-bottom: 10px; }
        .step-title { font-weight: 800; font-size: 16px; margin-bottom: 6px; }
        .step-desc { font-size: 13.5px; color: #a79fbb; line-height: 1.5; }
        .step-connector { display: none; }
        @media (min-width: 769px) { .step-connector { display: block; position: absolute; top: 8px; right: -14px; width: 20px; height: 1.5px; background: linear-gradient(90deg, rgba(139,92,246,0.6), transparent); } }

        /* Modes */
        .modes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 40px; }
        .mode-card { border-radius: 22px; overflow: hidden; background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 12%, transparent), rgba(12,8,16,0.6)); border: 1.5px solid color-mix(in srgb, var(--accent) 40%, transparent); transition: transform 0.25s ease, border-color 0.25s ease; }
        .mode-card:hover { transform: translateY(-6px); border-color: var(--accent); }
        .mode-card-img { height: 140px; overflow: hidden; }
        .mode-card-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .mode-card-body { padding: 22px 24px 26px; }
        .mode-emoji { font-size: 28px; display: block; margin-bottom: 10px; }
        .mode-name { font-family: 'Bungee', cursive; font-size: 15px; color: var(--accent); margin-bottom: 5px; }
        .mode-tagline { font-size: 12px; color: #9b92ad; margin-bottom: 10px; font-weight: 600; }
        .mode-desc { font-size: 13px; color: #d7d0e6; line-height: 1.55; margin-bottom: 16px; }
        .mode-features { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 6px; }
        .mode-features li { font-size: 12.5px; color: #c3bcd4; padding-left: 16px; position: relative; }
        .mode-features li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 800; }
        .mode-cta { font-size: 13px; font-weight: 800; color: var(--accent); text-decoration: none; }
        .mode-cta:hover { text-decoration: underline; }

        /* Publico */
        .publico-section { padding-top: 100px; }
        .publico-screens { display: flex; gap: 22px; justify-content: center; margin-top: 42px; flex-wrap: wrap; align-items: flex-start; }
        .publico-screens .screenshot-frame { max-width: 480px; flex: 1 1 380px; }

        .vocalscore-section { text-align: center; }

        /* Plans */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 22px; }
        .plan-mini { border-radius: 18px; padding: 22px 20px; text-align: center; background: rgba(255,255,255,0.03); border: 1.5px solid color-mix(in srgb, var(--accent) 35%, transparent); position: relative; }
        .plan-mini.recommended { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
        .plan-mini-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #0a0612; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; }
        .plan-mini-group { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: #7a7290; margin-bottom: 6px; }
        .plan-mini-name { font-weight: 800; font-size: 14.5px; margin-bottom: 6px; }
        .plan-mini-price { font-weight: 800; font-size: 17px; color: var(--accent); }

        /* FAQ */
        .faq-inner { max-width: 760px; }
        .faq-list { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; }
        .faq-item { border: 1.5px solid rgba(139,92,246,0.3); border-radius: 14px; background: rgba(255,255,255,0.02); overflow: hidden; }
        .faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; background: none; border: none; color: #fff; font-weight: 700; font-size: 14.5px; text-align: left; cursor: pointer; }
        .faq-toggle { color: #F4D03F; font-size: 18px; font-weight: 800; flex-shrink: 0; }
        .faq-answer { padding: 0 22px 20px; font-size: 13.5px; color: #a79fbb; line-height: 1.6; }

        /* Final CTA */
        .landing-final-cta { position: relative; padding: 110px 6vw; text-align: center; overflow: hidden; }
        .final-cta-inner { position: relative; z-index: 2; }
        .final-cta-title { font-family: 'Bungee', cursive; font-size: clamp(1.8rem, 4.4vw, 3.2rem); line-height: 1.2; margin-bottom: 18px; background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .final-cta-sub { font-size: 15.5px; color: #c3bcd4; margin-bottom: 32px; }

        /* Footer */
        .landing-footer { padding: 50px 6vw 32px; border-top: 1px solid rgba(139,92,246,0.2); }
        .footer-grid { max-width: 1260px; margin: 0 auto 34px; display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 30px; }
        .footer-tagline { font-size: 13px; color: #9b92ad; margin-top: 4px; }
        .footer-col-title { font-weight: 800; font-size: 12.5px; margin-bottom: 12px; color: #fff; }
        .footer-grid a { display: block; font-size: 13px; color: #a79fbb; text-decoration: none; margin-bottom: 9px; }
        .footer-grid a:hover { color: #fff; }
        .footer-copy { max-width: 1260px; margin: 0 auto; font-size: 12px; color: #6c6480; text-align: center; padding-top: 22px; border-top: 1px solid rgba(139,92,246,0.12); }

        /* Responsive */
        @media (max-width: 900px) {
          .landing-nav-links, .landing-nav-actions { display: none; }
          .landing-nav-burger { display: flex; }
          .vivelo-grid { grid-template-columns: 1fr; text-align: center; }
          .vivelo-grid .section-lead.left { margin: 0 auto; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .step-connector { display: none; }
          .modes-grid { grid-template-columns: 1fr; }
          .plans-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .hero-stats { gap: 22px; }
        }
      `}</style>
    </div>
  )
}
