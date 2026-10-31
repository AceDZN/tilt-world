import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5242, strictPort: true },
  preview: { host: '0.0.0.0', port: 4242, strictPort: true },
  build: { chunkSizeWarningLimit: 3000 },
});
