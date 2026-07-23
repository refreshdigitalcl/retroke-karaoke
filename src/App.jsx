import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { KaraokeSessionProvider } from './contexts/KaraokeSessionContext'
import { AuthProvider } from './contexts/AuthContext'

import Display from './pages/Display'
import RegisterForm from './pages/RegisterForm'
import ReactForm from './pages/ReactForm'
import RateForm from './pages/RateForm'
import DjPanel from './pages/DjPanel'

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
          </Routes>
        </BrowserRouter>
        </KaraokeSessionProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
