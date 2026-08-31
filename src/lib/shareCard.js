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
// 6. backgroundColor: null (transparente) hace que las 4 esquinas de la
//    tarjeta (que tiene border-radius) salgan con alpha=0 en vez de negro
//    solido. La mayoria de apps lo manejan bien, pero componer un PNG con
//    transparencia real sobre otra superficie (p.ej. el editor de Stories
//    de Instagram) es una variable de mas sin ningun beneficio real acá --
//    la tarjeta nunca se ve sobre otro fondo. Se cambio a un color solido
//    (el mismo fondo de la tarjeta) para eliminar esa fuente de diferencias
//    entre lo que se ve en pantalla y lo que compone cada app al recibir el
//    archivo.
// 7. EL BUG MAS IMPORTANTE, causante de "se descuadra/no funciona al
//    guardar y compartir por Instagram": no era la captura en si (el
//    canvas siempre salia bien, dimensiones correctas, sin errores) sino
//    COMO se entregaba el archivo despues. downloadCardAsImage() usaba un
//    <a download="..." href="data:image/png;base64,..."> -- ese patron NO
//    funciona en Safari/iOS ni en la enorme mayoria de "in-app browsers"
//    (el navegador embebido que abre Instagram/WhatsApp/TikTok cuando el
//    link se toca desde ahi dentro): el atributo "download" se ignora
//    silenciosamente y el navegador simplemente navega al data-URL en vez
//    de guardar nada, y con un PNG de 1080x1920 ese data-URL pesa varios MB
//    en texto base64, lo que en varios WebViews de iOS directamente falla
//    o queda en blanco. La forma robusta -- y la que ahora se usa siempre
//    que esta disponible -- es navigator.share({ files: [...] }) (Web
//    Share API con archivo real, no data-URL): eso abre la hoja de
//    compartir NATIVA del sistema operativo, con Instagram como una opcion
//    directa ahi, y es el mismo mecanismo que usan las apps nativas para
//    "compartir a Stories". El fallback (cuando el navegador no soporta
//    compartir archivos) ahora usa un blob URL (URL.createObjectURL) en
//    vez de un data-URL gigante, mas liviano y mejor soportado.

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
    // Solido, no null -- ver lección 6 arriba. Mismo tono que el fondo real
    // de la tarjeta (.momento-outer / .momento-sheet en ShareResultCard).
    backgroundColor: '#0a0512',
    scale: scale,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 5000
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return { canvas, blob }
}

// Descarga el PNG via blob URL (no data-URL, ver lección 7 arriba). Sigue
// siendo el fallback cuando el navegador no soporta compartir archivos, y
// el metodo directo en escritorio (donde no hay "hoja de compartir" del
// sistema operativo y descargar a la carpeta de Descargas es lo esperado).
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'retroke-resultado.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revocar despues de un tick, no inmediato -- algunos navegadores todavia
  // estan procesando la descarga cuando click() retorna.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export async function downloadCardAsImage(node, filename, ctx) {
  const { blob } = await renderCardToBlob(node)
  if (!blob) return { error: 'No se pudo generar la imagen' }
  downloadBlob(blob, filename)
  trackCardShared('download', ctx)
  return { method: 'download' }
}

// Comparte la tarjeta como imagen real (archivo, no link). En celular esto
// es lo que hace que "guardar y compartir por Instagram" funcione: abre la
// hoja de compartir nativa del sistema con el archivo PNG, e Instagram
// aparece ahi como una opcion que va directo a Stories con la imagen ya
// puesta. Si el navegador no soporta compartir archivos (algunos
// navegadores de escritorio, o alguna version vieja), cae a descargar el
// PNG normal -- y si el share nativo se cancela o falla por cualquier otra
// razon que no sea que el usuario lo cerro (AbortError), tambien cae a
// descargar en vez de simplemente mostrar un error, para que la persona
// siempre se lleve la imagen de una forma u otra.
export async function shareCardAsImage(node, { filename, title, text, ctx } = {}) {
  if (!node) return { error: 'No hay tarjeta para compartir' }
  const { blob } = await renderCardToBlob(node)
  if (!blob) return { error: 'No se pudo generar la imagen' }
  const file = new File([blob], filename || 'retroke-resultado.png', { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: title || 'Retroke', text: text || '' })
      trackCardShared('share-image', ctx)
      return { method: 'share-image' }
    } catch (err) {
      if (err && err.name === 'AbortError') return { method: 'cancelled' }
      // Cualquier otro error del share nativo (poco frecuente, pero pasa
      // en algunos WebViews de Android): no dejamos a la persona sin nada,
      // caemos a descarga normal en vez de devolver error.
    }
  }

  downloadBlob(blob, filename)
  trackCardShared('download', ctx)
  return { method: 'download' }
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
