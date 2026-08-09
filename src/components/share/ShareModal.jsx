// Fase 14 -- overlay simple para mostrar una tarjeta compartible + sus
// botones sin necesitar una ruta/pantalla nueva (a diferencia del flujo de
// resultado de una presentacion, que ya tiene sus propias pantallas
// dedicadas en RegisterForm.jsx). Compartido por Profile.jsx (ranking,
// logro) y Challenges.jsx (desafio) para no repetir este overlay tres veces.
export default function ShareModal(props) {
  return (
    <div className="share-modal-overlay" onClick={props.onClose}>
      <style>{`
        .share-modal-overlay {
          position: fixed; inset: 0; z-index: 200; background: rgba(5,3,10,0.86); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;
        }
        .share-modal-inner { display: flex; flex-direction: column; align-items: center; gap: 14px; max-width: 420px; width: 100%; }
        .share-modal-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .share-modal-close { text-align: center; font-size: 13px; color: rgba(255,255,255,0.55); background: none; border: none; cursor: pointer; padding: 6px; }
      `}</style>
      <div className="share-modal-inner" onClick={function (e) { e.stopPropagation() }}>
        {props.children}
        <button type="button" className="share-modal-close" onClick={props.onClose}>Cerrar ✕</button>
      </div>
    </div>
  )
}
