// Retroke Visual System 2.0 (Fase 2). Evolucion de WorldSkeleton.jsx --
// mismo uso (lines=N), pero con un barrido de gradiente en vez del pulso
// gris generico, para que la carga tambien se sienta "Retroke" y no un
// spinner de cualquier dashboard.
export default function RetrokeSkeleton({ lines = 2 }) {
  return (
    <div className="rk-skeleton" aria-hidden="true">
      {Array.from({ length: lines }).map(function (_, i) {
        return <div key={i} className="rk-skeleton-line" style={{ width: (i === lines - 1 ? 60 : 100 - i * 12) + '%' }} />
      })}
    </div>
  )
}
