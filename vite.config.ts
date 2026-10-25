import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error plain ESM module shared with the production server
import { apiMiddleware } from './server/api.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'lailong-api',
      configureServer(server) {
        server.middlewares.use(apiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(apiMiddleware);
      },
    },
  ],
  server: { port: 5173, host: '127.0.0.1' },
});
