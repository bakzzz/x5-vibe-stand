import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root,
  publicDir: path.join(root, 'public'),
  resolve: {
    alias: { '@': path.resolve(root, 'src') },
  },
  define: {
    'import.meta.env.VITE_STAND_PUBLIC_URL': JSON.stringify(
      process.env.VITE_STAND_PUBLIC_URL ?? process.env.STAND_PUBLIC_URL ?? 'http://localhost:3002',
    ),
    'import.meta.env.VITE_STAND_PROTO_DOMAIN': JSON.stringify(
      process.env.STAND_PROTO_DOMAIN ?? 'proto.x5.ru',
    ),
  },
  server: {
    host: true,
    port: Number(process.env.STAND_VITE_PORT ?? 3002),
    strictPort: true,
    allowedHosts: ['.localhost', 'localhost'],
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.STAND_PORT ?? 8013}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
