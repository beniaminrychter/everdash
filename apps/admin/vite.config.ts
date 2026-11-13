import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, transformWithEsbuild } from 'vite';
import type { Plugin } from 'vite';
import { workspaceAliases } from '../../tooling/aliases';

const adminSrc = resolve(import.meta.dirname, 'src');
const sharedPackages = resolve(import.meta.dirname, '../../packages');
/** Matches `.tsx` files under one absolute directory, so checkout paths cannot collide. */
function tsxUnder(directory: string): RegExp {
  return new RegExp(`^${directory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*\\.tsx$`);
}

/**
 * Compiles the tablet's shared Preact `.tsx` with Preact's JSX runtime. This is
 * a targeted transform because @preact/preset-vite would switch the whole
 * build's JSX runtime to Preact, including the admin's React files.
 */
function preactJsxForPackages(): Plugin {
  const shared = tsxUnder(sharedPackages);

  return {
    name: 'everdash:preact-jsx-for-packages',
    enforce: 'pre',
    async transform(code, id) {
      const file = id.split('?')[0] ?? id;

      if (!shared.test(file)) {
        return null;
      }

      const result = await transformWithEsbuild(code, file, {
        loader: 'tsx',
        jsx: 'automatic',
        jsxImportSource: 'preact',
        sourcemap: false,
      });

      return { code: result.code, map: null };
    },
  };
}

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
    react({ include: tsxUnder(adminSrc) }),
    preactJsxForPackages(),
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
