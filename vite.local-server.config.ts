import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'server/http/local.ts'),
      formats: ['es'],
      fileName: 'local-server',
    },
    outDir: 'dist-local-server',
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => id.startsWith('node:') || (!id.startsWith('.') && !isAbsolute(id)),
    },
  },
});
