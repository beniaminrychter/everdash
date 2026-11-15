import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parse } from 'acorn';

test(
  'iPad preview serves the legacy build and proxies the existing API',
  { timeout: 60_000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'everdash-ipad-preview-'));
    const api = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ path: request.url, method: request.method }));
    });
    api.listen(0, '127.0.0.1');
    await once(api, 'listening');
    const address = api.address();
    assert.ok(address && typeof address !== 'string');

    const child = spawn(process.execPath, ['scripts/dev-ipad.mjs'], {
      env: {
        ...process.env,
        EVERDASH_API_URL: `http://127.0.0.1:${address.port}`,
        EVERDASH_IPAD_OUT_DIR: directory,
        EVERDASH_IPAD_PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    child.stdout.on('data', (chunk) => {
      log += chunk;
    });
    child.stderr.on('data', (chunk) => {
      log += chunk;
    });

    try {
      const url = await new Promise<string>((resolve, reject) => {
        const deadline = setTimeout(() => {
          reject(new Error(`iPad preview did not start:\n${log}`));
        }, 45_000);
        child.once('exit', (code) => {
          clearTimeout(deadline);
          reject(new Error(`iPad preview exited with ${code}:\n${log}`));
        });
        child.stdout.on('data', () => {
          const match = log.match(/iPad preview ready: (http:\/\/localhost:\d+\/)/);
          if (match) {
            clearTimeout(deadline);
            resolve(match[1]);
          }
        });
      });

      const html = await (await fetch(url)).text();
      assert.match(html, /<title>EverDash<\/title>/);
      assert.doesNotMatch(html, /\/@vite\/client|\/src\/app\/main\.tsx/);
      assert.doesNotMatch(html, /type="module"/);
      const legacyAssets = [
        ...html.matchAll(/(?:src|data-src)="(\.\/assets\/[^" ]*legacy[^" ]*\.js)"/g),
      ];
      assert.equal(legacyAssets.length, 2);
      for (const [, asset] of legacyAssets) {
        const response = await fetch(new URL(asset, url));
        assert.equal(response.status, 200);
        parse(await response.text(), { ecmaVersion: 5 });
      }

      const access = await fetch(new URL('api/access', url));
      assert.deepEqual(await access.json(), { path: '/api/access', method: 'GET' });
      const unlock = await fetch(new URL('api/access/unlock', url), { method: 'POST' });
      assert.deepEqual(await unlock.json(), { path: '/api/access/unlock', method: 'POST' });

      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      const [code, signal] = await exited;
      assert.equal(code, 0, log);
      assert.equal(signal, null);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit');
        child.kill('SIGKILL');
        await exited;
      }
      await new Promise<void>((resolve) => api.close(() => resolve()));
      await rm(directory, { recursive: true, force: true });
    }
  },
);
