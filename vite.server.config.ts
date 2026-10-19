import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'server/config/repository.ts'),
      formats: ['es'],
      fileName: 'repository',
    },
    outDir: 'dist-server',
    emptyOutDir: true,
    rollupOptions: {
      external: ['node:crypto', 'node:events', 'node:fs', 'node:path'],
    },
  },
});
