import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { KaraokeSessionProvider } from './contexts/KaraokeSessionContext'
import { AuthProvider } from './contexts/AuthContext'

import Display from './pages/Display'
import RegisterForm from './pages/RegisterForm'
import ReactForm from './pages/ReactForm'
import RateForm from './pages/RateForm'
import DjPanel from './pages/DjPanel'
import AdminPanel from './pages/AdminPanel'
import PricingPage from './pages/PricingPage'
import SignupPage from './pages/SignupPage'
import WelcomePage from './pages/WelcomePage'
import LandingPage from './pages/LandingPage'
import SharePerformance from './pages/SharePerformance'
import Rankings from './pages/Rankings'

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <KaraokeSessionProvider>
        <BrowserRouter>
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

            {/* Fase D: tarjeta compartible publica de un resultado */}
            <Route path="/r/:performanceId" element={<SharePerformance />} />

            {/* Fase E.1: rankings global y por sala */}
            <Route path="/ranking" element={<Rankings />} />
          </Routes>
        </BrowserRouter>
        </KaraokeSessionProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
