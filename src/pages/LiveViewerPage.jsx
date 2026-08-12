import { useParams } from 'react-router-dom'
import { useRetrokeFont } from '../lib/fonts'
import RetrokeAtmosphere from '../components/retroke/RetrokeAtmosphere'
import { RETROKE_STYLES } from '../components/retroke/retrokeStyles'
import LiveViewer from '../components/live/LiveViewer'

// Retroke Live -- pagina publica del visor (Fase 4, MVP tecnico). Ruta
// nueva e independiente (/vivo/:liveSessionId), no reemplaza ni modifica
// ninguna ruta existente.
export default function LiveViewerPage() {
  useRetrokeFont()
  var params = useParams()

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--rk-bg-gradient)', backgroundColor: '#05030a' }}>
      <style>{RETROKE_STYLES}</style>
      <RetrokeAtmosphere variant="equalizer" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <LiveViewer liveSessionId={params.liveSessionId} />
      </div>
    </div>
  )
}
