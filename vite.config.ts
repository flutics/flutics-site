import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'site-output/www',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
});
