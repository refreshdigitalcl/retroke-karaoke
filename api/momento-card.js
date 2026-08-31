import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'
import React from 'react'

// Genera la tarjeta "Momento Retroke" como PNG 1080x1920 EN EL SERVIDOR, no
// en el navegador de quien la comparte.
//
// POR QUE EXISTE ESTE ARCHIVO (no es una mejora cosmetica, es un cambio de
// mecanismo completo): la version anterior armaba la tarjeta como un <div>
// real en el DOM del celular de la persona y la "fotografiaba" con
// html2canvas antes de guardarla/compartirla. Ese enfoque demostro ser
// estructuralmente fragil -- en pruebas reales, la MISMA pagina con los
// MISMOS datos a veces capturaba perfecto y a veces devolvia un PNG en
// blanco (nada de imagen ni texto, solo el fondo), sin ningun cambio de
// codigo entre un intento y otro. Eso es una condicion de carrera dentro de
// html2canvas (fuentes web, carga de imagenes cross-origin, reflows) que no
// se puede eliminar de forma confiable desde el lado del cliente porque
// depende del navegador/dispositivo de cada persona. Ademas, cada PNG
// exportado asi salia sin ningun perfil de color (sin sRGB), lo que en
// visores estrictos (sobre todo iOS) se veia con los colores apagados.
//
// La solucion de fondo es que el navegador de la persona nunca vuelva a
// "fotografiar" nada: este endpoint arma la imagen entera con Satori
// (@vercel/og) a partir de los datos reales guardados en Supabase, de forma
// 100% deterministica -- mismo resultado siempre, sin depender de fuentes
// tardando en cargar en el celular de nadie. El cliente (shareCard.js) solo
// hace un fetch a esta URL y comparte el archivo que llega.
//
// SIN JSX A PROPOSITO: la primera version de este archivo era .jsx con
// sintaxis JSX normal, pero Vercel no lo reconocio como funcion (el resto
// de api/*.js del proyecto son .js planos) y la ruta caia en el rewrite
// de SPA de vercel.json, devolviendo el index.html de la app en vez de la
// imagen. Se reescribio con React.createElement (alias "e" mas abajo) en
// un archivo .js normal para no depender de que Vercel reconozca .jsx.

const e = React.createElement

const LOGO_URL = 'https://www.retroke.cl/landing/retroke-logo-oficial-neon.png'

const MODE_META = {
  BAR: { icon: '📍', label: 'Retroke Bar' },
  DJ: { icon: '🎧', label: 'Retroke DJ' },
  HOME: { icon: '🏠', label: 'Retroke Home' }
}

// Mismo truco que el cliente (ver ShareResultCard.jsx): la busqueda de
// iTunes devuelve un thumbnail chico (.../60x60bb.jpg) pensado para una
// lista de resultados. Apple sirve el mismo asset en resoluciones mas
// grandes cambiando ese segmento de la URL.
function getHiResArtwork(url) {
  if (!url) return url
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|jpeg|png)(\?.*)?$/i, '/1200x1200bb.$2')
}

function isMemeReaction(value) {
  return typeof value === 'string' && value.indexOf('meme:') === 0
}

function formatCardDate(createdAt) {
  if (!createdAt) return null
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  try {
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch (err) {
    return null
  }
}

// Google Fonts sirve WOFF2 por defecto, pero Satori solo entiende
// ttf/otf/woff. El truco documentado (y usado ampliamente en la comunidad
// de @vercel/og) es pedir el CSS con un User-Agent de navegador viejo --
// asi Google responde con TTF en vez de WOFF2. Se cachea en memoria del
// modulo para no volver a pedirlo en cada invocacion "tibia" de la funcion.
let fontsPromise = null
function loadFonts() {
  if (fontsPromise) return fontsPromise
  fontsPromise = (async () => {
    try {
      const cssUrl = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap'
      const css = await fetch(cssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
        }
      }).then((r) => r.text())
      const blocks = [...css.matchAll(/font-weight:\s*(\d+);[\s\S]*?src:\s*url\(([^)]+)\)/g)]
      const fonts = []
      for (const block of blocks) {
        const weight = Number(block[1])
        const url = block[2]
        const data = await fetch(url).then((r) => r.arrayBuffer())
        fonts.push({ name: 'Space Grotesk', data, weight, style: 'normal' })
      }
      return fonts
    } catch (err) {
      // Si Google Fonts falla, mejor generar la tarjeta con la fuente por
      // defecto de Satori que devolver un error -- una tarjeta con otra
      // tipografia sigue siendo mil veces mejor que ninguna tarjeta.
      return []
    }
  })()
  return fontsPromise
}

async function toDataUri(url, fallbackType) {
  if (!url) return null
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const buf = await resp.arrayBuffer()
    const type = resp.headers.get('content-type') || fallbackType || 'image/png'
    const b64 = Buffer.from(buf).toString('base64')
    return 'data:' + type + ';base64,' + b64
  } catch (err) {
    return null
  }
}

function buildCardElement({ perf, levelName, modeMeta, placeName, dateTxt, topReactions, artworkDataUri, logoDataUri }) {
  const WIDTH = 1080
  const HEIGHT = 1920
  const notaTxt = perf.nota_final !== null && perf.nota_final !== undefined ? Number(perf.nota_final).toFixed(1) : '-'
  const hasVocalScore = perf.vocal_score !== null && perf.vocal_score !== undefined
  const hasReactions = topReactions.length > 0

  const heroChildren = []
  if (artworkDataUri) {
    heroChildren.push(
      e('img', {
        key: 'artwork',
        src: artworkDataUri,
        width: WIDTH,
        height: 900,
        style: { position: 'absolute', top: 0, left: 0, objectFit: 'cover' }
      })
    )
  } else {
    heroChildren.push(
      e(
        'div',
        {
          key: 'artwork-fallback',
          style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
        },
        e('div', { style: { display: 'flex', fontSize: 220 } }, '🎵')
      )
    )
  }
  heroChildren.push(
    e('div', {
      key: 'scrim',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'linear-gradient(180deg, rgba(10,5,18,0.62) 0%, rgba(10,5,18,0.08) 28%, rgba(10,5,18,0.16) 58%, rgba(10,5,18,0.88) 100%)'
      }
    })
  )
  heroChildren.push(
    e(
      'div',
      { key: 'logo-wrap', style: { position: 'absolute', top: 55, left: 0, width: '100%', display: 'flex', justifyContent: 'center' } },
      logoDataUri ? e('img', { src: logoDataUri, width: 222, height: 82, style: { objectFit: 'contain' } }) : null
    )
  )

  const nameChildren = [
    e('div', { key: 'name', style: { display: 'flex', fontSize: 76, fontWeight: 800, color: '#fff' } }, perf.singer_name || 'Cantante Retroke')
  ]
  if (levelName) {
    nameChildren.push(
      e(
        'div',
        {
          key: 'level',
          style: {
            display: 'flex',
            marginTop: 18,
            fontSize: 30,
            fontWeight: 600,
            color: '#F4D03F',
            border: '2px solid rgba(244,208,79,0.7)',
            borderRadius: 999,
            padding: '10px 28px',
            backgroundColor: 'rgba(10,6,15,0.55)'
          }
        },
        '🏅 ' + levelName
      )
    )
  }
  heroChildren.push(
    e(
      'div',
      { key: 'name-wrap', style: { position: 'absolute', left: 60, right: 60, bottom: 55, display: 'flex', flexDirection: 'column' } },
      nameChildren
    )
  )

  const hero = e(
    'div',
    { key: 'hero', style: { position: 'relative', display: 'flex', width: '100%', height: 900, backgroundColor: '#150a20' } },
    heroChildren
  )

  const sheetChildren = []
  sheetChildren.push(
    e(
      'div',
      { key: 'song-title', style: { display: 'flex', justifyContent: 'center', fontSize: 46, fontWeight: 800, color: '#fff', textAlign: 'center' } },
      perf.song || 'Canción'
    )
  )
  if (perf.artist_name) {
    sheetChildren.push(
      e(
        'div',
        { key: 'song-artist', style: { display: 'flex', justifyContent: 'center', marginTop: 10, fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.68)' } },
        perf.artist_name
      )
    )
  }

  const resultsChildren = [
    e(
      'div',
      { key: 'nota-col', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: hasReactions || hasVocalScore ? 1.15 : 1 } },
      [
        e('div', { key: 'l', style: { display: 'flex', fontSize: 26, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' } }, '⭐ NOTA'),
        e('div', { key: 'v', style: { display: 'flex', marginTop: 8, fontSize: 108, fontWeight: 700, color: '#F4D03F' } }, notaTxt)
      ]
    )
  ]
  if (hasReactions) {
    resultsChildren.push(e('div', { key: 'div1', style: { display: 'flex', width: 3, backgroundColor: 'rgba(255,255,255,0.16)' } }))
    resultsChildren.push(
      e(
        'div',
        { key: 'reactions-col', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 } },
        [
          e('div', { key: 'l', style: { display: 'flex', fontSize: 26, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' } }, '🔥 REACCIONES'),
          e(
            'div',
            { key: 'v', style: { display: 'flex', marginTop: 14, fontSize: 58, letterSpacing: 8 } },
            topReactions.map((r) => r.emoji).join(' ')
          )
        ]
      )
    )
  } else if (hasVocalScore) {
    resultsChildren.push(e('div', { key: 'div1', style: { display: 'flex', width: 3, backgroundColor: 'rgba(255,255,255,0.16)' } }))
    resultsChildren.push(
      e(
        'div',
        { key: 'retroke-col', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 } },
        [
          e('div', { key: 'l', style: { display: 'flex', fontSize: 24, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' } }, '🎤 RETROKE SCORE'),
          e('div', { key: 'v', style: { display: 'flex', marginTop: 8, fontSize: 54, fontWeight: 700, color: '#E91E8C' } }, perf.vocal_score + '/100')
        ]
      )
    )
  }
  sheetChildren.push(
    e(
      'div',
      {
        key: 'results',
        style: {
          display: 'flex',
          marginTop: 55,
          borderRadius: 46,
          border: '4px solid rgba(244,208,79,0.5)',
          background: 'linear-gradient(135deg, rgba(58,20,60,0.95), rgba(40,16,58,0.95))',
          padding: '50px 30px',
          alignItems: 'stretch',
          justifyContent: 'center'
        }
      },
      resultsChildren
    )
  )

  if (modeMeta) {
    const chipChildren = [
      e(
        'div',
        { key: 'meta', style: { display: 'flex', fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.85)' } },
        modeMeta.icon + ' ' + modeMeta.label
      )
    ]
    if (placeName) {
      chipChildren.push(e('div', { key: 'sep1', style: { display: 'flex', width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)' } }))
      chipChildren.push(e('div', { key: 'place', style: { display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.55)' } }, placeName))
    }
    if (dateTxt) {
      chipChildren.push(e('div', { key: 'sep2', style: { display: 'flex', width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)' } }))
      chipChildren.push(e('div', { key: 'date', style: { display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.55)' } }, dateTxt))
    }
    sheetChildren.push(
      e(
        'div',
        {
          key: 'mode-chip',
          style: {
            display: 'flex',
            marginTop: 55,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.14)',
            padding: '26px 50px'
          }
        },
        chipChildren
      )
    )
  }

  sheetChildren.push(
    e(
      'div',
      { key: 'footer', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', paddingTop: 55 } },
      [
        e('div', { key: 'f1', style: { display: 'flex', fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.75)' } }, 'El karaoke cambió para siempre.'),
        e('div', { key: 'f2', style: { display: 'flex', marginTop: 6, fontSize: 28, color: 'rgba(255,255,255,0.42)' } }, 'retroke.cl')
      ]
    )
  )

  const sheet = e(
    'div',
    { key: 'sheet', style: { position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, padding: '55px 70px', backgroundColor: '#0a0512' } },
    sheetChildren
  )

  return e(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0512',
        border: '7px solid #E91E8C',
        borderRadius: 72,
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'Space Grotesk'
      }
    },
    [hero, sheet]
  )
}

export default async function handler(req, res) {
  const performanceId = req.query && req.query.id
  if (!performanceId) {
    res.status(400).json({ error: 'Falta el id de la presentacion' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://koaayhnqgcyemnzkzffq.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    res.status(500).json({ error: 'El servidor todavia no tiene configuradas las credenciales de Supabase.' })
    return
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: perf, error: perfError } = await supabase
    .from('performances')
    .select('*')
    .eq('id', performanceId)
    .maybeSingle()

  if (perfError || !perf) {
    res.status(404).json({ error: 'No encontramos esa presentacion' })
    return
  }

  // Mismo criterio que SharePerformance.jsx (pagina publica /r/:id): un bar
  // fisico siempre es modo BAR; sin bar_id pero con workspace_id, el tipo
  // real (DJ u HOME) vive en esa tabla.
  const lookups = await Promise.all([
    perf.participant_id
      ? supabase.from('participant_stats').select('level_name').eq('participant_id', perf.participant_id).maybeSingle()
      : Promise.resolve({ data: null }),
    perf.bar_id
      ? supabase.from('bars').select('name').eq('id', perf.bar_id).maybeSingle()
      : Promise.resolve({ data: null }),
    !perf.bar_id && perf.workspace_id
      ? supabase.from('workspaces').select('name, type').eq('id', perf.workspace_id).maybeSingle()
      : Promise.resolve({ data: null }),
    perf.session_id && perf.queue_entry_id
      ? supabase.from('reactions').select('emoji').eq('session_id', perf.session_id).eq('queue_entry_id', perf.queue_entry_id)
      : Promise.resolve({ data: [] })
  ])

  const levelName = lookups[0].data ? lookups[0].data.level_name : null
  const barName = lookups[1].data ? lookups[1].data.name : null
  const ws = lookups[2].data || null
  const reactionRows = lookups[3].data || []

  // Top 3 emojis mas usados, memes excluidos -- mismo tally que
  // reactionStats.top en DisplayResult.jsx (pantalla de resultado del TV).
  const reactionCounts = {}
  reactionRows.forEach((row) => {
    if (isMemeReaction(row.emoji)) return
    reactionCounts[row.emoji] = (reactionCounts[row.emoji] || 0) + 1
  })
  const topReactions = Object.keys(reactionCounts)
    .map((emoji) => ({ emoji, count: reactionCounts[emoji] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const mode = perf.bar_id ? 'BAR' : (ws ? ws.type : null)
  const placeName = mode === 'HOME' ? 'En casa' : (perf.bar_id ? barName : (ws ? ws.name : null))
  const modeMeta = mode ? MODE_META[mode] : null
  const dateTxt = formatCardDate(perf.created_at)

  const hiResArtwork = getHiResArtwork(perf.artwork_url)

  const [fonts, artworkDataUri, logoDataUri] = await Promise.all([
    loadFonts(),
    toDataUri(hiResArtwork, 'image/jpeg'),
    toDataUri(LOGO_URL, 'image/png')
  ])

  let image
  try {
    image = new ImageResponse(
      buildCardElement({ perf, levelName, modeMeta, placeName, dateTxt, topReactions, artworkDataUri, logoDataUri }),
      {
        width: 1080,
        height: 1920,
        fonts: fonts && fonts.length ? fonts : undefined,
        emoji: 'twemoji'
      }
    )
  } catch (err) {
    res.status(500).json({ error: 'No se pudo generar la imagen', detail: err.message })
    return
  }

  const buffer = Buffer.from(await image.arrayBuffer())
  res.setHeader('Content-Type', 'image/png')
  // Los datos de una presentacion ya terminada no cambian -- se puede
  // cachear agresivamente en el CDN de Vercel sin riesgo de servir algo
  // desactualizado.
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=31536000, immutable')
  res.status(200).send(buffer)
}
