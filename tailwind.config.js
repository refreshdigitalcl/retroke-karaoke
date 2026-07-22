/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
      darkMode: 'class',
      theme: {
    extend: {
      colors: {
        retro: {
          bg: '#0a0a0a',
                      card: '#171717',
                      magenta: '#E91E8C',
                      purple: '#8B5CF6',
                      green: '#7ED957',
                      yellow: '#F4D03F'
            }
      },
      fontFamily: {
        sans: ['"Poppins"', 'system-ui', 'sans-serif']
          }
    }
  },
  plugins: []
    }
