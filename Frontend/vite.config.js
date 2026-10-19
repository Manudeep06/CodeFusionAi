import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Worker scripts (Monaco language services) must carry the same isolation
// headers, or an isolated /room page refuses to start them.
const isWorker = (path) => /[?&]worker_file|\.worker[.-]|\/assets\/.*worker/.test(path);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'configure-response-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          const originalUrl = req.originalUrl || '';
          const hasTarget = (path) => path.startsWith('/dashboard') || path.startsWith('/room') || path.startsWith('/webcontainer') || isWorker(path);
          
          if (hasTarget(url) || hasTarget(originalUrl)) {
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          const originalUrl = req.originalUrl || '';
          const hasTarget = (path) => path.startsWith('/dashboard') || path.startsWith('/room') || path.startsWith('/webcontainer') || isWorker(path);
          
          if (hasTarget(url) || hasTarget(originalUrl)) {
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          }
          next();
        });
      }
    }
  ],
})
