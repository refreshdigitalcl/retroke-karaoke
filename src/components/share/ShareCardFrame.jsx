import { forwardRef, useEffect } from 'react'

// Fase 14 de Retroke World ("Viralidad"), ver
// retroke-world-diagnostico-tecnico.md seccion 7 y punto 39 del prompt
// maestro. Frame 9:16 reusable para las tarjetas compartibles NUEVAS
// (ranking, logro, desafio) -- mismo look & feel retro-neon y las mismas
// reglas de html2canvas que ya resolvio ShareResultCard.jsx (texto en
// color solido, nunca degradado; imagenes precargadas antes de capturar
// via waitForImages en lib/shareCard.js; useCORS activado ahi mismo).
//
// A proposito NO se toco ShareResultCard.jsx para extraer esto: es codigo
// ya probado en produccion con lecciones de html2canvas dificiles de volver
// a aprender si algo sale mal ahi. En vez de arriesgar una regresion en el
// flujo de compartir resultado (que ya funciona), este frame es la base
// nueva y separada (namespace de clases "wcard-*", sin colision con
// "share-card*") para las tres tarjetas nuevas de esta fase.

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'
export const WCARD_LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

function useWCardFont() {
  useEffect(() => {
    if (document.querySelector('link[data-retroke-share-font]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONT_HREF
    link.setAttribute('data-retroke-share-font', 'true')
    document.head.appendChild(link)
  }, [])
}

export const ShareCardFrame = forwardRef(function ShareCardFrame(props, ref) {
  useWCardFont()
  return (
    <div ref={ref} className="wcard-frame">
      <style>{`
        .wcard-frame {
          width: 100%; max-width: 440px; aspect-ratio: 9 / 16; border-radius: 30px; position: relative;
          overflow: hidden; background: radial-gradient(circle at 50% 0%, #33174d 0%, #14081f 55%, #05030a 100%);
          border: 2.5px solid #E91E8C; box-sizing: border-box; display: flex; align-items: center; justify-content: center;
          padding: 56px 22px 86px;
        }
        .wcard-frame::before {
          content: ''; position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px);
          pointer-events: none;
        }
        .wcard-frame::after {
          content: ''; position: absolute; top: -40%; left: -20%; width: 140%; height: 55%;
          background: radial-gradient(ellipse at center, rgba(233,30,140,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .wcard { position: relative; z-index: 1; width: 100%; font-family: 'Space Grotesk', system-ui, sans-serif; color: #fff; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .wcard-logo { height: 34px; width: auto; object-fit: contain; flex-shrink: 0; }
        .wcard-avatar-wrap { position: relative; width: 92px; height: 92px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .wcard-avatar-glow { position: absolute; inset: 0; border-radius: 9999px; background: radial-gradient(circle, rgba(233,30,140,0.4) 0%, rgba(139,92,246,0.25) 55%, transparent 78%); }
        .wcard-avatar-ring { position: absolute; inset: 4px; border-radius: 9999px; border: 2px solid rgba(244,208,79,0.6); }
        .wcard-avatar { position: relative; font-size: 48px; line-height: 1; filter: drop-shadow(0 0 14px rgba(233, 30, 140, 0.7)); }
        .wcard-avatar-photo { position: relative; width: 80px; height: 80px; border-radius: 9999px; object-fit: cover; display: block; box-shadow: 0 0 0 2px rgba(255,255,255,0.15); }
        .wcard-name { font-size: 20px; font-weight: 700; text-align: center; line-height: 1.2; flex-shrink: 0; }
        .wcard-vs { font-size: 11.5px; color: rgba(255,255,255,0.5); text-align: center; flex-shrink: 0; }
        .wcard-level { font-size: 11.5px; font-weight: 600; padding: 4px 14px; border-radius: 999px; border: 1px solid rgba(244, 208, 79, 0.65); color: #F4D03F; background: rgba(244, 208, 79, 0.1); letter-spacing: 0.03em; flex-shrink: 0; }
        .wcard-box { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 18px 14px; border-radius: 20px; background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9)); border: 1.5px solid rgba(244,208,79,0.55); box-sizing: border-box; flex-shrink: 0; gap: 5px; }
        .wcard-box-label { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(255,255,255,0.6); }
        .wcard-box-value { font-size: 42px; font-weight: 700; line-height: 1.1; color: #F4D03F; text-shadow: 0 0 20px rgba(244,208,79,0.5); text-align: center; }
        .wcard-box-sub { font-size: 13px; color: rgba(255,255,255,0.65); text-align: center; }
        .wcard-badge-done { font-size: 11px; font-weight: 700; color: #7ED957; background: rgba(126,217,87,0.12); border-radius: 999px; padding: 4px 12px; }
        .wcard-footer { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); text-align: center; flex-shrink: 0; }
        .wcard-footer-sub { margin-top: 2px; font-size: 10px; color: rgba(255,255,255,0.45); }
      `}</style>
      <div className="wcard">{props.children}</div>
    </div>
  )
})
