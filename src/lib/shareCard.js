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
// 4. box-shadow (sobre todo "inset") y bordes multiples se rasterizan mal
//    en algunos casos -> preferir bordes solidos simples en lo que se vaya
//    a capturar (ver ShareResultCard.jsx).
// 5. object-fit (cover/contain) en <img> NO se respeta de forma confiable
//    en html2canvas -- la imagen puede salir estirada/deformada en vez de
//    recortada, aunque en el navegador se vea perfecta antes de capturar.
//    Por eso ShareResultCard.jsx arma sus fotos "de recorte" (foto del
//    cantante en el hero, portada del album) como un <div> con
//    background-image + background-size:cover en vez de un <img>, que
//    html2canvas si rasteriza bien. waitForImages() de abajo tiene que
//    esperar esos divs tambien (marcados con data-bg-src), no solo los
//    <img> reales -- si no, la captura puede salir sin esas fotos.

import { trackEvent } from './analytics'

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
  const bgEls = Array.from(node.querySelectorAll('[data-bg-src]'))

  const imgPromises = imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
      // Timeout de seguridad: si una imagen nunca carga (ej. sin
      // internet), igual dejamos que se comparta el resto de la tarjeta.
      setTimeout(resolve, 4000)
    })
  })

  // Fotos "de recorte" (background-image, ver nota mas arriba): el
  // navegador ya las esta pintando via CSS, pero necesitamos saber cuando
  // el archivo termino de descargar para no capturar antes de tiempo --
  // se precarga la misma URL con un Image() nuevo solo para esperar su
  // evento load/error.
  const bgPromises = bgEls.map((el) => {
    const src = el.getAttribute('data-bg-src')
    if (!src) return Promise.resolve()
    return new Promise((resolve) => {
      const probe = new Image()
      probe.addEventListener('load', resolve, { once: true })
      probe.addEventListener('error', resolve, { once: true })
      probe.src = src
      if (probe.complete && probe.naturalWidth > 0) resolve()
      setTimeout(resolve, 4000)
    })
  })

  return Promise.all(imgPromises.concat(bgPromises))
}

// Fase H: registra en analytics_events que se comparti/descargo la
// tarjeta. No requiere que quien llama pase contexto (participantId,
// sessionId, barId, workspaceId) — si no se pasa, el evento igual se
// guarda, solo queda sin ese detalle adicional.
function trackCardShared(method, ctx) {
  const c = ctx || {}
  trackEvent('card_shared', {
    participantId: c.participantId || null,
    sessionId: c.sessionId || null,
    barId: c.barId || null,
    workspaceId: c.workspaceId || null,
    payload: { method: method, song: c.song || null }
  })
}

// Ancho de exportacion fijo para la tarjeta "Momento Retroke"
// (ShareResultCard): 1080px, que combinado con su aspect-ratio 9:16 fijo
// (.share-card-frame) da siempre 1080x1920 exacto -- el tamaño que pide
// Instagram/TikTok/WhatsApp Stories. Antes se usaba un "scale: 3" fijo, que
// dependia del ancho RESPONSIVE en el que estuviera renderizada la tarjeta
// en ese momento (celular chico vs. celular grande vs. el preview de
// escritorio en /r/:id, que tiene max-width:440px pero puede ser mas
// angosto en pantallas chicas) -- eso daba un PNG de tamaño distinto cada
// vez. Ahora el escalado se calcula segun el ancho REAL ya renderizado del
// nodo (node.offsetWidth), para que el resultado sea siempre exactamente
// EXPORT_WIDTH de ancho sin importar el viewport.
const EXPORT_WIDTH = 1080

export async function renderCardToBlob(node, options) {
  if (!node) return { canvas: null, blob: null }
  await waitForImages(node)
  const html2canvas = await loadHtml2Canvas()
  if (!html2canvas) return { canvas: null, blob: null }
  const targetWidth = (options && options.targetWidth) || EXPORT_WIDTH
  const renderedWidth = node.offsetWidth || 440
  const scale = targetWidth / renderedWidth
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    scale: scale,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 5000
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return { canvas, blob }
}

export async function downloadCardAsImage(node, filename, ctx) {
  const { canvas } = await renderCardToBlob(node)
  if (!canvas) return { error: 'No se pudo generar la imagen' }
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename || 'retroke-resultado.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  trackCardShared('download', ctx)
  return { method: 'download' }
}

export async function shareCardAsImage(node, { filename, title, text, ctx } = {}) {
  if (!node) return { error: 'No hay tarjeta para compartir' }
  try {
    const { canvas, blob } = await renderCardToBlob(node)
    if (!blob) return { error: 'No se pudo generar la imagen' }
    const file = new File([blob], filename || 'retroke-resultado.png', { type: 'image/png' })
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: title || 'Retroke', text: text || '' })
      trackCardShared('share-image', ctx)
      return { method: 'share-image' }
    }
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename || 'retroke-resultado.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    trackCardShared('download', ctx)
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

export async function shareResult({ performanceId, song, artistName, notaFinal, ctx }) {
  const url = buildShareUrl(performanceId)
  const text = buildShareText({ song, artistName, notaFinal })
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Mi resultado en Retroke', text, url })
      trackCardShared('share-link', Object.assign({ song: song || null }, ctx))
      return { method: 'share' }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text + ' ' + url)
      trackCardShared('clipboard', Object.assign({ song: song || null }, ctx))
      return { method: 'clipboard' }
    }
    return { method: 'none', url }
  } catch (err) {
    if (err && err.name === 'AbortError') return { method: 'cancelled' }
    return { error: err.message || 'No se pudo compartir' }
  }
}
