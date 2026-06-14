import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/web',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@labcollab/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
  },
});
