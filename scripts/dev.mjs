// Runs the EverDash server from source with the tablet and admin Vite servers.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const apiPort = process.env.EVERDASH_PORT ?? '8790';
const dataDirectory = process.env.EVERDASH_DATA_DIR ?? '.local/everdash';
mkdirSync(dataDirectory, { recursive: true });

const processes = [
  {
    name: 'server',
    color: 35,
    command: ['pnpm', 'exec', 'tsx', 'watch', '--clear-screen=false', 'apps/server/src/entry.ts'],
    env: { EVERDASH_HOST: '127.0.0.1', EVERDASH_PORT: apiPort, EVERDASH_DATA_DIR: dataDirectory },
  },
  { name: 'tablet', color: 36, command: ['pnpm', 'exec', 'vite', '--host', '0.0.0.0'] },
  {
    name: 'admin',
    color: 33,
    command: ['pnpm', 'exec', 'vite', '--config', 'apps/admin/vite.config.ts', '--host', '0.0.0.0'],
  },
];

const children = [];
let stopping = false;

function stop(code = 0) {
  stopping = true;
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exitCode = code;
}

function forward(stream, target, prefix) {
  let pending = '';
  stream.on('data', (chunk) => {
    pending += chunk;
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`${prefix}${line}\n`);
    }
  });
}

function launch({ name, color, command, env }) {
  const child = spawn(command[0], command.slice(1), {
    env: { ...process.env, EVERDASH_API_URL: `http://127.0.0.1:${apiPort}`, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = `\u001B[${color}m${name.padEnd(6)}\u001B[0m │ `;
  forward(child.stdout, process.stdout, prefix);
  forward(child.stderr, process.stderr, prefix);
  child.on('exit', (code) => {
    if (!stopping) {
      process.stderr.write(`${prefix}exited with code ${code}; stopping dev.\n`);
      stop(code ?? 1);
    }
  });
  return child;
}

for (const entry of processes) {
  children.push(launch(entry));
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

process.stdout.write(
  [
    '',
    '  EverDash dev',
    '  Admin:   http://localhost:5174/admin/',
    '  Tablet:  http://localhost:5173/',
    `  API:     http://127.0.0.1:${apiPort} (data in ${dataDirectory})`,
    '  Home Assistant URL for sign-in: http://localhost:8123',
    '',
    '',
  ].join('\n'),
);
