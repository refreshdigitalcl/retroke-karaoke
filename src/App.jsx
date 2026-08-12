import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { KaraokeSessionProvider } from './contexts/KaraokeSessionContext'
import { AuthProvider } from './contexts/AuthContext'

// Fase 17 ("Performance"): estas cinco son el flujo de karaoke EN VIVO --
// la pantalla del bar y lo que ve el celular del cantante/publico durante
// una sesion real. Se mantienen con import normal (eager) para que carguen
// de inmediato, sin depender de que el bundle de rutas lazy termine de
// bajar primero. El resto de la app (World, admin, marketing) no comparte
// ese requisito de latencia y se carga bajo demanda con React.lazy.
import Display from './pages/Display'
import RegisterForm from './pages/RegisterForm'
import ReactForm from './pages/ReactForm'
import RateForm from './pages/RateForm'
import DjPanel from './pages/DjPanel'

const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const WelcomePage = lazy(() => import('./pages/WelcomePage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const SharePerformance = lazy(() => import('./pages/SharePerformance'))
const Rankings = lazy(() => import('./pages/Rankings'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Profile = lazy(() => import('./pages/Profile'))
const World = lazy(() => import('./pages/World'))
const Escenario = lazy(() => import('./pages/Escenario'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const LiveViewerPage = lazy(() => import('./pages/LiveViewerPage'))

function RouteFallback() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#05030a', color: 'rgba(255,255,255,0.55)', fontSize: 14
    }}>
      Cargando…
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <KaraokeSessionProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Pantalla del bar (TV/monitor) — rota entre cola, reacciones y calificación */}
            <Route path="/" element={<Display />} />

            {/* Lo que ve el cantante al escanear el QR para anotarse */}
            <Route path="/registro" element={<RegisterForm />} />

            {/* Lo que ve el público en su celular para reaccionar en vivo */}
            <Route path="/reaccionar" element={<ReactForm />} />

            {/* Lo que ve el público en su celular para calificar 5-10 */}
            <Route path="/calificar" element={<RateForm />} />

            {/* Panel de control del DJ */}
            <Route path="/dj" element={<DjPanel />} />

            {/* Panel administrativo global de la plataforma */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* Pagina publica de precios */}
            <Route path="/precios" element={<PricingPage />} />

            {/* Registro publico: crear cuenta, workspace y pagar */}
            <Route path="/comenzar" element={<SignupPage />} />

            {/* Pantalla a la que vuelve Mercado Pago despues de pagar */}
            <Route path="/bienvenido" element={<WelcomePage />} />

            {/* Portal de ventas / landing page */}
            <Route path="/inicio" element={<LandingPage />} />

            {/* Fase D: link publico de la tarjeta compartible de un resultado */}
            <Route path="/r/:performanceId" element={<SharePerformance />} />

            {/* Fase E.1: rankings locales/semanales */}
            <Route path="/ranking" element={<Rankings />} />

            {/* Fase E.2: desafios activos */}
            <Route path="/desafios" element={<Challenges />} />

            {/* Fase "comunidad": perfil propio del participante (historial, stats, logros) */}
            <Route path="/perfil" element={<Profile />} />

            {/* Retroke World: universo digital -- hero, live, ranking, desafios, escenarios */}
            <Route path="/world" element={<World />} />

            {/* Fase 7: ficha publica de un escenario puntual (?bar=slug o ?ws=id) */}
            <Route path="/escenario" element={<Escenario />} />

            {/* Fase 8: perfil publico de lectura de cualquier participante (seguir, logros, historial) */}
            <Route path="/u/:participantId" element={<PublicProfile />} />

            {/* Retroke Live: visor publico de una transmision (solo espectador, nunca cola) */}
            <Route path="/vivo/:liveSessionId" element={<LiveViewerPage />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </KaraokeSessionProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
