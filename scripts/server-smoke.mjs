import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'everdash-server-smoke-'));
await writeFile(join(directory, 'options.json'), JSON.stringify({ direct_enabled: false }));
const child = spawn(process.execPath, ['dist-server/server.js'], {
  env: {
    ...process.env,
    SUPERVISOR_TOKEN: 'fixture-only-supervisor-token',
    EVERDASH_DATA_DIR: join(directory, 'data'),
    EVERDASH_OPTIONS_FILE: join(directory, 'options.json'),
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
      const response = await fetch('http://127.0.0.1:8099/health');
      healthy = response.status === 200 && (await response.json()).status === 'ok';
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.equal(healthy, true, `management listener did not start: ${output}`);
  const bootstrap = await fetch('http://127.0.0.1:8099/api/bootstrap');
  assert.equal(bootstrap.status, 403);
  assert.equal((await bootstrap.json()).code, 'INGRESS_PEER_REQUIRED');
  console.log('PASS: server entry starts Ingress health and rejects non-Supervisor peers.');
} finally {
  if (child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  await rm(directory, { recursive: true, force: true });
}
