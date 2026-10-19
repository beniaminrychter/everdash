import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import preactPreset from '@preact/preset-vite';

function offlineShell(): Plugin {
  return {
    apply: 'build',
    enforce: 'post',
    name: 'offline-shell',
    writeBundle(options, bundle) {
      // Wait for both output passes: the HTML references separately emitted legacy files.
      if (!bundle['index.html']) {
        return;
      }
      const directory = resolve(options.dir || 'dist');
      const files = [
        'index.html',
        ...readdirSync(resolve(directory, 'assets'))
          .filter((name) => !name.endsWith('.map'))
          .map((name) => `assets/${name}`),
      ];
      const publicFiles = [
        'manifest.json',
        'icons/home.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ];
      const hash = createHash('sha256');
      hash.update('everdash-shell-v4-ignore-static-vary-and-fragment');
      [...files, ...publicFiles]
        .sort()
        .forEach((name) => hash.update(readFileSync(resolve(directory, name))));
      const version = hash.digest('hex').slice(0, 12);
      const precache = JSON.stringify([
        './',
        ...files.map((name) => `./${name}`),
        ...publicFiles.map((name) => `./${name}`),
      ]);
      writeFileSync(
        resolve(directory, 'sw.js'),
        `/* Generated application shell cache. ES5 for iOS 12. */
var PREFIX = 'everdash-' + encodeURIComponent(self.registration.scope) + '-';
var CACHE = PREFIX + '${version}';
var FILES = ${precache};
var URLS = FILES.map(function (path) { return new URL(path, self.registration.scope).href; });
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(URLS); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf(PREFIX) === 0 && key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);
  requestUrl.hash = '';
  if (event.request.method !== 'GET' || URLS.indexOf(requestUrl.href) === -1) {
    return;
  }
  event.respondWith(caches.open(CACHE).then(function (cache) {
    // These are public, immutable app files. CORS Vary headers must not break offline matching.
    return cache.match(requestUrl.href, { ignoreVary: true }).then(function (response) { return response || fetch(event.request); });
  }));
});
`,
      );
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    cssTarget: 'safari12',
    minify: 'terser',
    terserOptions: { format: { comments: false } },
  },
  plugins: [
    preactPreset({ reactAliasesEnabled: false, devtoolsInProd: false }),
    legacy({
      // IE11 is a syntax floor only, ensuring these fallback files stay ES5.
      targets: ['ios_saf >= 12', 'Safari >= 12', 'ie >= 11'],
      modernTargets: ['ios_saf >= 12', 'Safari >= 12'],
      renderLegacyChunks: true,
      // All application APIs exist in iOS 12. Keep SystemJS, omit IE-only core-js.
      polyfills: false,
    }),
    offlineShell(),
  ],
});
