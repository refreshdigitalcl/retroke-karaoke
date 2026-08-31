import { useState } from 'react'
import {
  shareCardAsImageFromNode,
  downloadCardAsImageFromNode,
  shareServerCard,
  downloadServerCard,
  shareResult
} from '../../lib/shareCard'

// Fase 14 de Retroke World ("Viralidad"), ver
// retroke-world-diagnostico-tecnico.md seccion 7: antes de esta fase habia
// CUATRO copias casi identicas de este boton repartidas en RegisterForm.jsx
// (YourTurnScreen y PerformanceShareScreen) y SharePerformance.jsx, cada
// una con su propia logica de estado ("Generando...", "Descargada ✓",
// etc). Este es el componente unico que las reemplaza, y el que usan las
// tarjetas nuevas (ranking, logro, desafio) para no crear una quinta copia.
//
// modes:
//   'image'    -> comparte la tarjeta como imagen via Web Share (con
//                 archivo), con fallback a descarga si el navegador no
//                 soporta compartir archivos.
//   'download' -> siempre descarga la tarjeta como PNG, nunca abre el
//                 share sheet nativo.
//   'link'     -> comparte solo texto + URL de una performance
//                 (buildShareUrl('/r/:id')) via Web Share o portapapeles.
//
// Dos fuentes posibles para la imagen (ver shareCard.js para el porque):
//   - props.performanceId -> mecanismo NUEVO, la tarjeta "Momento Retroke"
//     (ShareResultCard) se pide ya armada al servidor (api/momento-card.jsx).
//     Preferido cuando esta disponible.
//   - props.cardRef -> mecanismo VIEJO, captura el DOM con html2canvas.
//     Sigue siendo el unico camino para las tarjetas de ranking/logro/
//     desafio, que no tienen fila en la tabla performances.
export default function ShareButton(props) {
  var mode = props.mode || 'image'
  var label = props.label || (mode === 'download' ? 'Descargar tarjeta' : mode === 'link' ? 'Compartir link' : 'Compartir tarjeta 📲')
  var variant = props.variant || 'primary'
  var heightClass = props.heightClass || 'h-12'
  var showState = mode !== 'link'
  var useServerCard = Boolean(props.performanceId) && (mode === 'image' || mode === 'download')

  var stateHook = useState('')
  var stateText = stateHook[0]
  var setStateText = stateHook[1]

  function finish(result) {
    if (!showState) return
    if (result && result.error) setStateText('No se pudo compartir')
    else if (result && result.method === 'download') setStateText('Descargada ✓')
    else setStateText('')
    setTimeout(function () { setStateText('') }, 2500)
  }

  // Si hay performanceId, se intenta primero el mecanismo NUEVO (servidor).
  // PERO en la pantalla de "acabas de cantar" (YourTurnScreen) es posible
  // tocar "compartir" en el instante justo en que la fila de performances
  // recien se esta guardando en la base -- si el servidor todavia no
  // encuentra esa fila (404) y hay un cardRef disponible como respaldo, se
  // cae al mecanismo VIEJO (captura del DOM) en vez de mostrar un error.
  function runWithFallback(serverTask, domTaskFactory) {
    return serverTask.then(function (result) {
      if (result && result.error && props.cardRef && props.cardRef.current) {
        return domTaskFactory()
      }
      return result
    })
  }

  function handleClick() {
    if (mode === 'download') {
      setStateText('Generando...')
      var downloadTask = useServerCard
        ? runWithFallback(
            downloadServerCard(props.performanceId, props.filename),
            function () { return downloadCardAsImageFromNode(props.cardRef.current, props.filename) }
          )
        : downloadCardAsImageFromNode(props.cardRef.current, props.filename)
      downloadTask.then(finish)
      return
    }
    if (mode === 'image') {
      setStateText('Generando...')
      var shareOpts = { filename: props.filename, title: props.title, text: props.text }
      var shareTask = useServerCard
        ? runWithFallback(
            shareServerCard(props.performanceId, shareOpts),
            function () { return shareCardAsImageFromNode(props.cardRef.current, shareOpts) }
          )
        : shareCardAsImageFromNode(props.cardRef.current, shareOpts)
      shareTask.then(finish)
      return
    }
    // mode === 'link'
    shareResult({
      performanceId: props.performanceId,
      song: props.song,
      artistName: props.artistName || null,
      notaFinal: props.notaFinal !== undefined ? props.notaFinal : null
    })
  }

  var primaryStyle = { background: 'linear-gradient(90deg, #E91E8C, #8B5CF6)', color: '#fff' }
  var secondaryStyle = { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={'w-full ' + heightClass + ' rounded-xl font-bold ' + (props.className || '')}
      style={variant === 'secondary' ? secondaryStyle : primaryStyle}
    >
      {label} {showState && stateText && '· ' + stateText}
    </button>
  )
}
