import { useTheme } from '../contexts/ThemeContext'

  export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

        return (
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="relative w-[52px] h-[30px] rounded-full border transition-colors"
            style={{
        background: 'var(--bg-card-alt)',
                  borderColor: 'var(--border)'
          }}
    >
      <div
              className="absolute top-[2px] w-[24px] h-[24px] rounded-full transition-transform duration-200 flex items-center justify-center text-[12px]"
              style={{
          background: 'var(--accent-magenta)',
                      transform: isDark ? 'translateX(24px)' : 'translateX(2px)'
            }}
      >
{isDark ? '🌙' : '☀️'}
      </div>
      </button>
    )
  }
  
