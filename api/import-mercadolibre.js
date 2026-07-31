// Lee una pagina publica de MercadoLibre y extrae lo que pueda:
// titulo, descripcion, imagenes, precio sugerido y ficha tecnica (specs).
// Es "mejor esfuerzo": MercadoLibre puede cambiar su marcado en cualquier
// momento, asi que el admin siempre puede editar lo importado a mano.

function extractMeta(html, property) {
  var matches = []
  var re = new RegExp('<meta[^>]+property=["\']' + property + '["\'][^>]+content=["\']([^"\']+)["\']', 'gi')
  var m
  while ((m = re.exec(html)) !== null) {
    matches.push(m[1])
  }
  if (matches.length === 0) {
    // A veces el orden de los atributos viene al reves (content antes que property)
    var re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + property + '["\']', 'gi')
    while ((m = re2.exec(html)) !== null) {
      matches.push(m[1])
    }
  }
  return matches
}

function decodeEntities(text) {
  if (!text) return text
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractJsonLd(html) {
  var results = []
  var re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  var m
  while ((m = re.exec(html)) !== null) {
    try {
      var parsed = JSON.parse(m[1])
      results.push(parsed)
    } catch (e) {}
  }
  return results
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
      if (product.image) {
        images = Array.isArray(product.image) ? product.image : [product.image]
      }
      if (product.offers) {
        var offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
        if (offer && offer.price) price = Math.round(Number(offer.price))
      }
      if (Array.isArray(product.additionalProperty)) {
        specs = product.additionalProperty
          .filter(function (p) { return p && p.name && p.value })
          .map(function (p) { return { label: String(p.name), value: String(p.value) } })
          .slice(0, 20)
      }
    }

    if (!name) {
      var titleMatches = extractMeta(html, 'og:title')
      name = titleMatches[0] || ''
    }
    if (!description) {
      var descMatches = extractMeta(html, 'og:description')
      description = descMatches[0] || ''
    }
    if (images.length === 0) {
      images = extractMeta(html, 'og:image')
    }

    name = decodeEntities(name).replace(/\s*\|\s*MercadoLibre.*$/i, '').trim()
    description = decodeEntities(description).trim()
    images = images.slice(0, 8)

    if (!name && images.length === 0) {
      res.status(422).json({ error: 'No logramos leer datos de esa pagina. Puede que MercadoLibre haya bloqueado la lectura automatica — copia los datos a mano.' })
      return
    }

    res.status(200).json({
      name: name,
      description: description,
      images: images,
      price: price,
      specs: specs,
      source_url: url
    })
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer el link', detail: err.message })
  }
}
