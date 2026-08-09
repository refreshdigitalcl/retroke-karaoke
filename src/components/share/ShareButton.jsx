import { useState } from 'react'
import { shareCardAsImage, downloadCardAsImage, shareResult } from '../../lib/shareCard'

// Fase 14 de Retroke World ("Viralidad"), ver
// retroke-world-diagnostico-tecnico.md seccion 7: antes de esta fase habia
// CUATRO copias casi identicas de este boton repartidas en RegisterForm.jsx
// (YourTurnScreen y PerformanceShareScreen) y SharePerformance.jsx, cada
// una con su propia logica de estado ("Generando...", "Descargada ✓",
// etc). Este es el componente unico que las reemplaza, y el que usan las
// tarjetas nuevas (ranking, logro, desafio) para no crear una quinta copia.
//
// modes:
//   'image'    -> comparte cardRef como imagen via Web Share (con archivo),
//                 con fallback a descarga si el navegador no soporta
//                 compartir archivos. Igual a shareCardAsImage().
//   'download' -> siempre descarga cardRef como PNG, nunca abre el share
//                 sheet nativo.
//   'link'     -> comparte solo texto + URL de una performance
//                 (buildShareUrl('/r/:id')) via Web Share o portapapeles.
//                 Requiere performanceId -- es el unico modo que no usa
//                 cardRef, ya que no hay imagen involucrada.
export default function ShareButton(props) {
  var mode = props.mode || 'image'
  var label = props.label || (mode === 'download' ? 'Descargar tarjeta' : mode === 'link' ? 'Compartir link' : 'Compartir tarjeta 📲')
  var variant = props.variant || 'primary'
  var heightClass = props.heightClass || 'h-12'
  var showState = mode !== 'link'

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

  function handleClick() {
    if (mode === 'download') {
      setStateText('Generando...')
      downloadCardAsImage(props.cardRef.current, props.filename).then(finish)
      return
    }
    if (mode === 'image') {
      setStateText('Generando...')
      shareCardAsImage(props.cardRef.current, { filename: props.filename, title: props.title, text: props.text }).then(finish)
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
