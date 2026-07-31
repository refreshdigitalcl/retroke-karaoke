// Lee una pagina publica de MercadoLibre y extrae lo que pueda:
// titulo, descripcion, imagenes, precio sugerido, stock y ficha tecnica
// completa (agrupada por seccion, tal como la muestra MercadoLibre).
// Es "mejor esfuerzo": MercadoLibre puede cambiar su marcado en cualquier
// momento, asi que el admin siempre puede editar lo importado a mano.

function extractMeta(html, property) {
  var matches = []
  var re = new RegExp('<meta[^>]+property=["\']' + property + '["\'][^>]+content=["\']([^"\']+)["\']', 'gi')
  var m
  while ((m = re.exec(html)) !== null) matches.push(m[1])
  if (matches.length === 0) {
    var re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + property + '["\']', 'gi')
    while ((m = re2.exec(html)) !== null) matches.push(m[1])
  }
  return matches
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(text) {
  if (!text) return text
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractJsonLd(html) {
  var results = []
  var re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  var m
  while ((m = re.exec(html)) !== null) {
    try { results.push(JSON.parse(m[1])) } catch (e) {}
  }
  return results
}

// Busca la tabla de "Caracteristicas del producto" y saca cada fila como
// { label, value, group }. group es el titulo de seccion mas cercano
// (ej: "Sonido", "Bateria") para que la ficha se vea igual de completa
// que en MercadoLibre.
function extractSpecsFromHtml(html) {
  var specsSection = html
  var startIdx = html.search(/Caracter[ií]sticas del producto/i)
  if (startIdx !== -1) {
    // Recortamos ~60.000 caracteres despues del titulo: suficiente para
    // cubrir todas las tablas de specs sin arrastrar productos relacionados
    // que aparecen mucho mas abajo en la pagina.
    specsSection = html.slice(startIdx, startIdx + 60000)
  }

  var specs = []
  var currentGroup = ''
  var seen = {}

  // Titulos de seccion tipo <h3 class="...">Sonido</h3>
  // Filas tipo <tr ...><th ...>Marca</th><td ...>Blik</td></tr>
  // o <tr ...><td ...>Marca</td><td ...>Blik</td></tr>
  var blockRe = /<h[23][^>]*>([^<]{2,60})<\/h[23]>|<tr[^>]*>\s*<t[hd][^>]*>([\s\S]{1,300}?)<\/t[hd]>\s*<td[^>]*>([\s\S]{1,300}?)<\/td>\s*<\/tr>/gi
  var m
  while ((m = blockRe.exec(specsSection)) !== null && specs.length < 60) {
    if (m[1]) {
      currentGroup = decodeEntities(stripTags(m[1]))
      continue
    }
    var label = decodeEntities(stripTags(m[2] || ''))
    var value = decodeEntities(stripTags(m[3] || ''))
    if (!label || !value) continue
    if (label.length > 60 || value.length > 200) continue
    var key = currentGroup + '|' + label
    if (seen[key]) continue
    seen[key] = true
    specs.push({ label: label, value: value, group: currentGroup || null })
  }

  return specs
}

// Trata de determinar si el vendedor tiene stock, mirando disponibilidad
// estructurada primero y, si no hay, buscando frases comunes en la pagina.
function extractStock(html, jsonLdProduct) {
  if (jsonLdProduct && jsonLdProduct.offers) {
    var offer = Array.isArray(jsonLdProduct.offers) ? jsonLdProduct.offers[0] : jsonLdProduct.offers
    if (offer && offer.availability) {
      var avail = String(offer.availability).toLowerCase()
      if (avail.indexOf('outofstock') !== -1 || avail.indexOf('out_of_stock') !== -1) return false
      if (avail.indexOf('instock') !== -1 || avail.indexOf('in_stock') !== -1) return true
    }
  }
  if (/stock\s+disponible/i.test(html)) return true
  if (/producto\s+agotado|sin\s+stock/i.test(html)) return false
  return true
}

// Las fotos de MercadoLibre se sirven desde su CDN (http2.mlstatic.com).
// Tomamos todas las que aparezcan en calidad alta, sin duplicados.
function extractGalleryImages(html) {
  var found = []
  var seen = {}
  var re = /https:\/\/http2\.mlstatic\.com\/[A-Za-z0-9_\-\/.]+\.(?:jpg|jpeg|png|webp)/gi
  var m
  while ((m = re.exec(html)) !== null) {
    var url = m[0]
    // Preferimos la version grande (_2X_) cuando exista, evitamos iconos chicos
    if (/-S\.(jpg|jpeg|png|webp)$/i.test(url)) continue
    var dedupeKey = url.replace(/-[A-Z]\.(jpg|jpeg|png|webp)$/i, '')
    if (seen[dedupeKey]) continue
    seen[dedupeKey] = true
    found.push(url)
  }
  return found
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' })
    return
  }

  var url = req.body && req.body.url
  if (!url || url.indexOf('mercadolibre') === -1) {
    res.status(400).json({ error: 'Pega un link valido de MercadoLibre' })
    return
  }

  try {
    var response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      res.status(400).json({ error: 'No pudimos abrir ese link (código ' + response.status + ')' })
      return
    }

    var html = await response.text()

    var jsonLdEntries = extractJsonLd(html)
    var product = jsonLdEntries.find(function (entry) {
      return entry && (entry['@type'] === 'Product' || (Array.isArray(entry['@type']) && entry['@type'].indexOf('Product') !== -1))
    })

    var name = ''
    var description = ''
    var images = []
    var price = null
    var specs = []

    if (product) {
      name = product.name || ''
      description = product.description || ''
      if (product.image) images = Array.isArray(product.image) ? product.image : [product.image]
      if (product.offers) {
        var offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
        if (offer && offer.price) price = Math.round(Number(offer.price))
      }
      if (Array.isArray(product.additionalProperty)) {
        specs = product.additionalProperty
          .filter(function (p) { return p && p.name && p.value })
          .map(function (p) { return { label: String(p.name), value: String(p.value), group: null } })
      }
    }

    if (!name) name = decodeEntities(extractMeta(html, 'og:title')[0] || '')
    if (!description) description = decodeEntities(extractMeta(html, 'og:description')[0] || '')

    // Ficha tecnica completa desde el HTML (mas rica que additionalProperty,
    // trae las secciones tal cual las agrupa MercadoLibre).
    var htmlSpecs = extractSpecsFromHtml(html)
    if (htmlSpecs.length > specs.length) specs = htmlSpecs

    // Imagenes: juntamos las del JSON-LD con las que encontremos en el HTML,
    // priorizando calidad y sacando duplicados.
    var galleryImages = extractGalleryImages(html)
    var allImages = images.concat(galleryImages)
    var dedupedImages = []
    var seenImg = {}
    allImages.forEach(function (img) {
      var key = img.split('?')[0].replace(/-[A-Z]\.(jpg|jpeg|png|webp)$/i, '')
      if (seenImg[key]) return
      seenImg[key] = true
      dedupedImages.push(img)
    })

    var inStock = extractStock(html, product)

    name = name.replace(/\s*\|\s*MercadoLibre.*$/i, '').trim()
    description = description.trim()
    dedupedImages = dedupedImages.slice(0, 10)

    if (!name && dedupedImages.length === 0) {
      res.status(422).json({ error: 'No logramos leer datos de esa pagina. Puede que MercadoLibre haya bloqueado la lectura automatica — copia los datos a mano.' })
      return
    }

    res.status(200).json({
      name: name,
      description: description,
      images: dedupedImages,
      price: price,
      specs: specs.slice(0, 40),
      in_stock: inStock,
      source_url: url
    })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer el link', detail: err.message })
  }
}
