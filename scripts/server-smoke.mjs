import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'everdash-server-smoke-'));
const child = spawn(process.execPath, ['dist-server/server.js'], {
  env: {
    ...process.env,
    EVERDASH_DATA_DIR: join(directory, 'data'),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', (chunk) => (output += chunk));
child.stderr.on('data', (chunk) => (output += chunk));

try {
  const deadline = Date.now() + 10_000;
  let healthy = false;
  while (!healthy && Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:8095/health');
      healthy = response.status === 200 && (await response.json()).status === 'ok';
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.equal(healthy, true, `standalone listener did not start: ${output}`);
  const session = await fetch('http://127.0.0.1:8095/api/manage/auth/session');
  assert.equal((await session.json()).authenticated, false);
  assert.equal((await fetch('http://127.0.0.1:8095/api/manage/config')).status, 401);
  console.log('PASS: standalone entry starts without credentials and protects management.');
} finally {
  if (child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  await rm(directory, { recursive: true, force: true });
}
