import { forwardRef } from 'react'
import { useRetrokeFont } from '../lib/fonts'

// Tarjeta "Momento Retroke": la pieza que se ve al terminar de cantar,
// pensada primero para Instagram Stories/TikTok/WhatsApp (formato 9:16),
// no para leerse como un panel de estadisticas. Reutilizada en vivo en
// RegisterForm.jsx (YourTurnScreen y PerformanceShareScreen) y en la
// pagina publica /r/:id (SharePerformance.jsx).
//
// SEGUNDA VUELTA (feedback real sobre la primera version): "todo
// descuadrado, el diseño es muy basico, el logo se ve mal cortado, no es
// responsive, tiene que ser 9:16 obligatorio, la foto en pesima calidad,
// ubica los elementos de forma mas creativa". Se rediseño la composicion
// (ver "Diseño muy basico" mas abajo) y se cambio el mecanismo de 9:16 a
// la tecnica "padding-top: 177.78%" + un hijo con position:absolute que
// llena ese espacio -- PERO esa combinacion causo una regresion peor: con
// TODO el contenido interno en position:absolute, el contenedor
// (`.momento-outer`) quedaba sin ningun contenido de flujo normal del cual
// derivar un ancho, y como esta tarjeta vive dentro de un contenedor
// `flex flex-col items-center` (RegisterForm.jsx/SharePerformance.jsx),
// `align-items:center` hace que el wrapper NO se estire al ancho
// disponible -- se ajusta al contenido. Sin contenido de flujo normal que
// medir, el navegador no tenia de donde sacar un ancho, y "width:100%" de
// un ancho indefinido se resuelve como 0 -> tarjeta colapsada a practicamente
// nada (lo que se vio: un cuadrito rosa solido al compartir, y case nada
// visible en la pagina). Fix DEFINITIVO (dos capas, no una sola):
//   1. Se vuelve a `aspect-ratio: 9/16` (que SI funcionaba para dar tamaño
//      en la v1 -- el problema de la v1 nunca fue el mecanismo de 9:16,
//      fue que el CONTENIDO se pasaba del alto disponible) + `.momento-inner`
//      ahora es un hijo de FLUJO NORMAL (no position:absolute), asi la
//      tarjeta siempre tiene un ancho intrinseco que ofrecer aunque un
//      ancestro futuro vuelva a shrink-to-fit.
//   2. Los 3 lugares que renderizan esta tarjeta (RegisterForm.jsx x2,
//      SharePerformance.jsx) ahora envuelven `<ShareResultCard>` en un div
//      con `w-full max-w-sm` explicito, para que nunca dependa de que el
//      contenedor padre decida estirarse o no.
// El contenido de la v2 (mas compacto que la v1: sin subpuntajes ni
// logros, ver "Diseño muy basico") de todos modos entra comodo dentro del
// 9:16 fijo, asi que volver a aspect-ratio no reintroduce el recorte
// original.
//
// 2. "Diseño muy basico" / "mas creativa": la v1 era una columna de cajas
//    redondeadas apiladas (logo, avatar chico, nombre, caja de resultados,
//    fila de cancion) -- se leia como una pantalla de app, no como una
//    pieza para compartir. Ahora la composicion es "HERO + FICHA": la
//    FOTO del cantante ocupa la mitad de arriba a pantalla completa (como
//    una story real), con su nombre superpuesto abajo con degrade oscuro
//    (misma tecnica de fade que el hero de World.jsx), y una "ficha" de
//    vidrio abajo con cancion + resultados + lugar + marca. Si no hay foto
//    (avatar emoji), el hero cae a un fondo con glow y el emoji grande con
//    el mismo anillo de degrade que ya se uso en el avatar/portada.
//
// 3. "Foto en pesima calidad": la foto del cantante se guarda a 240x240
//    (ver resizeToSquareJpeg en RegisterForm.jsx) pensada para un avatar
//    chico de ~90px. Al mostrarla ahora a pantalla completa en el hero
//    (varias veces mas grande) se notaba el escalado. Se subio la
//    resolucion de guardado a 480x480 (RegisterForm.jsx) y aca se agrega
//    una textura de scanlines muy sutil sobre la foto (mismo lenguaje
//    visual que el resto de la app) que disimula el escalado en vez de
//    pelear contra el.
//
// LECCIONES DE HTML2CANVAS QUE NO HAY QUE ROMPER:
// 1. El numero de la nota va en color solido + text-shadow, nunca con la
//    tecnica de texto degradado (-webkit-background-clip: text) — sale
//    cortado/mal ubicado en la imagen final.
// 2. Los <img> tienen que estar cargados antes de capturar (ver
//    waitForImages en shareCard.js).
// 3. Ningun elemento visible usa animation infinita que dependa del
//    momento exacto de captura -- los anillos de degrade quedan con
//    `background-position` fijo, nunca animados.
//
// QUE VERSION SE MUESTRA (Bar / DJ / Home): igual que antes, NO es un
// branching explicito por "mode". Nota Final siempre existe si hubo algun
// dato real, Reacciones se muestra si hubo al menos una reaccion real,
// Retroke Score solo aparece si hubo analisis de voz (exclusivo de Home).
// "mode" y "placeName" solo alimentan el chip de lugar.
//
// TERCERA VUELTA (feedback sobre la v2, ya con el bug de colapso arreglado
// y confirmado en produccion -- ver hilo largo mas abajo, esto es sobre lo
// que vino DESPUES de eso):
// 1. "se descuadra todo al guardar y compartir por Instagram": la tarjeta en
//    si SIEMPRE capturaba bien (dimensiones y contenido correctos, sin
//    errores) -- el problema real estaba en COMO se entregaba el archivo
//    despues de capturarlo, no en este componente. Ver la lección 7 nueva
//    en shareCard.js: el boton de la pagina publica (/r/:id) usaba
//    <a download> con un data-URL, que Safari/iOS y los navegadores
//    embebidos de Instagram/WhatsApp ignoran o rompen. Se cambio a
//    Web Share API con archivo real (navigator.share({files:[...]})) como
//    metodo principal en todos los botones de guardar/compartir.
// 2. "la imagen del avatar es ultra rara / prefiero la caratula del artista
//    en full calidad": se saco la foto del cantante del hero. Ahora el hero
//    es la CARATULA DEL ALBUM (artworkUrl), pedida en alta resolucion (ver
//    getHiResArtwork) en vez del thumbnail chico que devuelve la busqueda
//    de iTunes -- esa caratula es siempre un asset oficial de alta calidad,
//    a diferencia de una foto de celular escalada. El nombre del cantante
//    se mantiene superpuesto abajo del hero (sigue siendo "su" momento).
// 3. "que el logo de Retroke salga en vez del titulo": se saco el texto
//    "Momento Retroke" (pill) y el isotipo de Retroke (ya existia, chico
//    arriba a la izquierda) ahora es la marca principal del hero: mas
//    grande, centrado arriba.
// 4. "las reacciones, que salgan los 3 emojis mas usados": la columna de
//    Reacciones ya no muestra un numero -- muestra los 3 emojis con mas
//    reacciones reales (mismo tally que reactionStats.top en
//    DisplayResult.jsx, memes excluidos). Si no hubo ninguna reaccion, la
//    columna simplemente no aparece (nunca se inventa ni se muestra vacia).
// 5. La fila de cancion (arriba de la nota) ya no repite un thumbnail chico
//    de la caratula (redundante ahora que la caratula ocupa todo el hero) --
//    queda solo titulo + artista en texto, una sola linea con elipsis en
//    vez de "line-clamp" multilinea (mas simple y mas predecible al
//    rasterizar con html2canvas).

// CUARTA VUELTA (ya con el mecanismo de exportacion server-side andando,
// ver api/momento-card.js): "incluir puesto en Retroke + seguidores/
// seguidos junto al nombre, de forma moderna, similar al perfil de
// Retroke" -- se agrega un avatar chico (foto real o emoji, mismos campos
// `avatar`/`photoUrl` que ya existian como prop pero nunca se usaban desde
// el rediseño del hero) con el mismo anillo de degrade que el borde de la
// tarjeta, y a la derecha del nombre un bloque con el puesto (ranking.js)
// y seguidores/seguidos (follows.js) -- mismos datos y mismo criterio de
// "nunca inventar" que ya usa el perfil real. "el borde rosa de hoy, en
// vez de eso los bordes de flujo de colores del avatar de Prepárate para
// Cantar (DisplayCalled.jsx)": el borde solido de 2.5px se reemplaza por
// el mismo truco de padding+mask con el degrade pink/yellow/purple/green,
// fijo (sin animar, porque esto se exporta como imagen estatica). "las
// reacciones deben mostrar tambien el numero, no solo los emojis": se
// agrega el total real (excluyendo memes) junto a los 3 emojis.
const LOGO_SRC = '/landing/retroke-logo-oficial-neon.png'

// La busqueda de iTunes (songLookup.js) devuelve un thumbnail chico
// (.../60x60bb.jpg) pensado para una lista de resultados, no para ocupar
// todo el hero de la tarjeta. Apple sirve el mismo asset en resoluciones
// mas grandes cambiando ese segmento de la URL -- es el mismo truco que ya
// usa el resto de la industria (nunca un recorte/escalado propio, siempre
// el archivo oficial en mejor calidad).
function getHiResArtwork(url) {
  if (!url) return url
  return url.replace(/\/\d+x\d+(bb)?\.(jpg|jpeg|png)(\?.*)?$/i, '/1200x1200bb.$2')
}

const MODE_META = {
  BAR: { icon: '📍', label: 'Retroke Bar' },
  DJ: { icon: '🎧', label: 'Retroke DJ' },
  HOME: { icon: '🏠', label: 'Retroke Home' }
}

function formatCardDate(createdAt) {
  if (!createdAt) return null
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return null
  try {
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch (e) {
    return null
  }
}

const ShareResultCard = forwardRef(function ShareResultCard(
  {
    singerName,
    avatar,
    photoUrl,
    song,
    artistName,
    artworkUrl,
    notaFinal,
    vocalScore,
    confidence,
    levelName,
    rank,
    followCounts,
    mode,
    placeName,
    topReactions,
    totalReactions,
    createdAt
  },
  ref
) {
  useRetrokeFont()

  const notaTxt = notaFinal !== null && notaFinal !== undefined ? Number(notaFinal).toFixed(1) : '-'
  const hasVocalScore = vocalScore !== null && vocalScore !== undefined
  const topReactionsList = Array.isArray(topReactions) ? topReactions : []
  const hasReactions = topReactionsList.length > 0
  const hiResArtwork = getHiResArtwork(artworkUrl)
  // Perfil (avatar chico + puesto/seguidores/seguidos) solo se arma si hay
  // datos reales de seguidores -- si followCounts es null (sin
  // participant_id, ej. presentacion muy vieja/anonima), nunca se inventa
  // "0 seguidores" como si fuera un dato real.
  const hasProfileStats = Boolean(followCounts)

  const resultColumns = [
    { key: 'nota', icon: '⭐', label: 'Nota', value: notaTxt, color: '#F4D03F', big: true },
    hasReactions && {
      key: 'reactions',
      icon: '🔥',
      label: 'Reacciones',
      color: '#8B5CF6',
      emoji: true,
      value: (
        <>
          <span>{topReactionsList.map((r) => r.emoji).join(' ')}</span>
          {typeof totalReactions === 'number' && totalReactions > 0 && (
            <span className="momento-result-count"> {totalReactions}</span>
          )}
        </>
      )
    },
    hasVocalScore && { key: 'retroke', icon: '🎤', label: 'Retroke Score', value: vocalScore + '/100', color: '#E91E8C' }
  ].filter(Boolean)

  const modeMeta = mode ? MODE_META[mode] : null
  const placeTxt = mode === 'HOME' ? 'En casa' : (placeName || null)
  const dateTxt = formatCardDate(createdAt)
  const hasModeChip = Boolean(modeMeta)

  return (
    <div ref={ref} className="momento-outer">
      <style>{`
        /* 9:16 fijo con aspect-ratio (min-width evita el colapso a 0 si
           algun ancestro futuro vuelve a shrink-to-fit el contenedor -- ver
           nota larga arriba). .momento-inner es un hijo de FLUJO NORMAL
           (no position:absolute) para que la tarjeta siempre tenga un
           ancho intrinseco que ofrecer, no solo "100% de lo que sea que
           el padre decida". */
        .momento-outer {
          position: relative;
          width: 100%;
          min-width: 260px;
          max-width: 400px;
          aspect-ratio: 9 / 16;
          border-radius: 28px;
          overflow: hidden;
          border: 2.5px solid transparent;
          background: #0a0512;
          box-sizing: border-box;
        }
        /* Borde exterior de la tarjeta: antes rosa solido, ahora el mismo
           "anillo de flujo de colores" que ya se usaba en el avatar de
           respaldo del hero (y que es el mismo lenguaje visual del anillo
           animado del avatar en la pantalla "Prepárate para cantar",
           DisplayCalled.jsx -- aca queda fijo, sin animar, porque esta
           tarjeta se exporta como imagen estatica). Tecnica padding+mask:
           el gradiente pinta un cuadrado completo, la mascara le quita el
           centro y deja solo el aro del grosor del padding. */
        .momento-outer::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 6;
          border-radius: 28px;
          padding: 2.5px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .momento-inner {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          color: #fff;
          box-sizing: border-box;
        }
        .momento-in {
          animation: momentoIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes momentoIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* HERO: mitad de arriba, la caratula del album a pantalla completa
           en alta calidad (o fallback con nota musical + halo si la
           cancion no tiene caratula). El nombre del cantante se superpone
           abajo con degrade, como una story real -- no una tarjeta de
           datos. El scrim oscuro (.momento-hero-scrim) garantiza que el
           logo y el nombre se lean bien sin importar que tan clara o
           saturada sea la caratula de turno. */
        .momento-hero {
          position: relative;
          flex: 0 0 48%;
          overflow: hidden;
          background: radial-gradient(circle at 50% 38%, #3a1a4a 0%, #150a20 72%);
        }
        .momento-hero-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: 50% 50%;
          background-repeat: no-repeat;
          filter: saturate(1.05) contrast(1.03);
        }
        .momento-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10,5,18,0.6) 0%, rgba(10,5,18,0.1) 26%, rgba(10,5,18,0.12) 58%, rgba(10,5,18,0.4) 100%);
          pointer-events: none;
        }
        .momento-hero-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .momento-hero-avatar-wrap {
          position: relative;
          width: 42%;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .momento-hero-avatar-glow {
          position: absolute;
          inset: -18%;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(233,30,140,0.35) 0%, rgba(139,92,246,0.2) 55%, transparent 78%);
        }
        .momento-hero-avatar-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 4px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          background-position: 32% 50%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .momento-hero-avatar-emoji {
          position: relative;
          font-size: 15vw;
          line-height: 1;
          filter: drop-shadow(0 0 18px rgba(233, 30, 140, 0.7));
        }
        /* Textura muy sutil sobre la foto -- mismo lenguaje visual que el
           resto de la app (scanlines de DisplayCalled.jsx), y de paso
           disimula el escalado si la foto original es chica. */
        .momento-hero-grain {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px);
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        .momento-hero-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 65%;
          background: linear-gradient(to bottom, transparent 0%, rgba(10,5,18,0.55) 45%, #0a0512 100%);
          pointer-events: none;
        }
        /* El isotipo de Retroke ahora es la marca principal del hero (antes
           iba chico arriba a la izquierda, junto a un pill de texto
           "Momento Retroke" que se saco por pedido explicito) -- centrado
           arriba, mas grande. top:10% (no 6%) a proposito: en el editor de
           Stories de Instagram, la franja de arriba de la pantalla suele
           quedar tapada por chrome propio de la app (chip de "Audio
           sugerido", boton de cerrar) -- ese margen extra reduce el choque
           con esa UI que no controlamos. */
        .momento-logo {
          position: absolute;
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          height: 11%;
          max-height: 34px;
          width: auto;
          display: block;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.85));
        }
        .momento-name-wrap {
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: 6%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .momento-name-left {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        /* Fila del medio: la categoria (nivel) a la izquierda y seguidores/
           seguidos a la derecha, a la MISMA altura -- y debajo, el puesto
           en el ranking. Ambas filas se indentan lo mismo que ocupa el
           avatar+gap para quedar alineadas bajo el nombre, no bajo el
           avatar. */
        .momento-meta-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-left: 54px;
          min-width: 0;
        }
        .momento-rank-row {
          display: flex;
          margin-left: 54px;
        }
        .momento-follow-group {
          display: flex;
          flex-direction: row;
          gap: 6px;
          flex-shrink: 0;
        }
        .momento-name-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          min-width: 0;
        }
        .momento-name {
          font-size: clamp(22px, 8vw, 34px);
          font-weight: 800;
          line-height: 1.08;
          text-shadow: 0 2px 14px rgba(0,0,0,0.75);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        .momento-level {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 12px;
          border-radius: 999px;
          border: 1px solid rgba(244, 208, 79, 0.7);
          color: #F4D03F;
          background: rgba(10,6,15,0.55);
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        /* Avatar chico junto al nombre -- perfil real del cantante (foto o
           emoji), no la caratula del hero. Mismo anillo de flujo de
           colores que el borde exterior de la tarjeta y que el avatar de
           DisplayCalled.jsx, a esta escala mas chica. */
        .momento-mini-avatar-wrap {
          position: relative;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
        }
        .momento-mini-avatar-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          padding: 2.5px;
          box-sizing: border-box;
          background: linear-gradient(120deg, #E91E8C, #F4D03F, #8B5CF6, #7ED957, #E91E8C);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .momento-mini-avatar-inner {
          position: absolute;
          inset: 2.5px;
          border-radius: 9999px;
          overflow: hidden;
          background: #150a20;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .momento-mini-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .momento-mini-avatar-emoji {
          font-size: 20px;
          line-height: 1;
        }
        /* Puesto / seguidores / seguidos -- mismos datos que el perfil real
           de Retroke (Profile.jsx). Nunca se inventa un numero: si
           followCounts es null, este bloque entero no se renderiza (ver
           hasProfileStats). Pedido: seguidores/seguidos a la altura de la
           categoria (nivel), el puesto debajo -- ver .momento-meta-row /
           .momento-rank-row mas arriba. */
        .momento-stat-rank {
          font-size: 9.5px;
          font-weight: 700;
          color: #F4D03F;
          background: rgba(244,208,63,0.16);
          border: 1px solid rgba(244,208,63,0.45);
          border-radius: 999px;
          padding: 2px 9px;
          white-space: nowrap;
        }
        .momento-stat-follow {
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          padding: 2px 9px;
          white-space: nowrap;
        }

        /* FICHA: mitad de abajo, panel de vidrio con la cancion y los
           resultados. margin-top:auto en el pie asegura que siempre quede
           pegado abajo, sin importar cuanto contenido real haya arriba. */
        .momento-sheet {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 4% 6% 5%;
          background: #0a0512;
          min-height: 0;
          overflow: hidden;
        }
        /* Fila de cancion: ya no lleva un thumbnail chico de la caratula
           (redundante -- la caratula en alta calidad ya ocupa todo el
           hero arriba). Solo texto, centrado, una linea con elipsis --
           mas simple y mas predecible al rasterizar con html2canvas que
           el "line-clamp" multilinea que se usaba antes. */
        .momento-song {
          flex-shrink: 0;
          text-align: center;
          min-width: 0;
        }
        .momento-song-title {
          font-size: 16px;
          font-weight: 800;
          line-height: 1.25;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .momento-song-artist {
          margin-top: 3px;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.68);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .momento-results {
          margin-top: 4%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5% 3%;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(58,20,60,0.9), rgba(40,16,58,0.9));
          border: 1.5px solid rgba(244,208,79,0.5);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .momento-result-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .momento-result-col.is-big {
          flex: 1.15;
        }
        .momento-result-divider {
          width: 1px;
          align-self: stretch;
          margin: 0 3px;
          background: rgba(255,255,255,0.16);
        }
        .momento-result-label {
          font-size: 8.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .momento-result-value {
          font-weight: 700;
          line-height: 1.05;
        }
        .momento-result-value.is-big {
          font-size: clamp(28px, 9vw, 38px);
        }
        .momento-result-value.is-small {
          font-size: clamp(15px, 4.6vw, 19px);
        }
        /* Reacciones: los 3 emojis mas usados, no un numero -- los emoji ya
           traen su propio color (el navegador los dibuja como glifos a
           color sin importar el "color" CSS), asi que aca solo se ajusta
           el tamaño, sin heredar el color/text-shadow de la columna. */
        .momento-result-value.is-emoji {
          font-size: 19px;
          letter-spacing: 3px;
        }
        .momento-result-count {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0;
          color: rgba(255,255,255,0.78);
          vertical-align: middle;
        }
        .momento-confidence {
          margin-top: 6px;
          font-size: 9.5px;
          color: rgba(255,255,255,0.5);
          text-align: center;
        }

        .momento-mode-chip {
          margin-top: 4%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 2% 4%;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
          flex-shrink: 0;
        }
        .momento-mode-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.85);
          white-space: nowrap;
        }
        .momento-mode-sep {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .momento-mode-sub {
          font-size: 10.5px;
          color: rgba(255,255,255,0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .momento-footer {
          margin-top: auto;
          padding-top: 4%;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.75);
          text-align: center;
          flex-shrink: 0;
        }
        .momento-footer-sub {
          margin-top: 2px;
          font-size: 9.5px;
          color: rgba(255,255,255,0.42);
        }
      `}</style>

      <div className="momento-inner momento-in">
        <div className="momento-hero">
          {hiResArtwork ? (
            <div
              className="momento-hero-photo"
              role="img"
              aria-label={song || ''}
              data-bg-src={hiResArtwork}
              style={{ backgroundImage: 'url(' + hiResArtwork + ')' }}
            />
          ) : (
            <div className="momento-hero-fallback">
              <div className="momento-hero-avatar-wrap">
                <div className="momento-hero-avatar-glow" />
                <div className="momento-hero-avatar-emoji">🎵</div>
                <div className="momento-hero-avatar-ring" />
              </div>
            </div>
          )}
          <div className="momento-hero-scrim" />
          <div className="momento-hero-grain" />
          <div className="momento-hero-fade" />
          <img src={LOGO_SRC} alt="Retroke" className="momento-logo" />
          <div className="momento-name-wrap">
            <div className="momento-name-left">
              <div className="momento-mini-avatar-wrap">
                <div className="momento-mini-avatar-ring" />
                <div className="momento-mini-avatar-inner">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="momento-mini-avatar-img" />
                  ) : (
                    <span className="momento-mini-avatar-emoji">{avatar || '🎤'}</span>
                  )}
                </div>
              </div>
              <div className="momento-name">{singerName || 'Cantante Retroke'}</div>
            </div>
            {(levelName || hasProfileStats) && (
              <div className="momento-meta-row">
                {levelName ? <div className="momento-level">🏅 {levelName}</div> : <span />}
                {hasProfileStats && (
                  <div className="momento-follow-group">
                    <div className="momento-stat-follow">{followCounts.followers} seguidores</div>
                    <div className="momento-stat-follow">{followCounts.following} seguidos</div>
                  </div>
                )}
              </div>
            )}
            {rank && (
              <div className="momento-rank-row">
                <div className="momento-stat-rank">🏆 #{rank.rank} en Retroke</div>
              </div>
            )}
          </div>
        </div>

        <div className="momento-sheet">
          <div className="momento-song">
            <div className="momento-song-title">{song || 'Canción'}</div>
            {artistName && <div className="momento-song-artist">{artistName}</div>}
          </div>

          <div className="momento-results">
            {resultColumns.map((col, i) => (
              <div key={col.key} className={'momento-result-col' + (col.big ? ' is-big' : '')} style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', flex: col.big ? 1.15 : 1 }}>
                {i > 0 && <div className="momento-result-divider" />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div className="momento-result-label">{col.icon} {col.label}</div>
                  <div
                    className={'momento-result-value ' + (col.emoji ? 'is-emoji' : col.big ? 'is-big' : 'is-small')}
                    style={col.emoji ? undefined : { color: col.color, textShadow: '0 0 16px ' + col.color + '80' }}
                  >
                    {col.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {confidence === 'baja' && (
            <div className="momento-confidence">medición con señal limitada</div>
          )}

          {hasModeChip && (
            <div className="momento-mode-chip">
              <span className="momento-mode-label">{modeMeta.icon} {modeMeta.label}</span>
              {placeTxt && (
                <>
                  <span className="momento-mode-sep" />
                  <span className="momento-mode-sub">{placeTxt}</span>
                </>
              )}
              {dateTxt && (
                <>
                  <span className="momento-mode-sep" />
                  <span className="momento-mode-sub">{dateTxt}</span>
                </>
              )}
            </div>
          )}

          <div className="momento-footer">
            El karaoke cambió para siempre.
            <div className="momento-footer-sub">retroke.cl</div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ShareResultCard
