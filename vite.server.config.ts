import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'server/main.ts'),
      formats: ['es'],
      fileName: 'server',
    },
    outDir: 'dist-server',
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => id.startsWith('node:') || (!id.startsWith('.') && !isAbsolute(id)),
    },
  },
});
