import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: resolve(__dirname, '../site-output/demo'),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  worker: { format: 'es' },
  server: { port: 5174 },
  preview: { port: 4174, host: '127.0.0.1' },
});
