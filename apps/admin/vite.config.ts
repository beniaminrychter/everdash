import preactPreset from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: import.meta.dirname,
  plugins: [preactPreset({ devToolsEnabled: false, reactAliasesEnabled: false })],
  build: {
    outDir: '../../dist-admin',
    emptyOutDir: true,
    sourcemap: false,
  },
});
