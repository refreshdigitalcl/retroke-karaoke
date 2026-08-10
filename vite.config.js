import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  export default defineConfig({
    plugins: [react()],
        server: {
    host: true,
          port: 5173
      },
    // Fase 19 ("Testing"). Vitest lee este mismo archivo -- no hace falta un
    // config separado. jsdom da acceso a window/document para los pocos
    // helpers de lib/ que lo necesitan (shareCard.buildShareUrl).
    test: {
      environment: 'jsdom'
    }
})
