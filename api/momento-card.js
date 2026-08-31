import { createRequire } from 'node:module'
import path from 'node:path'

// FIX CRITICO (causaba el 500 "Dynamic require of fs is not supported" /
// luego "__dirname is not defined" en produccion, confirmado con los logs
// reales de Vercel): @vercel/og trae empaquetada una version vieja de
// harfbuzzjs (usada por Satori para dar forma al texto) que asume que se
// ejecuta en CommonJS -- usa "require", "__filename" y "__dirname" como si
// fueran globals ambiente. Este proyecto usa ESM real ("type":"module" en
// package.json), donde esos tres NO existen, asi que @vercel/og se caia
// apenas se importaba (antes de que se llegue a pedir ninguna tarjeta).
// La solucion estandar de Node para consumir un paquete asi desde ESM es
// "poliyenar" esos tres globals ANTES de importar el paquete. __dirname se
// apunta a la carpeta real de harfbuzzjs (ahi vive hb.wasm, que el paquete
// intenta leer con esa ruta) resuelta dinamicamente con require.resolve
// para que funcione sin importar donde Vercel copie node_modules.
const require = createRequire(import.meta.url)
const harfbuzzDir = path.dirname(require.resolve('harfbuzzjs/package.json'))
globalThis.require = require
globalThis.__filename = path.join(harfbuzzDir, 'hb.js')
globalThis.__dirname = harfbuzzDir

const { ImageResponse } = await import('@vercel/og')
const { createClient } = await import('@supabase/supabase-js')
const React = (await import('react')).default
const { getGlobalXpRank } = await import('../src/lib/ranking.js')
const { loadFollowCounts } = await import('../src/lib/follows.js')

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
//
// FIX: antes solo se pedian los pesos 700/800 -- todo el texto que usa
// fontWeight 400 (los labels chicos "NOTA"/"REACCIONES"/"RETROKE SCORE",
// sin peso explicito) o 600 (nivel, artista, pie de pagina, seguidores/
// seguidos) no tenia ninguna variante cargada para Satori, asi que caia a
// la tipografia generica de respaldo -- eso era el "cambia la fuente y se
// ve mas simple" que se notaba en la tarjeta exportada vs. el preview del
// navegador (donde el navegador SI puede sintetizar/aproximar el peso de
// un webfont ya cargado). Se piden los 4 pesos que realmente usa la
// tarjeta para que cada texto tenga su variante real.
let fontsPromise = null
function loadFonts() {
  if (fontsPromise) return fontsPromise
  fontsPromise = (async () => {
    try {
      const cssUrl = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&display=swap'
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

// Pill redondeada reutilizada para el puesto/seguidores/seguidos (mismo
// lenguaje visual que el chip de nivel y el chip de modo/lugar de mas
// abajo) y para el numero de reacciones. Satori no soporta mezclar
// tamaños/pesos distintos dentro de un mismo nodo de texto de forma
// confiable, asi que cada pill es un div de flujo propio.
function pill({ key, text, color, bg, border, fontSize }) {
  return e(
    'div',
    {
      key,
      style: {
        display: 'flex',
        fontSize: fontSize || 26,
        fontWeight: 700,
        color: color || '#fff',
        background: bg || 'rgba(255,255,255,0.08)',
        border: '2px solid ' + (border || 'rgba(255,255,255,0.18)'),
        borderRadius: 999,
        padding: '10px 26px',
        whiteSpace: 'nowrap'
      }
    },
    text
  )
}

function buildCardElement({ perf, levelName, modeMeta, placeName, dateTxt, topReactions, totalReactions, artworkDataUri, logoDataUri, avatarEmoji, avatarPhotoDataUri, rank, followCounts }) {
  const WIDTH = 1080
  const HEIGHT = 1920
  const notaTxt = perf.nota_final !== null && perf.nota_final !== undefined ? Number(perf.nota_final).toFixed(1) : '-'
  const hasVocalScore = perf.vocal_score !== null && perf.vocal_score !== undefined
  const hasReactions = topReactions.length > 0
  const hasProfileStats = Boolean(followCounts)

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
  // Dos capas de degrade superpuestas (no una sola) -- mismo truco que el
  // preview del navegador (.momento-hero-scrim + .momento-hero-fade en
  // ShareResultCard.jsx), que se habia perdido en la primera version de
  // este archivo: una capa pareja para que el logo/nombre se lean bien
  // sobre cualquier caratula, y una segunda capa concentrada en el 65%
  // inferior que SI llega a #0a0512 solido justo en el borde del hero --
  // asi la foto se "funde" con la ficha de abajo sin ningun corte visible
  // (el difuminado que se notaba en vivo pero no en la tarjeta exportada).
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
        background: 'linear-gradient(180deg, rgba(10,5,18,0.6) 0%, rgba(10,5,18,0.1) 26%, rgba(10,5,18,0.12) 58%, rgba(10,5,18,0.4) 100%)'
      }
    })
  )
  heroChildren.push(
    e('div', {
      key: 'fade',
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '65%',
        display: 'flex',
        background: 'linear-gradient(180deg, rgba(10,5,18,0) 0%, rgba(10,5,18,0.55) 45%, #0a0512 100%)'
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

  // Avatar chico junto al nombre -- foto real de perfil si existe, si no
  // el emoji de perfil. Mismo anillo de "flujo de colores" que el borde
  // exterior de la tarjeta (ver el wrapper que arma el handler mas abajo)
  // y que el avatar de DisplayCalled.jsx ("Prepárate para cantar") --
  // aca fijo, sin animar, porque Satori genera una imagen estatica.
  // Satori no soporta mask-composite, asi que el anillo se logra con el
  // truco de dos capas: el div de afuera pinta el degrade completo, el de
  // adentro (mas chico, por el padding) tapa el centro con un color solido.
  const AVATAR_SIZE = 148
  const AVATAR_RING = 7
  const avatarInner = avatarPhotoDataUri
    ? e('img', {
        src: avatarPhotoDataUri,
        width: AVATAR_SIZE - AVATAR_RING * 2,
        height: AVATAR_SIZE - AVATAR_RING * 2,
        style: { objectFit: 'cover', borderRadius: 999 }
      })
    : e(
        'div',
        {
          style: {
            display: 'flex',
            width: AVATAR_SIZE - AVATAR_RING * 2,
            height: AVATAR_SIZE - AVATAR_RING * 2,
            borderRadius: 999,
            backgroundColor: '#150a20',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64
          }
        },
        avatarEmoji || '🎤'
      )
  const avatarWrap = e(
    'div',
    {
      key: 'avatar',
      style: {
        display: 'flex',
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: 999,
        padding: AVATAR_RING,
        boxSizing: 'border-box',
        background: 'linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C)',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
    e(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          borderRadius: 999,
          backgroundColor: '#150a20',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center'
        }
      },
      avatarInner
    )
  )

  const levelPill = levelName
    ? e(
        'div',
        {
          key: 'level',
          style: {
            display: 'flex',
            fontSize: 26,
            fontWeight: 600,
            color: '#F4D03F',
            border: '2px solid rgba(244,208,79,0.7)',
            borderRadius: 999,
            padding: '8px 24px',
            backgroundColor: 'rgba(10,6,15,0.55)'
          }
        },
        '🏅 ' + levelName
      )
    : null

  // Puesto en el ranking global + seguidores/seguidos -- mismos datos y
  // mismo criterio de "nunca inventar" que el perfil real (Profile.jsx):
  // si followCounts es null (sin participant_id, ej. presentacion muy
  // vieja) este bloque no aparece. Distribucion pedida: seguidores/
  // seguidos a la misma altura que la categoria (nivel), y el puesto
  // debajo de la categoria.
  const rankPill = rank
    ? pill({ key: 'rank', text: '🏆 #' + rank.rank + ' en Retroke', color: '#F4D03F', bg: 'rgba(244,208,63,0.16)', border: 'rgba(244,208,63,0.5)', fontSize: 24 })
    : null
  const followPills = hasProfileStats
    ? [
        pill({ key: 'followers', text: '👥 ' + followCounts.followers + ' seguidores', fontSize: 24 }),
        pill({ key: 'following', text: '➕ ' + followCounts.following + ' seguidos', fontSize: 24 })
      ]
    : null

  const NAME_COL_INDENT = AVATAR_SIZE + 24
  const metaRows = []
  if (levelPill || followPills) {
    metaRows.push(
      e(
        'div',
        { key: 'meta-row', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginLeft: NAME_COL_INDENT } },
        [
          levelPill || e('div', { key: 'spacer' }),
          followPills ? e('div', { key: 'follows', style: { display: 'flex', flexDirection: 'row', gap: 12 } }, followPills) : null
        ].filter(Boolean)
      )
    )
  }
  if (rankPill) {
    metaRows.push(
      e(
        'div',
        { key: 'rank-row', style: { display: 'flex', marginTop: 12, marginLeft: NAME_COL_INDENT } },
        rankPill
      )
    )
  }

  heroChildren.push(
    e(
      'div',
      { key: 'name-wrap', style: { position: 'absolute', left: 60, right: 60, bottom: 55, display: 'flex', flexDirection: 'column' } },
      [
        e(
          'div',
          { key: 'name-top', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 } },
          [avatarWrap, e('div', { key: 'name', style: { display: 'flex', fontSize: 60, fontWeight: 800, color: '#fff' } }, perf.singer_name || 'Cantante Retroke')]
        ),
        ...metaRows
      ]
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
        e('div', { key: 'l', style: { display: 'flex', fontSize: 26, fontWeight: 400, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' } }, '⭐ NOTA'),
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
          e('div', { key: 'l', style: { display: 'flex', fontSize: 26, fontWeight: 400, letterSpacing: 3, color: 'rgba(255,255,255,0.55)' } }, '🔥 REACCIONES'),
          e(
            'div',
            { key: 'v', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 16 } },
            [
              e('div', { key: 'emojis', style: { display: 'flex', fontSize: 58, letterSpacing: 8 } }, topReactions.map((r) => r.emoji).join(' ')),
              totalReactions > 0
                ? e('div', { key: 'count', style: { display: 'flex', fontSize: 42, fontWeight: 800, color: 'rgba(255,255,255,0.72)' } }, String(totalReactions))
                : null
            ].filter(Boolean)
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
          e('div', { key: 'l', style: { display: 'flex', fontSize: 24, fontWeight: 400, letterSpacing: 2, color: 'rgba(255,255,255,0.55)' } }, '🎤 RETROKE SCORE'),
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
      chipChildren.push(e('div', { key: 'place', style: { display: 'flex', fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.55)' } }, placeName))
    }
    if (dateTxt) {
      chipChildren.push(e('div', { key: 'sep2', style: { display: 'flex', width: 8, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)' } }))
      chipChildren.push(e('div', { key: 'date', style: { display: 'flex', fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.55)' } }, dateTxt))
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
        e('div', { key: 'f2', style: { display: 'flex', marginTop: 6, fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.42)' } }, 'retroke.cl')
      ]
    )
  )

  const sheet = e(
    'div',
    { key: 'sheet', style: { position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, padding: '55px 70px', backgroundColor: '#0a0512' } },
    sheetChildren
  )

  // Borde exterior: antes rosa solido de 7px, ahora el mismo "anillo de
  // flujo de colores" que el avatar de arriba y que el avatar de
  // DisplayCalled.jsx. Mismo truco de dos capas (Satori no soporta
  // mask-composite): un wrapper exterior pinta el degrade completo con
  // padding = grosor del borde, y el contenido real va en un div interior
  // con fondo solido que tapa todo menos ese borde.
  const cardInner = e(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0512',
        borderRadius: 65,
        boxSizing: 'border-box',
        overflow: 'hidden'
      }
    },
    [hero, sheet]
  )

  return e(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        padding: 7,
        boxSizing: 'border-box',
        borderRadius: 72,
        background: 'linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C)',
        fontFamily: 'Space Grotesk'
      }
    },
    cardInner
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
      ? supabase.from('participant_stats').select('level_name, xp').eq('participant_id', perf.participant_id).maybeSingle()
      : Promise.resolve({ data: null }),
    perf.bar_id
      ? supabase.from('bars').select('name').eq('id', perf.bar_id).maybeSingle()
      : Promise.resolve({ data: null }),
    !perf.bar_id && perf.workspace_id
      ? supabase.from('workspaces').select('name, type').eq('id', perf.workspace_id).maybeSingle()
      : Promise.resolve({ data: null }),
    perf.session_id && perf.queue_entry_id
      ? supabase.from('reactions').select('emoji').eq('session_id', perf.session_id).eq('queue_entry_id', perf.queue_entry_id)
      : Promise.resolve({ data: [] }),
    perf.participant_id
      ? supabase.from('participants').select('avatar, photo_url').eq('id', perf.participant_id).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  const levelName = lookups[0].data ? lookups[0].data.level_name : null
  const xp = lookups[0].data ? lookups[0].data.xp : 0
  const barName = lookups[1].data ? lookups[1].data.name : null
  const ws = lookups[2].data || null
  const reactionRows = lookups[3].data || []
  const avatarEmoji = lookups[4].data ? lookups[4].data.avatar : null
  const avatarPhotoUrl = lookups[4].data ? lookups[4].data.photo_url : null

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
  const totalReactions = reactionRows.filter((row) => !isMemeReaction(row.emoji)).length

  const mode = perf.bar_id ? 'BAR' : (ws ? ws.type : null)
  const placeName = mode === 'HOME' ? 'En casa' : (perf.bar_id ? barName : (ws ? ws.name : null))
  const modeMeta = mode ? MODE_META[mode] : null
  const dateTxt = formatCardDate(perf.created_at)

  const hiResArtwork = getHiResArtwork(perf.artwork_url)

  // Puesto en el ranking global y seguidores/seguidos reales -- mismo
  // criterio de "nunca inventar" que el resto de la app: si no hay
  // participant_id, ambos quedan null y la tarjeta no muestra ese bloque.
  const [fonts, artworkDataUri, logoDataUri, avatarPhotoDataUri, rank, followCounts] = await Promise.all([
    loadFonts(),
    toDataUri(hiResArtwork, 'image/jpeg'),
    toDataUri(LOGO_URL, 'image/png'),
    toDataUri(avatarPhotoUrl, 'image/jpeg'),
    perf.participant_id ? getGlobalXpRank(supabase, xp) : Promise.resolve(null),
    perf.participant_id ? loadFollowCounts(supabase, perf.participant_id) : Promise.resolve(null)
  ])

  let image
  try {
    image = new ImageResponse(
      buildCardElement({ perf, levelName, modeMeta, placeName, dateTxt, topReactions, totalReactions, artworkDataUri, logoDataUri, avatarEmoji, avatarPhotoDataUri, rank, followCounts }),
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
