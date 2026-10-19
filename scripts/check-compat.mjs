import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'acorn';
import { parse as parseCss } from 'postcss';
import assert from 'node:assert/strict';

const assets = readdirSync('dist/assets');
const legacy = assets.filter((name) => /legacy.*\.js$/.test(name));
assert.ok(legacy.length >= 2, 'Missing legacy app / polyfill bundles');
for (const name of legacy) {
  parse(readFileSync(`dist/assets/${name}`, 'utf8'), { ecmaVersion: 5 });
}
const worker = readFileSync('dist/sw.js', 'utf-8');
parse(worker, { ecmaVersion: 5 });
assert.match(worker, /var PREFIX = 'everdash-'/);
const html = readFileSync('dist/index.html', 'utf-8');
assert.match(html, /nomodule/);
assert.match(html, /apple-mobile-web-app-capable/);
assert.match(html, /apple-touch-icon/);
for (const name of assets.filter((assetName) => assetName.endsWith('.css'))) {
  const css = readFileSync(`dist/assets/${name}`, 'utf-8');
  assert.doesNotMatch(css, /(?:oklch|oklab|color-mix|:has)\(/);
  assert.doesNotMatch(css, /\d(?:dvh|svh|lvh)\b/);
  parseCss(css).walkDecls((decl) => {
    assert.ok(
      !['gap', 'row-gap', 'column-gap', 'aspect-ratio'].includes(decl.prop),
      `Audit unsupported declaration ${decl.prop}`,
    );
    assert.doesNotMatch(decl.value, /(?:^|[\s,(])(?:min|max|clamp)\(/);
  });
}
const precache = JSON.parse(worker.match(/var FILES = (\[.*?\]);/)[1]);
assert.ok(precache.every((path) => !/\bapi\b|device|config/i.test(path)));
for (const path of precache.filter((cachedPath) => cachedPath !== './')) {
  readFileSync(`dist/${path.slice(2)}`);
}
assert.ok(precache.some((path) => path.includes('legacy')));
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf-8'));
assert.equal(manifest.name, 'EverDash');
assert.equal(manifest.display, 'standalone');
console.log(
  `PASS: ${legacy.length} ES5 legacy bundles, ES5 worker, CSS audit, Apple metadata, manifest and ${precache.length} local precache entries.`,
);
