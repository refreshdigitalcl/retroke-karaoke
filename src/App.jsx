import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { KaraokeSessionProvider } from './contexts/KaraokeSessionContext'

import Display from './pages/Display'
import RegisterForm from './pages/RegisterForm'
import ReactForm from './pages/ReactForm'
import RateForm from './pages/RateForm'
import DjPanel from './pages/DjPanel'

export default function App() {
  return (
      <ThemeProvider>
            <KaraokeSessionProvider>
                    <BrowserRouter>
                              <Routes>
                                          <Route path="/" element={<Display />} />
                                                      <Route path="/registro" element={<RegisterForm />} />
                                                                  <Route path="/reaccionar" element={<ReactForm />} />
                                                                              <Route path="/calificar" element={<RateForm />} />
                                                                                          <Route path="/dj" element={<DjPanel />} />
                                                                                                    </Routes>
                                                                                                            </BrowserRouter>
                                                                                                                  </KaraokeSessionProvider>
                                                                                                                      </ThemeProvider>
                                                                                                                        )
                                                                                                                        }
                                                                                                                        
