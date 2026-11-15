// Vite's HMR client requires newer JavaScript than Safari 12 can parse.
// Watch the production build's ES5 path instead.
import { resolve } from 'node:path';
import { build, preview } from 'vite';

const outDir = resolve(process.env.EVERDASH_IPAD_OUT_DIR ?? '.local/ipad-preview');
const port = Number(process.env.EVERDASH_IPAD_PORT ?? '5175');
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('EVERDASH_IPAD_PORT must be an integer between 0 and 65535.');
}
process.env.EVERDASH_API_URL ??= `http://127.0.0.1:${process.env.EVERDASH_PORT ?? '8790'}`;

const options = {
  configFile: resolve('vite.config.ts'),
  mode: 'ipad',
  build: { outDir, emptyOutDir: true, watch: {} },
};
const watcher = await build(options);
let server;
let stopping = false;

async function stop(code) {
  if (stopping) {
    return;
  }
  stopping = true;
  await server?.close();
  await watcher.close();
  process.exit(code);
}

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));

try {
  await new Promise((ready, reject) => {
    watcher.on('event', (event) => {
      if (event.code === 'END') {
        ready();
      } else if (event.code === 'ERROR') {
        reject(event.error);
      }
    });
  });
  server = await preview({
    ...options,
    preview: { host: '0.0.0.0', port, strictPort: true, open: false },
  });
  console.log(`\niPad preview ready: ${server.resolvedUrls.local[0]}`);
  server.printUrls();
  console.log('Keep pnpm dev running for the API and admin. Reload the iPad after each rebuild.\n');
} catch (error) {
  console.error(error);
  await stop(1);
}
