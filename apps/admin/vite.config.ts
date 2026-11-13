import preactPreset from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { workspaceAliases } from '../../tooling/aliases';

const api = process.env.EVERDASH_API_URL ?? 'http://127.0.0.1:8790';

export default defineConfig(({ command }) => ({
  // Production is served under /admin/ by the server; dev mirrors that path.
  base: command === 'serve' ? '/admin/' : './',
  root: import.meta.dirname,
  resolve: { alias: workspaceAliases(resolve(import.meta.dirname, 'src')) },
  plugins: [
    tailwindcss(),
    // Each .tsx file gets exactly one JSX transform: React for the admin app,
    // Preact for files shared with the tablet (the canvas island).
    react({ include: /apps\/admin\/src\/.*\.tsx$/ }),
    preactPreset({
      devToolsEnabled: false,
      reactAliasesEnabled: false,
      include: /packages\/.*\.tsx$/,
    }),
  ],
  build: {
    outDir: '../../dist-admin',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5174,
    strictPort: true,
    // Keep the browser's Host header so OAuth redirects return to this server.
    proxy: { '/api': { target: api } },
  },
}));
