import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import preactPreset from '@preact/preset-vite';

export default defineConfig({
  root: resolve('preview'),
  base: './',
  plugins: [preactPreset({ reactAliasesEnabled: false, devtoolsInProd: false })],
  build: {
    outDir: resolve('dist-preview'),
    emptyOutDir: true,
  },
});
