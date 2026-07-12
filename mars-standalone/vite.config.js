import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// v0.14.4: same-origin proxy to the base station's Ollama server.
// Avoids browser CORS entirely (no OLLAMA_ORIGINS needed) — the server
// forwards /ollama/* to localhost:11434 with the browser Origin header
// stripped so Ollama treats it as a local client. Applied to both the
// dev server and `vite preview`, so the production build served locally
// behaves identically to dev.
const ollamaProxy = {
  '/ollama': {
    target: 'http://localhost:11434',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/ollama/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    proxy: ollamaProxy,
  },
  preview: {
    proxy: ollamaProxy,
  },
})
