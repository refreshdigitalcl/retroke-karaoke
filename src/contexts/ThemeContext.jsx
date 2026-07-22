import { createContext, useContext, useEffect, useState } from 'react'

  const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('karaoke-theme')
    return saved || 'dark'
})

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
} else {
      root.classList.remove('dark')
}
    localStorage.setItem('karaoke-theme', theme)
}, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
}

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
{children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
}
  return context
}
