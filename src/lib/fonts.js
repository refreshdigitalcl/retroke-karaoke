import { useEffect } from 'react'

// Fase 17 de Retroke World ("Performance"). Antes de esto, siete archivos
// distintos (World.jsx, Rankings.jsx, Challenges.jsx, Escenario.jsx,
// PublicProfile.jsx, ShareResultCard.jsx, ShareCardFrame.jsx) inyectaban
// cada uno su PROPIO <link> de Google Fonts para la misma familia (Space
// Grotesk), cada uno con un atributo data-* distinto -- el navegador nunca
// reconocia que ya la habia cargado en la pagina anterior y volvia a
// pedirla de nuevo en cada ruta nueva de World que se visitaba. Un solo
// <link> compartido, con todos los pesos que usa cualquier pantalla de
// World, evita esas descargas repetidas sin cambiar como se ve nada.
//
// No se toco SessionHub.jsx ni LandingPage.jsx (fuera del alcance de
// World, y SessionHub es parte del flujo de karaoke en vivo que el
// diagnostico marca como "no tocar").
const RETROKE_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&display=swap'
const FONT_MARKER = 'data-retroke-font'

export function useRetrokeFont() {
  useEffect(() => {
    if (document.querySelector('link[' + FONT_MARKER + ']')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = RETROKE_FONT_HREF
    link.setAttribute(FONT_MARKER, 'true')
    document.head.appendChild(link)
  }, [])
}
