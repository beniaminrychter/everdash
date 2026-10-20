import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const macDocker = '/Applications/Docker.app/Contents/Resources/bin/docker';

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.error === undefined && result.status === 0;
}

export function resolveDockerBinary(platform, onPath = commandExists, pathExists = existsSync) {
  if (onPath('docker')) {
    return 'docker';
  }
  if (platform === 'darwin' && pathExists(macDocker)) {
    return macDocker;
  }
  return null;
}

function runDocker() {
  const executable = resolveDockerBinary(process.platform);
  if (!executable) {
    process.stderr.write('Docker CLI not found. Install Docker Desktop or add docker to PATH.\n');
    process.exitCode = 1;
    return;
  }

  const env = { ...process.env };
  if (executable !== 'docker') {
    env.PATH = `${dirname(executable)}${delimiter}${env.PATH ?? ''}`;
  }
  const result = spawnSync(executable, process.argv.slice(2), { env, stdio: 'inherit' });
  if (result.error) {
    process.stderr.write(`Could not run Docker: ${result.error.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDocker();
}
