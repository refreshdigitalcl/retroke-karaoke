import { useEffect, useState } from 'react'

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

var FEATURES = [
  {
    icon: '📱',
    title: 'Home Mic + Retroke Score',
    desc: 'El celular se transforma en micrófono. Analiza afinación, ritmo, estabilidad y energía en tiempo real, sin apps que instalar.'
  },
  {
    icon: '💬',
    title: 'Reacciones y memes en vivo',
    desc: 'El público reacciona desde su celular mientras alguien canta — emojis y memes que flotan en pantalla, con control de ráfagas incluido.'
  },
  {
    icon: '🏢',
    title: 'Multi-Bar de verdad',
    desc: 'Administra todos tus locales desde un solo panel. Cada uno con su propia cola, estadísticas y configuración, sin mezclarse jamás.'
  },
  {
    icon: '🎛️',
    title: 'Panel de DJ profesional',
    desc: 'Cola en vivo, búsqueda de video integrada, control total de la pantalla — diseñado para que el DJ nunca pierda el ritmo de la noche.'
  },
  {
    icon: '🧠',
    title: 'Datos curiosos reales',
    desc: 'Mientras alguien canta, la pantalla muestra información real y verificada del artista — no relleno genérico.'
  },
  {
    icon: '✨',
    title: 'Hecho para la TV',
    desc: 'Estética retro-neón nativa, pensada para leerse bien a distancia — sin adaptar apps de escritorio a la fuerza.'
  }
]

var STEPS = [
  { n: '01', title: 'Escanea el QR', desc: 'Cada mesa lo ve en la pantalla principal, sin apps ni descargas.' },
  { n: '02', title: 'Anótate', desc: 'Nombre y canción, en segundos, desde el celular de cualquiera.' },
  { n: '03', title: 'Sube al escenario', desc: 'La cola se actualiza sola. El DJ controla todo desde un solo panel.' },
  { n: '04', title: 'Vive la reacción', desc: 'El público reacciona en vivo. La pantalla se llena de energía real.' }
]

var AUDIENCES = [
  { emoji: '🍹', label: 'Bares', desc: 'Convierte una noche cualquiera en el evento que la gente comenta al otro día.', href: '/precios' },
  { emoji: '🎧', label: 'DJs', desc: 'Un panel profesional que reemplaza la libreta, la pizarra y el caos.', href: '/precios' },
  { emoji: '🏠', label: 'Familias', desc: 'El karaoke de casa, pero con la producción de un show de verdad.', href: '/precios' }
]

function TvMockup() {
  return (
    <div className="tv-mockup">
      <div className="tv-mockup-screen">
        <p className="tv-eyebrow">✨ KARAOKE EN VIVO</p>
        <p className="tv-title">LA CANCIÓN ES TUYA.<br />LA EXPERIENCIA ES DE TODOS.</p>
        <div className="tv-qr">
          <div className="tv-qr-grid">
            {Array.from({ length: 49 }).map(function (_, i) {
              var on = (i * 7 + (i % 5) * 3) % 4 !== 0
              return <span key={i} style={{ opacity: on ? 1 : 0 }} />
            })}
          </div>
        </div>
        <div className="tv-queue">
          <p className="tv-queue-label">● LISTA DE ESPERA</p>
          <div className="tv-queue-row">
            <span className="tv-queue-badge">1</span>
            <span className="tv-queue-name">Valentina</span>
            <span className="tv-queue-ready">LISTO</span>
          </div>
          <div className="tv-queue-row dim">
            <span className="tv-queue-badge">2</span>
            <span className="tv-queue-name">Matías</span>
          </div>
        </div>
      </div>
      <div className="tv-mockup-stand" />
    </div>
  )
}

export default function LandingPage() {
  useGoogleFonts()

  var navScrolledState = useState(false)
  var navScrolled = navScrolledState[0]
  var setNavScrolled = navScrolledState[1]

  useEffect(function () {
    function onScroll() {
      setNavScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll)
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div className="retroke-landing">
      <nav className={'landing-nav' + (navScrolled ? ' scrolled' : '')}>
        <div className="landing-nav-inner">
          <span className="landing-logo">🎤 RETROKE</span>
          <div className="landing-nav-links">
            <a href="#producto">Producto</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#planes">Planes</a>
          </div>
          <a href="/precios" className="landing-btn landing-btn-primary small">Empezar gratis</a>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-glow glow-magenta" />
        <div className="landing-hero-glow glow-purple" />
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="eyebrow">✨ El sistema operativo del karaoke moderno</p>
            <h1 className="hero-headline">
              EL KARAOKE<br />COMO NUNCA<br />LO HAS VIVIDO.
            </h1>
            <p className="hero-sub">
              Retroke convierte cualquier bar, evento o living en un show interactivo real:
              cola en vivo, micrófono desde el celular, reacciones del público y una pantalla
              hecha para verse bien desde lejos.
            </p>
            <div className="hero-ctas">
              <a href="/precios" className="landing-btn landing-btn-primary">Empezar gratis</a>
              <a href="#como-funciona" className="landing-btn landing-btn-ghost">Ver cómo funciona</a>
            </div>
            <p className="hero-note">Sin tarjeta para probar el plan gratis · Bares, DJs y karaoke en casa</p>
          </div>
          <div className="landing-hero-visual">
            <TvMockup />
          </div>
        </div>
      </header>

      <section className="landing-section problem-section" id="producto">
        <div className="landing-section-inner problem-grid">
          <div className="problem-card old">
            <p className="problem-tag">El karaoke de siempre</p>
            <ul>
              <li>Lista de papel que se pierde o se moja</li>
              <li>El DJ adivinando quién va primero</li>
              <li>Nadie sabe cuánto falta para su turno</li>
              <li>Cero interacción real con el público</li>
            </ul>
          </div>
          <div className="problem-arrow">→</div>
          <div className="problem-card new">
            <p className="problem-tag new">Con Retroke</p>
            <ul>
              <li>Cola digital que se actualiza sola</li>
              <li>Cada persona ve su posición en tiempo real</li>
              <li>El público reacciona mientras alguien canta</li>
              <li>Todo se ve bien, incluso desde la última mesa</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <p className="section-eyebrow">Todo lo que necesitas, integrado</p>
          <h2 className="section-title">Un sistema completo, no una app de karaoke más</h2>
          <div className="features-grid">
            {FEATURES.map(function (f) {
              return (
                <div className="feature-card" key={f.title}>
                  <span className="feature-icon">{f.icon}</span>
                  <p className="feature-title">{f.title}</p>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="landing-section" id="como-funciona">
        <div className="landing-section-inner">
          <p className="section-eyebrow">Cómo funciona</p>
          <h2 className="section-title">De la mesa al escenario, en cuatro pasos</h2>
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
      </section>

      <section className="landing-section audiences-section">
        <div className="landing-section-inner">
          <p className="section-eyebrow">Para quién es Retroke</p>
          <h2 className="section-title">Hecho para tres tipos de noche</h2>
          <div className="audiences-grid">
            {AUDIENCES.map(function (a) {
              return (
                <a href={a.href} className="audience-card" key={a.label}>
                  <span className="audience-emoji">{a.emoji}</span>
                  <p className="audience-label">{a.label}</p>
                  <p className="audience-desc">{a.desc}</p>
                  <span className="audience-link">Ver planes →</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="landing-section" id="planes">
        <div className="landing-section-inner planes-teaser">
          <p className="section-eyebrow">Planes</p>
          <h2 className="section-title">Empieza gratis. Sube de nivel cuando quieras.</h2>
          <p className="planes-sub">
            Planes para Bar, DJ y Home — cada uno con su versión gratuita real y su versión PRO,
            sin sorpresas ni letra chica.
          </p>
          <a href="/precios" className="landing-btn landing-btn-primary">Ver todos los planes</a>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="landing-hero-glow glow-magenta" style={{ top: '-10%', left: '10%' }} />
        <div className="landing-hero-glow glow-purple" style={{ bottom: '-10%', right: '10%' }} />
        <div className="landing-section-inner final-cta-inner">
          <h2 className="final-cta-title">EL ESCENARIO TE ESPERA.<br />LA EXPERIENCIA ES TUYA.</h2>
          <a href="/precios" className="landing-btn landing-btn-primary large">Crear mi cuenta gratis</a>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-logo small">🎤 RETROKE</span>
        <p>© {new Date().getFullYear()} Retroke. El sistema operativo del karaoke moderno.</p>
      </footer>

      <style>{`
        .retroke-landing {
          background: #0a0612;
          color: #fff;
          font-family: 'Manrope', sans-serif;
          overflow-x: hidden;
        }
        .retroke-landing * { box-sizing: border-box; }

        /* Nav */
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 18px 6vw;
          transition: background 0.25s ease, border-color 0.25s ease, padding 0.25s ease;
          border-bottom: 1px solid transparent;
        }
        .landing-nav.scrolled {
          background: rgba(10, 6, 18, 0.88);
          backdrop-filter: blur(10px);
          border-bottom-color: rgba(139, 92, 246, 0.25);
          padding: 12px 6vw;
        }
        .landing-nav-inner {
          max-width: 1180px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .landing-logo {
          font-family: 'Bungee', cursive;
          font-size: 15px;
          letter-spacing: 1px;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .landing-logo.small { font-size: 14px; }
        .landing-nav-links {
          display: flex;
          gap: 28px;
          font-size: 14px;
          font-weight: 600;
          color: #b7aecb;
        }
        .landing-nav-links a { color: inherit; text-decoration: none; }
        .landing-nav-links a:hover { color: #fff; }

        /* Buttons */
        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          padding: 12px 24px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        }
        .landing-btn.small { padding: 9px 18px; font-size: 13px; }
        .landing-btn.large { padding: 17px 38px; font-size: 17px; }
        .landing-btn-primary {
          background: linear-gradient(90deg, #E91E8C, #8B5CF6);
          color: #fff;
          box-shadow: 0 0 24px -4px rgba(233, 30, 140, 0.6);
        }
        .landing-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 30px -4px rgba(233, 30, 140, 0.8); }
        .landing-btn-ghost {
          background: rgba(255,255,255,0.04);
          color: #fff;
          border: 1.5px solid rgba(139, 92, 246, 0.5);
        }
        .landing-btn-ghost:hover { border-color: #8B5CF6; background: rgba(139,92,246,0.1); }

        /* Hero */
        .landing-hero {
          position: relative;
          padding: 64px 6vw 90px;
          overflow: hidden;
        }
        .landing-hero-glow {
          position: absolute;
          width: 34rem;
          height: 34rem;
          border-radius: 999px;
          filter: blur(90px);
          opacity: 0.28;
          pointer-events: none;
        }
        .glow-magenta { background: #E91E8C; top: -8rem; left: -10rem; }
        .glow-purple { background: #8B5CF6; bottom: -10rem; right: -8rem; }
        .landing-hero-inner {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 56px;
          align-items: center;
        }
        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #F4D03F;
          margin-bottom: 18px;
          font-weight: 600;
        }
        .hero-headline {
          font-family: 'Bungee', cursive;
          font-size: clamp(2.2rem, 4.4vw, 3.6rem);
          line-height: 1.12;
          color: #fff;
          text-shadow: 0 0 40px rgba(233, 30, 140, 0.3);
          margin-bottom: 22px;
        }
        .hero-sub {
          font-size: 17px;
          line-height: 1.65;
          color: #c3bcd4;
          max-width: 480px;
          margin-bottom: 30px;
        }
        .hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .hero-note { font-size: 12.5px; color: #7a7290; }

        /* TV mockup */
        .tv-mockup { position: relative; }
        .tv-mockup-screen {
          background: radial-gradient(circle at 30% 20%, #1a1128, #0a0612 70%);
          border: 10px solid #1c1428;
          border-radius: 20px;
          box-shadow: 0 0 0 2px rgba(244,208,63,0.4), 0 30px 70px -20px rgba(139,92,246,0.5);
          padding: 26px 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
        }
        .tv-mockup-stand {
          width: 90px;
          height: 14px;
          background: #1c1428;
          margin: 0 auto;
          border-radius: 0 0 8px 8px;
        }
        .tv-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #F4D03F;
          font-weight: 600;
        }
        .tv-title {
          font-family: 'Bungee', cursive;
          font-size: 15px;
          line-height: 1.35;
          color: #fff;
        }
        .tv-qr {
          background: #fff;
          border-radius: 12px;
          padding: 10px;
          border: 2px solid #F4D03F;
          box-shadow: 0 0 20px -4px rgba(244,208,63,0.6);
        }
        .tv-qr-grid {
          display: grid;
          grid-template-columns: repeat(7, 6px);
          grid-template-rows: repeat(7, 6px);
          gap: 1.5px;
        }
        .tv-qr-grid span { background: #0a0612; width: 6px; height: 6px; }
        .tv-queue {
          width: 100%;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.4);
          border-radius: 12px;
          padding: 10px 12px;
          text-align: left;
        }
        .tv-queue-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          color: #F4D03F;
          margin-bottom: 8px;
        }
        .tv-queue-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          font-size: 11px;
        }
        .tv-queue-row.dim { opacity: 0.45; }
        .tv-queue-badge {
          width: 16px; height: 16px;
          border-radius: 999px;
          border: 1.5px solid #7ED957;
          color: #7ED957;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700;
          flex-shrink: 0;
        }
        .tv-queue-name { font-weight: 700; flex: 1; }
        .tv-queue-ready {
          background: #7ED957;
          color: #0a0612;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
        }

        /* Sections shared */
        .landing-section { padding: 90px 6vw; }
        .landing-section-inner { max-width: 1180px; margin: 0 auto; }
        .section-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8B5CF6;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .section-title {
          font-family: 'Bungee', cursive;
          font-size: clamp(1.5rem, 2.6vw, 2.2rem);
          line-height: 1.25;
          max-width: 640px;
          margin-bottom: 48px;
        }

        /* Problem/solution */
        .problem-section { padding-top: 40px; }
        .problem-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 28px;
          align-items: center;
        }
        .problem-card {
          border-radius: 24px;
          padding: 32px 30px;
        }
        .problem-card.old { background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.1); }
        .problem-card.new { background: rgba(126,217,87,0.07); border: 1.5px solid rgba(126,217,87,0.4); }
        .problem-tag { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #9b92ad; margin-bottom: 18px; }
        .problem-tag.new { color: #7ED957; }
        .problem-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
        .problem-card.old li { color: #a79fbb; font-size: 14.5px; }
        .problem-card.old li::before { content: '✕ '; color: #E9544A; font-weight: 800; }
        .problem-card.new li { color: #e8f5e0; font-size: 14.5px; font-weight: 500; }
        .problem-card.new li::before { content: '✓ '; color: #7ED957; font-weight: 800; }
        .problem-arrow { font-size: 28px; color: #8B5CF6; }

        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1.5px solid rgba(139,92,246,0.25);
          border-radius: 20px;
          padding: 26px 24px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .feature-card:hover { border-color: rgba(233,30,140,0.6); transform: translateY(-3px); }
        .feature-icon { font-size: 26px; display: block; margin-bottom: 14px; }
        .feature-title { font-weight: 800; font-size: 15.5px; margin-bottom: 8px; }
        .feature-desc { font-size: 13.5px; line-height: 1.55; color: #a79fbb; }

        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .step-card { position: relative; padding-right: 14px; }
        .step-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #F4D03F;
          display: block;
          margin-bottom: 12px;
        }
        .step-title { font-weight: 800; font-size: 15px; margin-bottom: 6px; }
        .step-desc { font-size: 13px; color: #a79fbb; line-height: 1.5; }
        .step-connector {
          display: none;
        }
        @media (min-width: 769px) {
          .step-connector {
            display: block;
            position: absolute;
            top: 8px;
            right: -14px;
            width: 20px;
            height: 1.5px;
            background: linear-gradient(90deg, rgba(139,92,246,0.6), transparent);
          }
        }

        /* Audiences */
        .audiences-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        .audience-card {
          display: block;
          text-decoration: none;
          color: #fff;
          background: linear-gradient(160deg, rgba(139,92,246,0.1), rgba(20,15,30,0.4));
          border: 1.5px solid rgba(244,208,63,0.35);
          border-radius: 22px;
          padding: 30px 26px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .audience-card:hover { transform: translateY(-4px); border-color: #F4D03F; }
        .audience-emoji { font-size: 30px; display: block; margin-bottom: 12px; }
        .audience-label { font-family: 'Bungee', cursive; font-size: 16px; margin-bottom: 10px; }
        .audience-desc { font-size: 13.5px; color: #c3bcd4; line-height: 1.55; margin-bottom: 18px; }
        .audience-link { font-size: 13px; font-weight: 700; color: #F4D03F; }

        /* Planes teaser */
        .planes-teaser { text-align: center; }
        .planes-teaser .section-title { margin-left: auto; margin-right: auto; }
        .planes-sub { color: #a79fbb; max-width: 480px; margin: -24px auto 32px; font-size: 15px; line-height: 1.6; }

        /* Final CTA */
        .landing-final-cta { position: relative; padding: 110px 6vw; text-align: center; overflow: hidden; }
        .final-cta-inner { position: relative; z-index: 2; }
        .final-cta-title {
          font-family: 'Bungee', cursive;
          font-size: clamp(1.6rem, 3.6vw, 2.8rem);
          line-height: 1.25;
          margin-bottom: 32px;
          background: linear-gradient(90deg, #F4D03F, #E91E8C, #8B5CF6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Footer */
        .landing-footer {
          padding: 36px 6vw 44px;
          border-top: 1px solid rgba(139,92,246,0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }
        .landing-footer p { font-size: 12.5px; color: #6c6480; }

        /* Responsive */
        @media (max-width: 900px) {
          .landing-nav-links { display: none; }
          .landing-hero-inner { grid-template-columns: 1fr; }
          .landing-hero-visual { order: -1; max-width: 340px; margin: 0 auto; }
          .problem-grid { grid-template-columns: 1fr; }
          .problem-arrow { transform: rotate(90deg); margin: 0 auto; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .steps-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .step-connector { display: none; }
          .audiences-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
