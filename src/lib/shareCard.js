// Utilidades para compartir el resultado de una presentacion: como link
// (texto) y como imagen real (tarjeta capturada con html2canvas), lista
// para pegarse directo en una story de Instagram/WhatsApp/TikTok.
//
// LECCIONES APRENDIDAS sobre html2canvas (para no repetir bugs):
// 1. -webkit-background-clip: text NO se soporta bien -> usar color solido.
// 2. Los <img> (logo, portada de album, foto de perfil) tienen que estar
//    completamente cargados ANTES de llamar a html2canvas, si no la
//    captura sale con el layout roto/corrido (el navegador reserva un
//    tamaño de 0 para la imagen y despues hace reflow, pero html2canvas ya
//    saco la foto). Por eso esperamos explicitamente cada <img> con
//    waitForImages() antes de capturar.
// 3. useCORS: true es necesario para que la portada de album (que viene de
//    un dominio externo, itunes) se dibuje en el canvas en vez de quedar
//    en blanco/tinted.

let html2canvasPromise = null

function loadHtml2Canvas() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.html2canvas) return Promise.resolve(window.html2canvas)
  if (html2canvasPromise) return html2canvasPromise
  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = () => resolve(window.html2canvas)
    script.onerror = () => reject(new Error('No se pudo cargar html2canvas'))
    document.head.appendChild(script)
  })
  return html2canvasPromise
}

function waitForImages(node) {
  if (!node) return Promise.resolve()
  const imgs = Array.from(node.querySelectorAll('img'))
  return Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
        // Timeout de seguridad: si una imagen nunca carga (ej. sin
        // internet), igual dejamos que se comparta el resto de la tarjeta.
        setTimeout(resolve, 4000)
      })
    })
  )
}

export async function renderCardToBlob(node) {
  if (!node) return { canvas: null, blob: null }
  await waitForImages(node)
  const html2canvas = await loadHtml2Canvas()
  if (!html2canvas) return { canvas: null, blob: null }
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    scale: 3,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 5000
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return { canvas, blob }
}

export async function downloadCardAsImage(node, filename) {
  const { canvas } = await renderCardToBlob(node)
  if (!canvas) return { error: 'No se pudo generar la imagen' }
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename || 'retroke-resultado.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return { method: 'download' }
}

export async function shareCardAsImage(node, { filename, title, text } = {}) {
  if (!node) return { error: 'No hay tarjeta para compartir' }
  try {
    const { canvas, blob } = await renderCardToBlob(node)
    if (!blob) return { error: 'No se pudo generar la imagen' }
    const file = new File([blob], filename || 'retroke-resultado.png', { type: 'image/png' })
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: title || 'Retroke', text: text || '' })
      return { method: 'share-image' }
    }
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename || 'retroke-resultado.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return { method: 'download' }
  } catch (err) {
    if (err && err.name === 'AbortError') return { method: 'cancelled' }
    return { error: err.message || 'No se pudo compartir la imagen' }
  }
}

export function buildShareUrl(performanceId) {
  if (typeof window === 'undefined') return ''
  return window.location.origin + '/r/' + performanceId
}

export function buildShareText({ song, artistName, notaFinal }) {
  const notaTxt = notaFinal !== null && notaFinal !== undefined ? notaFinal.toFixed(1) : null
  let text = '🎤 Acabo de cantar'
  if (song) text += ' "' + song + '"'
  if (artistName) text += ' de ' + artistName
  text += ' en Retroke'
  if (notaTxt) text += ' y saqué ' + notaTxt + '/10'
  text += ' 🔥'
  return text
}

export async function shareResult({ performanceId, song, artistName, notaFinal }) {
  const url = buildShareUrl(performanceId)
  const text = buildShareText({ song, artistName, notaFinal })
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Mi resultado en Retroke', text, url })
      return { method: 'share' }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text + ' ' + url)
      return { method: 'clipboard' }
    }
    return { method: 'none', url }
  } catch (err) {
    if (err && err.name === 'AbortError') return { method: 'cancelled' }
    return { error: err.message || 'No se pudo compartir' }
  }
}
