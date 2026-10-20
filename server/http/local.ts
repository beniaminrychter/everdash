import { networkInterfaces } from 'node:os';
import { isIP } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEverDashApps } from '../main';

export interface LocalRuntimeConfig {
  haOrigin: string;
  haToken: string;
  hostOverride?: string;
  dataDirectory: string;
}

function validHostOverride(value: string): boolean {
  const host = value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1) : value;
  if (isIP(host)) {
    return true;
  }
  return (
    host.length <= 253 &&
    host.split('.').every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))
  );
}

export function readLocalRuntimeConfig(env: NodeJS.ProcessEnv): LocalRuntimeConfig {
  const rawUrl = env.EVERDASH_HA_URL?.trim() ?? '';
  const token = env.EVERDASH_HA_TOKEN?.trim() ?? '';
  if (!rawUrl) {
    throw new Error('Set EVERDASH_HA_URL in .env.local (for example http://127.0.0.1:8123).');
  }
  if (!token) {
    throw new Error('Set EVERDASH_HA_TOKEN in .env.local to a Home Assistant long-lived token.');
  }
  if (token.startsWith('replace-with-')) {
    throw new Error('Replace the token placeholder in .env.local with a Home Assistant token.');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('EVERDASH_HA_URL must be a valid Home Assistant URL origin.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    /[?#]/.test(rawUrl)
  ) {
    throw new Error('EVERDASH_HA_URL must be a valid Home Assistant URL origin without a path.');
  }

  const rawHostOverride = env.EVERDASH_LAN_HOST?.trim() ?? '';
  if (rawHostOverride && !validHostOverride(rawHostOverride)) {
    throw new Error(
      'EVERDASH_LAN_HOST must be a local IP address or host name without a URL scheme.',
    );
  }

  return {
    haOrigin: parsed.origin,
    haToken: token,
    ...(rawHostOverride ? { hostOverride: rawHostOverride } : {}),
    dataDirectory: resolve(env.EVERDASH_DATA_DIR?.trim() || '.local/everdash'),
  };
}

export async function startLocalEverDash(env: NodeJS.ProcessEnv = process.env) {
  const runtime = readLocalRuntimeConfig(env);
  const apps = await createEverDashApps({
    dataDirectory: runtime.dataDirectory,
    localHomeAssistant: {
      origin: runtime.haOrigin,
      token: runtime.haToken,
      hostOverride: runtime.hostOverride,
    },
    localNetworkInterfaces: networkInterfaces(),
  });

  try {
    await apps.management.listen({ host: '127.0.0.1', port: 8099 });
    process.stdout.write('EverDash local admin listening at http://127.0.0.1:8099/.\n');
    await apps.directHttp.listen({ host: '0.0.0.0', port: 8095 });
    process.stdout.write('EverDash tablet dashboard listening on port 8095.\n');
  } catch (error) {
    await Promise.all([apps.management.close(), apps.directHttp.close(), apps.direct.close()]);
    throw error;
  }

  const stop = () => {
    Promise.all([apps.management.close(), apps.direct.close(), apps.directHttp.close()]).finally(
      () => process.exit(0),
    );
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  return apps;
}

async function startFromCommandLine() {
  try {
    await startLocalEverDash();
  } catch (error) {
    process.stderr.write(
      `EverDash local runtime failed to start: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startFromCommandLine();
}
