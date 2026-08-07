// Fase D: helpers para compartir el resultado de una presentacion. No
// depende de ninguna libreria instalada de antemano — html2canvas se carga
// desde CDN solo cuando el usuario aprieta "Descargar tarjeta", igual que el
// patron ya usado en la app para cargar fuentes de Google en tiempo real.

const HTML2CANVAS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'

export function buildShareUrl(performanceId) {
  if (typeof window === 'undefined') return ''
  return window.location.origin + '/r/' + performanceId
}

export function buildShareText({ song, artistName, notaFinal }) {
  const notaTxt = notaFinal !== null && notaFinal !== undefined ? notaFinal.toFixed(1) : null
  const songTxt = artistName ? song + ' — ' + artistName : song
  if (notaTxt) {
    return '🎤 Acabo de cantar "' + songTxt + '" en Retroke y saqué ' + notaTxt + '/10. ¡Únete tú también!'
  }
  return '🎤 Acabo de cantar "' + songTxt + '" en Retroke. ¡Únete tú también!'
}

// Intenta el share nativo del celular (WhatsApp, Instagram, etc). Si el
// navegador no lo soporta (la mayoria de los desktop), copia el link al
// portapapeles como respaldo. Nunca lanza error hacia quien la llama.
export async function shareResult({ url, text, title }) {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: title || 'Retroke', text, url })
      return { method: 'share' }
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return { method: 'cancelled' }
  }
  try {
    await navigator.clipboard.writeText(url)
    return { method: 'copy' }
  } catch (err) {
    return { method: 'error' }
  }
}

let html2canvasLoadPromise = null
function loadHtml2Canvas() {
  if (typeof window !== 'undefined' && window.html2canvas) return Promise.resolve(window.html2canvas)
  if (!html2canvasLoadPromise) {
    html2canvasLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = HTML2CANVAS_SRC
      script.onload = () => resolve(window.html2canvas)
      script.onerror = () => reject(new Error('No se pudo cargar html2canvas'))
      document.head.appendChild(script)
    })
  }
  return html2canvasLoadPromise
}

// Convierte el nodo de la tarjeta en una imagen PNG y dispara la descarga —
// pensado para que la gente la suba como estado de WhatsApp o historia de
// Instagram, donde una imagen funciona mucho mejor que un link pelado.
export async function downloadCardAsImage(node, filename) {
  if (!node) return { error: 'No hay tarjeta para descargar' }
  try {
    const html2canvas = await loadHtml2Canvas()
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename || 'retroke-resultado.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return { error: null }
  } catch (err) {
    return { error: err.message || 'No se pudo generar la imagen' }
  }
}
