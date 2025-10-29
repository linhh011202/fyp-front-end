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
    // Bind to all network interfaces (0.0.0.0) to allow remote access via 20.196.72.17
    host: '0.0.0.0',
    allowedHosts: ['dinh.koreacentral.cloudapp.azure.com'],
    hmr: {
      protocol: 'ws',
      // The client should connect to the external IP where the browser accessed the page
      host: '20.196.72.17',
      // Use the same port as the dev server (not port 80) for HMR websocket
      port: PORT,
    },
  },
  preview: { port: PORT, host: '0.0.0.0' },
});
