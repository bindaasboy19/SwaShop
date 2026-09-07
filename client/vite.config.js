import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
      { find: /^\.\.\/\.\.\/components/, replacement: path.resolve(__dirname, 'src/components') },
      { find: /^\.\.\/\.\.\/api/, replacement: path.resolve(__dirname, 'src/api') },
      { find: /^\.\.\/\.\.\/context/, replacement: path.resolve(__dirname, 'src/context') },
      { find: /^\.\.\/\.\.\/assets/, replacement: path.resolve(__dirname, 'src/assets') }
    ]
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});

