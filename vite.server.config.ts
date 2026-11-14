import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { workspaceAliases } from './tooling/aliases';

// Workspace aliases are bare specifiers that must be bundled, not left external.
const bundled = /^@(everdash\/(contracts|ui|dashboard)\/|\/)/;

export default defineConfig({
  resolve: { alias: workspaceAliases(resolve(import.meta.dirname, 'apps/server/src')) },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'apps/server/src/entry.ts'),
      formats: ['es'],
      fileName: 'server',
    },
    outDir: 'dist-server',
    emptyOutDir: true,
    rollupOptions: {
      external: (id) =>
        id.startsWith('node:') || (!id.startsWith('.') && !isAbsolute(id) && !bundled.test(id)),
    },
  },
});
