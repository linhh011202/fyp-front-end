import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 3039;

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: { 
    port: PORT, 
    host: true, 
    hmr: {
      protocol: 'ws',       // nếu sau này lên HTTPS thì dùng 'wss'
      host: '20.196.72.17', // hoặc domain
      clientPort: 80,       // (hoặc 8080 nếu bạn publish 8080)
    },
  },
  preview: { port: PORT, host: true },
});
