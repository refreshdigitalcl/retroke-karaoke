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

var MODES = [
  {
    emoji: '🍺',
    name: 'RETROKE BAR',
    tagline: 'Para bares, pubs, restaurantes y locales.',
    desc: 'Convierte tu karaoke en una experiencia interactiva para todo el público. Deja de improvisar con papel y lápiz: cada mesa participa desde su celular, y tu local se convierte en el tema de conversación del fin de semana.',
    features: ['Panel DJ profesional', 'Cola de cantantes en vivo', 'Reacciones y memes', 'Calificaciones del público', 'Estadísticas del local', 'Branding personalizado', 'Multi-Bar: todos tus locales'],
    cta: 'Descubrir Retroke Bar',
    accent: '#E91E8C'
  },
  {
    emoji: '🎧',
    name: 'RETROKE DJ',
    tagline: 'Para DJs y animadores.',
    desc: 'Lleva tu experiencia Retroke contigo, evento tras evento. Reemplaza la libreta y el caos de organizar turnos a mano por un panel que controla todo desde tu celular o notebook, en cualquier lugar donde trabajes.',
    features: ['Panel DJ portátil', 'Gestión de participantes', 'Control total del show', 'Reacciones en tiempo real', 'Calificaciones en vivo', 'Imagen profesional frente al cliente'],
    cta: 'Descubrir Retroke DJ',
    accent: '#8B5CF6'
  },
  {
    emoji: '🏠',
    name: 'RETROKE HOME',
    tagline: 'Para casas, reuniones y fiestas.',
    desc: 'Lleva la experiencia Retroke directamente a tu TV, sin instalar nada. Conecta a todos tus invitados desde su propio celular y transforma una junta cualquiera en una noche que se va a recordar.',
    features: ['Funciona desde el navegador', 'El celular es tu micrófono', 'Invitados ilimitados', 'Reacciones en vivo', 'Experiencia Home completa', 'Próximamente: Vocal Score'],
    cta: 'Descubrir Retroke Home',
    accent: '#F4D03F'
  }
]

var STEPS = [
  { n: '01', title: 'Elige', desc: 'Elige tu canción desde el celular, sin hacer fila ni interrumpir al DJ.' },
  { n: '02', title: 'Regístrate', desc: 'Anota tu nombre y entra a la cola en segundos. Ves tu posición en tiempo real.' },
  { n: '03', title: 'Sube', desc: 'Cuando llegue tu momento, la pantalla y el escenario son tuyos.' },
  { n: '04', title: 'Vívelo', desc: 'El público reacciona, califica y participa mientras cantas.' }
]

var PLANS = [
  { group: 'BAR', name: 'Bar Free', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'BAR', name: 'Bar Pro', price: '$24.990 / mes', accent: '#E91E8C', recommended: true, note: 'Recomendado para locales' },
  { group: 'DJ', name: 'DJ Free', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'DJ', name: 'DJ Pro', price: '$19.990 / mes', accent: '#8B5CF6', note: 'Experiencia profesional' },
  { group: 'HOME', name: 'Home Basic', price: 'Gratis', accent: '#8B5CF6' },
  { group: 'HOME', name: 'Home Pro', price: '$7.990 / mes', accent: '#F4D03F', note: 'La experiencia completa' }
]

var METRICS = [
  { label: 'Afinación', desc: 'Qué tan cerca estás del tono real de la canción.' },
  { label: 'Ritmo', desc: 'Qué tan pareja y constante es tu interpretación.' },
  { label: 'Estabilidad', desc: 'Tolera el vibrato natural, no lo penaliza.' },
  { label: 'Energía', desc: 'Volumen y dinámica de tu presentación.' }
]

function SoundWave() {
  var bars = Array.from({ length: 24 })
  return (
    <div className="soundwave" aria-hidden="true">
      {bars.map(function (_, i) {
        return <span key={i} style={{ animationDelay: (i * 0.07) + 's' }} />
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
    function onScroll() { setNavScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll)
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div className={'retroke-landing' + (reducedMotion ? ' reduced-motion' : '')}>
      <nav className={'landing-nav' + (navScrolled ? ' scrolled' : '')}>
        <div className="landing-nav-inner">
          <a href="/inicio" className="landing-logo-link">
            <img src="/landing/retroke-logo.png" alt="Retroke" className="landing-logo-img" />
          </a>
          <div className="landing-nav-links">
            <a href="#inicio">Inicio</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#bar">Bar</a>
            <a href="#dj">DJ</a>
            <a href="#home">Home</a>
            <a href="#planes">Planes</a>
          </div>
          <div className="landing-nav-actions">
            <a href="/dj" className="landing-btn landing-btn-ghost small">Iniciar sesión</a>
            <a href="/precios" className="landing-btn landing-btn-primary small">Probar Retroke</a>
          </div>
          <button className="landing-nav-burger" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={function () { setMenuOpen(!menuOpen) }}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="landing-nav-mobile">
            <a href="#inicio" onClick={function () { setMenuOpen(false) }}>Inicio</a>
            <a href="#como-funciona" onClick={function () { setMenuOpen(false) }}>Cómo funciona</a>
            <a href="#bar" onClick={function () { setMenuOpen(false) }}>Bar</a>
            <a href="#dj" onClick={function () { setMenuOpen(false) }}>DJ</a>
            <a href="#home" onClick={function () { setMenuOpen(false) }}>Home</a>
            <a href="#planes" onClick={function () { setMenuOpen(false) }}>Planes</a>
            <a href="/dj" className="landing-btn landing-btn-ghost">Iniciar sesión</a>
            <a href="/precios" className="landing-btn landing-btn-primary">Probar Retroke</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <header className="landing-hero" id="inicio">
        <div className="landing-hero-glow glow-magenta" />
        <div className="landing-hero-glow glow-purple" />
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="eyebrow">✨ Una plataforma de entretenimiento en vivo</p>
            <img src="/landing/retroke-logo.png" alt="RETROKE" className="hero-brand-logo" />
            <p className="hero-tagline">El karaoke se vive diferente.</p>
            <p className="hero-sub">
              Canta. Reacciona. Compite. Disfruta. Retroke convierte cualquier bar, evento
              o junta en casa en un show interactivo real — con cola en vivo, micrófono
              desde el celular y una pantalla hecha para verse bien desde lejos.
            </p>
            <div className="hero-ctas">
              <a href="/precios" className="landing-btn landing-btn-primary large">🎤 Probar Retroke</a>
              <a href="#vivelo" className="landing-btn landing-btn-ghost large">▶️ Descubrir la experiencia</a>
            </div>
            <div className="hero-stats">
              <div><strong>3</strong><span>Modos: Bar, DJ y Home</span></div>
              <div><strong>100%</strong><span>Desde el navegador, sin apps</span></div>
              <div><strong>0$</strong><span>Para empezar a probar</span></div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <Screenshot src="/landing/sala-espera.jpg" alt="Sala de espera de Retroke en la pantalla principal" className="hero-screenshot" />
            <SoundWave />
          </div>
        </div>
      </header>

      {/* NO ES SOLO KARAOKE */}
      <section className="landing-section">
        <Reveal>
          <div className="landing-section-inner center-text">
            <h2 className="section-title big">NO ES SOLO KARAOKE.</h2>
            <p className="section-lead">
              Retroke transforma una canción en una experiencia. Uno canta, el público
              reacciona en vivo desde su celular, y cada turno puede convertirse en el
              momento que todos van a recordar al día siguiente. No es una pista de audio
              con letras — es un show completo, con público real participando en tiempo real.
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

      {/* VIVELO */}
      <section className="landing-section vivelo-section" id="vivelo">
        <div className="landing-hero-glow glow-purple" style={{ top: '10%', right: '5%' }} />
        <Reveal>
          <div className="landing-section-inner vivelo-grid">
            <div>
              <h2 className="section-title big gradient-text">NO LO MIRES. VÍVELO.</h2>
              <p className="section-lead left">
                El escenario no se mira. Se vive. Retroke convierte al cantante en
                protagonista y al público en parte del espectáculo: mientras alguien
                canta, la pantalla muestra la letra, un dato real del artista y las
                reacciones del público en vivo — todo al mismo tiempo, todo legible
                incluso desde la última mesa.
              </p>
              <div className="vivelo-icons">
                <span>🎤</span><span>📱</span><span>📺</span><span>❤️</span><span>⭐</span>
              </div>
            </div>
            <Screenshot src="/landing/reproduccion.jpg" alt="Pantalla de reproducción con letra, datos del artista y QR de reacciones" />
          </div>
        </Reveal>
      </section>

      {/* COMO FUNCIONA */}
      <section className="landing-section" id="como-funciona">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Cómo funciona</p>
            <h2 className="section-title center">¿Cómo funciona Retroke?</h2>
            <p className="section-lead center-margin">
              Sin apps que descargar, sin libretas, sin que el DJ tenga que adivinar
              quién va primero. Todo pasa en el navegador del celular de cada persona.
            </p>
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
            <div className="steps-screens">
              <Screenshot src="/landing/mobile-registro.jpg" alt="Formulario de registro para cantar, desde el celular" className="steps-screen-mobile" />
              <Screenshot src="/landing/mobile-reacciones.jpg" alt="Pantalla de reacciones desde el celular del público" className="steps-screen-mobile" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* MODOS */}
      <section className="landing-section">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Los modos de Retroke</p>
            <h2 className="section-title center">Una experiencia. Diferentes formas de vivirla.</h2>
            <p className="section-lead center-margin">
              El mismo sistema, adaptado a donde lo necesites: un local con público
              todas las noches, un DJ que se mueve de evento en evento, o una casa
              con invitados que solo quieren pasarlo bien.
            </p>
            <div className="modes-grid">
              {MODES.map(function (m) {
                return (
                  <div className="mode-card" key={m.name} id={m.name.split(' ')[1].toLowerCase()} style={{ '--accent': m.accent }}>
                    <span className="mode-emoji">{m.emoji}</span>
                    <p className="mode-name">{m.name}</p>
                    <p className="mode-tagline">{m.tagline}</p>
                    <p className="mode-desc">{m.desc}</p>
                    <ul className="mode-features">
                      {m.features.map(function (f) {
                        return <li key={f}>{f}</li>
                      })}
                    </ul>
                    <a href="/precios" className="mode-cta">{m.cta} →</a>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* EL PUBLICO */}
      <section className="landing-section publico-section">
        <div className="landing-hero-glow glow-magenta" style={{ bottom: '0%', left: '0%' }} />
        <Reveal>
          <div className="landing-section-inner center-text">
            <h2 className="section-title big gradient-text">CANTA UNO. LO VIVEN TODOS.</h2>
            <p className="section-lead">
              En Retroke nadie es simplemente espectador. Cada persona en la sala puede
              reaccionar, animar, votar y formar parte del show desde su propio celular —
              sin pedir el micrófono, sin interrumpir, en tiempo real.
            </p>
            <div className="flow-chain">
              <span className="flow-step">🎤 Alguien canta</span>
              <span className="flow-arrow">↓</span>
              <span className="flow-step">❤️ El público reacciona</span>
              <span className="flow-arrow">↓</span>
              <span className="flow-step">🔥 Aparecen emociones y memes en pantalla</span>
              <span className="flow-arrow">↓</span>
              <span className="flow-step">⭐ Se califica la presentación</span>
              <span className="flow-arrow">↓</span>
              <span className="flow-step">🎉 Todos participan</span>
            </div>
            <div className="publico-screens">
              <Screenshot src="/landing/mobile-reacciones.jpg" alt="El público reacciona desde su celular" className="steps-screen-mobile" />
              <Screenshot src="/landing/reproduccion.jpg" alt="Las reacciones aparecen en la pantalla principal" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* GAMIFICACION */}
      <section className="landing-section">
        <Reveal>
          <div className="landing-section-inner gamif-grid">
            <Screenshot src="/landing/nota-final.jpg" alt="Pantalla de nota final con Retroke Score, público y métricas" />
            <div>
              <p className="section-eyebrow">Gamificación real</p>
              <h2 className="section-title">Cada canción es un nuevo momento.</h2>
              <p className="section-lead left">
                Al terminar cada presentación, Retroke combina la nota del público con el
                <strong> Retroke Score</strong> — un puntaje calculado en el mismo celular
                de quien canta, sin subir audio a ningún servidor.
              </p>
              <div className="metrics-list">
                {METRICS.map(function (m) {
                  return (
                    <div className="metric-item" key={m.label}>
                      <p className="metric-label">{m.label}</p>
                      <p className="metric-desc">{m.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* HOME MIC */}
      <section className="landing-section homemic-section" id="home">
        <Reveal>
          <div className="landing-section-inner homemic-grid">
            <div>
              <p className="section-eyebrow">Retroke Home</p>
              <h2 className="section-title">Tu celular se convierte en micrófono.</h2>
              <p className="section-lead left">
                Con Retroke Home puedes usar tu teléfono como micrófono mientras disfrutas
                la experiencia completa en tu TV — sin comprar micrófonos, sin instalar
                nada, sin cables. Solo abres el navegador y empieza el show.
              </p>
            </div>
            <div className="homemic-flow">
              <div className="homemic-step"><span>📱</span><p>Teléfono</p></div>
              <span className="homemic-arrow">→</span>
              <div className="homemic-step"><span>🎤</span><p>Micrófono</p></div>
              <span className="homemic-arrow">→</span>
              <div className="homemic-step"><span>📺</span><p>TV</p></div>
              <span className="homemic-arrow">→</span>
              <div className="homemic-step"><span>🎉</span><p>Experiencia</p></div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* VOCAL SCORE */}
      <section className="landing-section vocalscore-section">
        <Reveal>
          <div className="landing-section-inner center-text">
            <p className="section-eyebrow center">Próximamente</p>
            <h2 className="section-title big">Retroke Vocal Score</h2>
            <p className="section-lead">
              Estamos desarrollando una nueva forma de analizar tu interpretación para
              entregarte feedback sobre afinación, ritmo, estabilidad y presencia vocal —
              pensado para ayudarte a mejorar, no para juzgarte.
            </p>
            <p className="vocalscore-note">Será parte de Retroke Home y los planes compatibles.</p>
          </div>
        </Reveal>
      </section>

      {/* PLANES */}
      <section className="landing-section" id="planes">
        <Reveal>
          <div className="landing-section-inner">
            <p className="section-eyebrow center">Planes</p>
            <h2 className="section-title center">Elige tu experiencia</h2>
            <p className="section-lead center-margin">
              Empieza gratis en el plan de tu tipo. Cuando quieras más, sube a PRO sin
              perder nada de lo que ya construiste.
            </p>
            <div className="plans-grid">
              {PLANS.map(function (p) {
                return (
                  <div className={'plan-mini' + (p.recommended ? ' recommended' : '')} key={p.name} style={{ '--accent': p.accent }}>
                    {p.recommended && <span className="plan-mini-badge">Recomendado</span>}
                    <p className="plan-mini-group">{p.group}</p>
                    <p className="plan-mini-name">{p.name}</p>
                    <p className="plan-mini-price">{p.price}</p>
                    {p.note && <p className="plan-mini-note">{p.note}</p>}
                  </div>
                )
              })}
            </div>
            <div className="center-text" style={{ marginTop: '40px' }}>
              <a href="/precios" className="landing-btn landing-btn-primary">Ver todos los planes</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* PRUEBA GRATIS */}
      <section className="landing-section trial-section">
        <Reveal>
          <div className="landing-section-inner center-text">
            <h2 className="section-title big">Pruébalo. Vívelo. Decide.</h2>
            <p className="section-lead">
              Empieza gratis en tu plan Bar, DJ o Home — sin tarjeta, sin compromiso.
              Cuando quieras, activa una prueba de la experiencia PRO por 24 horas
              directo desde tu propio panel y decide con la experiencia real en la mano.
            </p>
            <a href="/precios" className="landing-btn landing-btn-primary large">Comenzar prueba gratis</a>
          </div>
        </Reveal>
      </section>

      {/* CTA FINAL */}
      <section className="landing-final-cta">
        <div className="landing-hero-glow glow-magenta" style={{ top: '-10%', left: '10%' }} />
        <div className="landing-hero-glow glow-purple" style={{ bottom: '-10%', right: '10%' }} />
        <SoundWave />
        <div className="landing-section-inner final-cta-inner">
          <h2 className="final-cta-title">CANTA UNO.<br />LO VIVEN TODOS.</h2>
          <p className="final-cta-sub">Retroke transforma cualquier canción en un momento para recordar.</p>
          <div className="hero-ctas center">
            <a href="/precios" className="landing-btn landing-btn-primary large">🎤 Vivir Retroke</a>
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
            <a href="#bar">Bar</a>
            <a href="#dj">DJ</a>
            <a href="#home">Home</a>
          </div>
          <div>
            <p className="footer-col-title">Recursos</p>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="/precios">Planes</a>
            <a href="#planes">Preguntas frecuentes</a>
            <a href="#planes">Compatibilidad</a>
          </div>
          <div>
            <p className="footer-col-title">Cuenta</p>
            <a href="/dj">Iniciar sesión</a>
            <a href="/precios">Crear cuenta</a>
          </div>
          <div>
            <p className="footer-col-title">Legal</p>
            <a href="#planes">Términos</a>
            <a href="#planes">Privacidad</a>
          </div>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Retroke. Todos los derechos reservados.</p>
      </footer>

      <style>{`
        .retroke-landing { background: #0a0612; color: #fff; font-family: 'Manrope', sans-serif; overflow-x: hidden; }
        .retroke-landing * { box-sizing: border-box; }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        .reduced-motion .reveal { opacity: 1; transform: none; transition: none; }
        .reduced-motion * { animation: none !important; }

        /* Nav */
        .landing-nav { position: sticky; top: 0; z-index: 50; padding: 14px 6vw; transition: background 0.25s ease, border-color 0.25s ease, padding 0.25s ease; border-bottom: 1px solid transparent; }
        .landing-nav.scrolled { background: rgba(10, 6, 18, 0.9); backdrop-filter: blur(10px); border-bottom-color: rgba(139, 92, 246, 0.25); padding: 9px 6vw; }
        .landing-nav-inner { max-width: 1240px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .landing-logo-link { display: flex; align-items: center; }
        .landing-logo-img { height: 34px; width: auto; display: block; }
        .landing-logo-img.small { height: 30px; margin-bottom: 10px; }
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
        .landing-btn.large { padding: 16px 34px; font-size: 16px; }
        .landing-btn-primary { background: linear-gradient(90deg, #E91E8C, #8B5CF6); color: #fff; box-shadow: 0 0 24px -4px rgba(233, 30, 140, 0.6); }
        .landing-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 32px -4px rgba(233, 30, 140, 0.85); }
        .landing-btn-ghost { background: rgba(255,255,255,0.04); color: #fff; border: 1.5px solid rgba(139, 92, 246, 0.5); }
        .landing-btn-ghost:hover { border-color: #8B5CF6; background: rgba(139,92,246,0.12); transform: translateY(-2px); }

        /* Screenshot frame */
        .screenshot-frame { border-radius: 16px; overflow: hidden; border: 1.5px solid rgba(244,208,63,0.4); box-shadow: 0 20px 60px -20px rgba(139,92,246,0.5), 0 0 0 1px rgba(255,255,255,0.03); }
        .screenshot-frame img { display: block; width: 100%; height: auto; }
        .steps-screen-mobile { max-width: 220px; }

        /* Hero */
        .landing-hero { position: relative; padding: 56px 6vw 100px; overflow: hidden; }
        .landing-hero-glow { position: absolute; width: 34rem; height: 34rem; border-radius: 999px; filter: blur(95px); opacity: 0.3; pointer-events: none; }
        .glow-magenta { background: #E91E8C; top: -8rem; left: -10rem; }
        .glow-purple { background: #8B5CF6; bottom: -10rem; right: -8rem; }
        .hero-scanlines { position: absolute; inset: 0; pointer-events: none; opacity: 0.05; background-image: repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px); }
        .landing-hero-inner { position: relative; z-index: 2; max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.05fr 1fr; gap: 60px; align-items: center; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #F4D03F; margin-bottom: 22px; font-weight: 600; }
        .hero-brand-logo { width: min(420px, 90%); height: auto; display: block; margin-bottom: 14px; filter: drop-shadow(0 0 40px rgba(233,30,140,0.35)); }
        .hero-tagline { font-family: 'Bungee', cursive; font-size: clamp(1.1rem, 2.2vw, 1.6rem); color: #fff; margin-bottom: 22px; }
        .hero-sub { font-size: 17px; line-height: 1.7; color: #c3bcd4; max-width: 480px; margin-bottom: 32px; }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; }
        .hero-ctas.center { justify-content: center; }
        .hero-stats { display: flex; gap: 30px; margin-top: 40px; flex-wrap: wrap; }
        .hero-stats strong { font-family: 'Bungee', cursive; font-size: 22px; display: block; background: linear-gradient(90deg, #F4D03F, #E91E8C); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero-stats span { font-size: 12px; color: #9b92ad; font-weight: 600; }

        /* Soundwave */
        .soundwave { display: flex; align-items: flex-end; gap: 3px; height: 26px; margin-top: 26px; justify-content: center; }
        .soundwave span { width: 3px; background: linear-gradient(180deg, #F4D03F, #E91E8C); border-radius: 2px; height: 6px; animation: soundwave-bounce 1.4s ease-in-out infinite; }
        @keyframes soundwave-bounce { 0%, 100% { height: 6px; } 50% { height: 24px; } }

        .hero-screenshot { max-width: 460px; margin: 0 auto; display: block; }

        /* Sections shared */
        .landing-section { padding: 96px 6vw; position: relative; }
        .landing-section-inner { max-width: 1240px; margin: 0 auto; position: relative; z-index: 2; }
        .center-text { text-align: center; }
        .section-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8B5CF6; font-weight: 600; margin-bottom: 10px; }
        .section-eyebrow.center { text-align: center; }
        .section-title { font-family: 'Bungee', cursive; font-size: clamp(1.5rem, 2.6vw, 2.2rem); line-height: 1.25; margin-bottom: 20px; max-width: 640px; }
        .section-title.center { margin-left: auto; margin-right: auto; text-align: center; }
        .section-title.big { font-size: clamp(1.9rem, 4vw, 3.1rem); max-width: 780px; margin-left: auto; margin-right: auto; }
        .gradient-text { background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .section-lead { font-size: 16.5px; line-height: 1.8; color: #c3bcd4; max-width: 640px; margin: 0 auto; }
        .section-lead.left { margin: 0 0 24px; }
        .section-lead.center-margin { margin: 0 auto 20px; }
        .section-lead strong { color: #fff; }

        .pill-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 32px; }
        .pill { font-weight: 700; font-size: 13.5px; padding: 10px 20px; border-radius: 999px; background: rgba(139,92,246,0.12); border: 1.5px solid rgba(139,92,246,0.4); color: #fff; }

        /* Vivelo */
        .vivelo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        .vivelo-icons { display: flex; gap: 22px; font-size: 30px; margin-top: 20px; }
        .vivelo-icons span { animation: float-icon 3s ease-in-out infinite; display: inline-block; }
        .vivelo-icons span:nth-child(2) { animation-delay: 0.3s; }
        .vivelo-icons span:nth-child(3) { animation-delay: 0.6s; }
        .vivelo-icons span:nth-child(4) { animation-delay: 0.9s; }
        .vivelo-icons span:nth-child(5) { animation-delay: 1.2s; }
        @keyframes float-icon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* Steps */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 44px; }
        .step-card { position: relative; padding-right: 14px; }
        .step-number { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #F4D03F; display: block; margin-bottom: 12px; }
        .step-title { font-weight: 800; font-size: 16px; margin-bottom: 6px; }
        .step-desc { font-size: 13.5px; color: #a79fbb; line-height: 1.55; }
        .step-connector { display: none; }
        @media (min-width: 769px) { .step-connector { display: block; position: absolute; top: 8px; right: -14px; width: 20px; height: 1.5px; background: linear-gradient(90deg, rgba(139,92,246,0.6), transparent); } }
        .steps-screens { display: flex; gap: 24px; justify-content: center; margin-top: 56px; flex-wrap: wrap; }

        /* Modes */
        .modes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 44px; }
        .mode-card { background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 14%, transparent), rgba(15,10,20,0.5)); border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent); border-radius: 24px; padding: 32px 28px; transition: transform 0.2s ease, border-color 0.2s ease; }
        .mode-card:hover { transform: translateY(-5px); border-color: var(--accent); }
        .mode-emoji { font-size: 34px; display: block; margin-bottom: 14px; }
        .mode-name { font-family: 'Bungee', cursive; font-size: 16px; color: var(--accent); margin-bottom: 6px; }
        .mode-tagline { font-size: 12.5px; color: #9b92ad; margin-bottom: 12px; font-weight: 600; }
        .mode-desc { font-size: 13.5px; color: #d7d0e6; line-height: 1.6; margin-bottom: 18px; }
        .mode-features { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 8px; }
        .mode-features li { font-size: 13px; color: #c3bcd4; padding-left: 18px; position: relative; }
        .mode-features li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 800; }
        .mode-cta { font-size: 13.5px; font-weight: 800; color: var(--accent); text-decoration: none; }
        .mode-cta:hover { text-decoration: underline; }

        /* Publico */
        .publico-section { padding-top: 110px; }
        .flow-chain { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 40px; }
        .flow-step { font-weight: 700; font-size: 15px; padding: 10px 22px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(139,92,246,0.35); }
        .flow-arrow { color: #8B5CF6; font-size: 16px; }
        .publico-screens { display: flex; gap: 24px; justify-content: center; margin-top: 50px; flex-wrap: wrap; align-items: flex-start; }
        .publico-screens .screenshot-frame:last-child { max-width: 480px; }

        /* Gamificacion */
        .gamif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        .metrics-list { display: flex; flex-direction: column; gap: 16px; margin-top: 26px; }
        .metric-item { border-left: 2px solid rgba(139,92,246,0.5); padding-left: 16px; }
        .metric-label { font-weight: 800; font-size: 14.5px; margin-bottom: 3px; }
        .metric-desc { font-size: 13px; color: #a79fbb; }

        /* Home mic */
        .homemic-section { background: linear-gradient(180deg, transparent, rgba(139,92,246,0.06), transparent); }
        .homemic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; align-items: center; }
        .homemic-flow { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .homemic-step { text-align: center; }
        .homemic-step span { font-size: 32px; display: block; margin-bottom: 8px; }
        .homemic-step p { font-size: 12px; font-weight: 700; color: #c3bcd4; }
        .homemic-arrow { color: #8B5CF6; font-size: 18px; }

        /* Vocal score */
        .vocalscore-section { text-align: center; }
        .vocalscore-note { font-size: 13px; color: #7a7290; margin-top: 20px; font-weight: 600; }

        /* Plans */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 24px; }
        .plan-mini { border-radius: 20px; padding: 24px 22px; text-align: center; background: rgba(255,255,255,0.03); border: 1.5px solid color-mix(in srgb, var(--accent) 35%, transparent); position: relative; }
        .plan-mini.recommended { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
        .plan-mini-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #0a0612; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; }
        .plan-mini-group { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: #7a7290; margin-bottom: 8px; }
        .plan-mini-name { font-weight: 800; font-size: 15px; margin-bottom: 6px; }
        .plan-mini-price { font-weight: 800; font-size: 18px; color: var(--accent); margin-bottom: 6px; }
        .plan-mini-note { font-size: 11.5px; color: #9b92ad; }

        .trial-section { background: rgba(126,217,87,0.04); }

        /* Final CTA */
        .landing-final-cta { position: relative; padding: 120px 6vw; text-align: center; overflow: hidden; }
        .final-cta-inner { position: relative; z-index: 2; }
        .final-cta-title { font-family: 'Bungee', cursive; font-size: clamp(1.8rem, 4.4vw, 3.4rem); line-height: 1.2; margin-bottom: 20px; background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .final-cta-sub { font-size: 16px; color: #c3bcd4; margin-bottom: 34px; }

        /* Footer */
        .landing-footer { padding: 60px 6vw 36px; border-top: 1px solid rgba(139,92,246,0.2); }
        .footer-grid { max-width: 1240px; margin: 0 auto 40px; display: grid; grid-template-columns: 1.4fr repeat(4, 1fr); gap: 30px; }
        .footer-tagline { font-size: 13px; color: #9b92ad; margin-top: 8px; }
        .footer-col-title { font-weight: 800; font-size: 13px; margin-bottom: 14px; color: #fff; }
        .footer-grid a { display: block; font-size: 13.5px; color: #a79fbb; text-decoration: none; margin-bottom: 10px; }
        .footer-grid a:hover { color: #fff; }
        .footer-copy { max-width: 1240px; margin: 0 auto; font-size: 12px; color: #6c6480; text-align: center; padding-top: 24px; border-top: 1px solid rgba(139,92,246,0.12); }

        /* Responsive */
        @media (max-width: 900px) {
          .landing-nav-links, .landing-nav-actions { display: none; }
          .landing-nav-burger { display: flex; }
          .landing-hero-inner { grid-template-columns: 1fr; }
          .landing-hero-visual { order: -1; }
          .vivelo-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .step-connector { display: none; }
          .modes-grid { grid-template-columns: 1fr; }
          .gamif-grid { grid-template-columns: 1fr; }
          .homemic-grid { grid-template-columns: 1fr; text-align: center; }
          .homemic-grid .section-lead.left { margin-left: auto; margin-right: auto; }
          .plans-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .steps-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
