import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import preactPreset from '@preact/preset-vite';

function inlinePreviewAssets(): Plugin {
  return {
    apply: 'build',
    enforce: 'post',
    name: 'inline-preview-assets',
    writeBundle(options) {
      const outputDirectory = resolve(options.dir ?? 'dist-preview');
      const htmlPath = resolve(outputDirectory, 'index.html');
      let html = readFileSync(htmlPath, 'utf8');
      html = html.replace(/<link\b[^>]*>/g, (tag) => {
        if (!/\brel="stylesheet"/.test(tag)) {
          return tag;
        }
        const source = tag.match(/\bhref="([^"]+)"/)?.[1];
        if (!source) {
          return tag;
        }
        const assetPath = resolve(outputDirectory, source.replace(/^\.\//, ''));
        if (!assetPath.startsWith(`${outputDirectory}/`)) {
          return tag;
        }
        return `<style>${readFileSync(assetPath, 'utf8')}</style>`;
      });
      html = html.replace(/<script\b([^>]*)><\/script>/g, (tag, attributes: string) => {
        if (!/\btype="module"/.test(attributes)) {
          return tag;
        }
        const source = attributes.match(/\bsrc="([^"]+)"/)?.[1];
        if (!source) {
          return tag;
        }
        const assetPath = resolve(outputDirectory, source.replace(/^\.\//, ''));
        if (!assetPath.startsWith(`${outputDirectory}/`)) {
          return tag;
        }
        const javascript = readFileSync(assetPath, 'utf8').replace(/<\/script/gi, '<\\/script');
        return `<script type="module">${javascript}</script>`;
      });
      writeFileSync(htmlPath, html);
    },
  };
}

export default defineConfig({
  root: resolve('preview'),
  base: './',
  plugins: [
    preactPreset({ reactAliasesEnabled: false, devtoolsInProd: false }),
    inlinePreviewAssets(),
  ],
  build: {
    outDir: resolve('dist-preview'),
    emptyOutDir: true,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
