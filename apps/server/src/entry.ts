import type { FastifyInstance } from 'fastify';
import { lookup as dnsLookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import type { RequestOptions } from 'node:http';
import { isIPv4 } from 'node:net';
import { networkInterfaces } from 'node:os';
import type { NetworkInterfaceInfo } from 'node:os';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = 8095;
const DEFAULT_INGRESS_PORT = 8099;
const DEFAULT_SUPERVISOR_PROXY_IP = '172.30.32.2';
const SUPERVISOR_PORT_KEY = '8095/tcp';
const SUPERVISOR_TIMEOUT_MS = 2000;
const IPV6_UNAVAILABLE_CODES = new Set(['EAFNOSUPPORT', 'EADDRNOTAVAIL']);

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };
    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
}

function parsePortNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65_535) {
    return value;
  }

  return undefined;
}

function readJsonOverHttp(options: RequestOptions, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ agent: false, ...options }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${res.statusCode ?? 500}`));
          return;
        }

        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });
      res.on('error', reject);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Supervisor port lookup timed out'));
    });
    req.on('error', reject);
    req.end();
  });
}

function extractSupervisorData(payload: unknown): Record<string, unknown> | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const { data } = payload as { data?: unknown };
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  return data as Record<string, unknown>;
}

function extractSupervisorNetworkPort(payload: unknown): number | undefined {
  const data = extractSupervisorData(payload);
  if (!data) {
    return undefined;
  }

  const { network } = data as { network?: unknown };
  if (typeof network !== 'object' || network === null) {
    return undefined;
  }

  return parsePortNumber((network as Record<string, unknown>)[SUPERVISOR_PORT_KEY]);
}

function extractSupervisorIngressPort(payload: unknown): number | undefined {
  const data = extractSupervisorData(payload);
  if (!data || data.ingress !== true) {
    return undefined;
  }

  return parsePortNumber(data.ingress_port);
}

async function querySupervisorAddonInfo(
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
  label: string,
): Promise<{ ok: true; payload: unknown } | { ok: false }> {
  const socketPath = env.SUPERVISOR_SOCKET?.trim();
  if (socketPath) {
    try {
      const payload = await readJsonOverHttp(
        { socketPath, path: '/addons/self/info', method: 'GET' },
        timeoutMs,
      );
      return { ok: true, payload };
    } catch (error) {
      process.stderr.write(
        `EverDash could not read Supervisor ${label} via socket: ${
          error instanceof Error ? error.message : 'unknown error'
        }\n`,
      );
    }
  }

  const supervisorToken = env.SUPERVISOR_TOKEN?.trim();
  if (supervisorToken) {
    try {
      const payload = await readJsonOverHttp(
        {
          host: 'supervisor',
          path: '/addons/self/info',
          method: 'GET',
          headers: { Authorization: `Bearer ${supervisorToken}` },
        },
        timeoutMs,
      );
      return { ok: true, payload };
    } catch (error) {
      process.stderr.write(
        `EverDash could not read Supervisor ${label} via API: ${
          error instanceof Error ? error.message : 'unknown error'
        }\n`,
      );
    }
  }

  return { ok: false };
}

export async function resolveListenPort(options?: {
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}): Promise<number> {
  const env = options?.env ?? process.env;
  const configuredPort = env.EVERDASH_PORT?.trim();
  if (configuredPort) {
    const explicit = Number(configuredPort);
    if (!Number.isInteger(explicit) || explicit < 0 || explicit > 65_535) {
      throw new Error(`Invalid EVERDASH_PORT: ${configuredPort}`);
    }

    return explicit;
  }

  const timeoutMs = options?.timeoutMs ?? SUPERVISOR_TIMEOUT_MS;
  const info = await querySupervisorAddonInfo(env, timeoutMs, 'network port');
  if (!info.ok) {
    return DEFAULT_PORT;
  }

  return extractSupervisorNetworkPort(info.payload) ?? DEFAULT_PORT;
}

export async function resolveIngressPort(options?: {
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}): Promise<number | undefined> {
  const env = options?.env ?? process.env;
  const configuredPort = env.EVERDASH_INGRESS_PORT?.trim();
  if (configuredPort) {
    if (configuredPort === '0' || configuredPort === 'off' || configuredPort === 'false') {
      return undefined;
    }

    const explicit = Number(configuredPort);
    if (!Number.isInteger(explicit) || explicit < 1 || explicit > 65_535) {
      throw new Error(`Invalid EVERDASH_INGRESS_PORT: ${configuredPort}`);
    }

    return explicit;
  }

  const hasSupervisor = Boolean(env.SUPERVISOR_SOCKET?.trim() || env.SUPERVISOR_TOKEN?.trim());
  if (!hasSupervisor) {
    return undefined;
  }

  const timeoutMs = options?.timeoutMs ?? SUPERVISOR_TIMEOUT_MS;
  const info = await querySupervisorAddonInfo(env, timeoutMs, 'ingress port');
  if (!info.ok) {
    return DEFAULT_INGRESS_PORT;
  }

  return extractSupervisorIngressPort(info.payload);
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function sameIPv4Subnet(left: string, right: string, netmask: string): boolean {
  if (!isIPv4(left) || !isIPv4(right) || !isIPv4(netmask)) {
    return false;
  }

  const mask = ipv4ToInt(netmask);
  return (ipv4ToInt(left) & mask) === (ipv4ToInt(right) & mask);
}

export async function resolveIngressNetwork(options?: {
  env?: NodeJS.ProcessEnv;
  lookupSupervisor?: () => Promise<string[]>;
  interfaces?: () => NodeJS.Dict<NetworkInterfaceInfo[]>;
}): Promise<{ bindHost: string; allowedProxyIps: string[] }> {
  const env = options?.env ?? process.env;
  const explicitProxies = env.EVERDASH_INGRESS_PROXY_IPS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  let allowedProxyIps: string[];
  if (explicitProxies?.length) {
    allowedProxyIps = explicitProxies;
  } else {
    let resolved: string[] = [];
    try {
      resolved = options?.lookupSupervisor
        ? await options.lookupSupervisor()
        : (await dnsLookup('supervisor', { all: true })).map((entry) => entry.address);
    } catch {
      resolved = [];
    }

    allowedProxyIps = resolved.length ? [...new Set(resolved)] : [DEFAULT_SUPERVISOR_PROXY_IP];
  }

  const configuredHost = env.EVERDASH_INGRESS_HOST?.trim();
  if (configuredHost) {
    return { bindHost: configuredHost, allowedProxyIps };
  }

  const allInterfaces = (options?.interfaces ?? networkInterfaces)();
  for (const entries of Object.values(allInterfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      if (
        allowedProxyIps.some((proxyIp) => sameIPv4Subnet(entry.address, proxyIp, entry.netmask))
      ) {
        return { bindHost: entry.address, allowedProxyIps };
      }
    }
  }

  return { bindHost: '0.0.0.0', allowedProxyIps };
}

export async function listenWithHostFallback(
  app: Pick<FastifyInstance, 'listen'>,
  options: { host?: string; port: number },
): Promise<void> {
  const configuredHost = options.host?.trim();
  if (configuredHost) {
    await app.listen({ host: configuredHost, port: options.port });
    return;
  }

  try {
    await app.listen({ host: '::', port: options.port });
  } catch (error) {
    const code = getErrorCode(error);
    if (!code || !IPV6_UNAVAILABLE_CODES.has(code)) {
      throw error;
    }

    await app.listen({ host: '0.0.0.0', port: options.port });
  }
}

async function startFromCommandLine() {
  try {
    const [port, ingressPort] = await Promise.all([resolveListenPort(), resolveIngressPort()]);
    const ingressNetwork = ingressPort !== undefined ? await resolveIngressNetwork() : null;
    const { createStandaloneApp } = await import('./standalone');
    const { app, ingressApp } = await createStandaloneApp(
      ingressNetwork
        ? {
            tabletPort: port,
            ingress: {
              allowedProxyIps: ingressNetwork.allowedProxyIps,
              tabletPort: port,
            },
          }
        : { tabletPort: port },
    );
    await listenWithHostFallback(app, {
      host: process.env.EVERDASH_HOST,
      port,
    });
    if (ingressApp && ingressPort !== undefined && ingressNetwork) {
      await ingressApp.listen({ host: ingressNetwork.bindHost, port: ingressPort });
    }
    const stop = () => {
      Promise.all([app.close(), ingressApp?.close()]).finally(() => process.exit(0));
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  } catch (error) {
    process.stderr.write(
      `EverDash failed to start: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
  }
}

async function resolvePortFromCommandLine() {
  try {
    const port = await resolveListenPort();
    process.stdout.write(`${port}\n`);
  } catch (error) {
    process.stderr.write(
      `EverDash could not resolve port, using ${DEFAULT_PORT}: ${
        error instanceof Error ? error.message : 'unknown error'
      }\n`,
    );
    process.stdout.write(`${DEFAULT_PORT}\n`);
  }
}

async function resolveIngressPortFromCommandLine() {
  try {
    const port = await resolveIngressPort();
    process.stdout.write(`${port ?? 0}\n`);
  } catch (error) {
    process.stderr.write(
      `EverDash could not resolve ingress port: ${
        error instanceof Error ? error.message : 'unknown error'
      }\n`,
    );
    process.stdout.write(`${DEFAULT_INGRESS_PORT}\n`);
  }
}

async function resetFromCommandLine() {
  let result: { removed: string | null; revoked: boolean };
  try {
    const { resetConnection } = await import('./auth/reset-connection');
    result = await resetConnection(process.env.EVERDASH_DATA_DIR ?? '/data');
  } catch (error) {
    process.stderr.write(
      `Reset failed: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (!result.removed) {
    process.stdout.write('No Home Assistant connection was configured.\n');
    return;
  }

  process.stdout.write(
    `Forgot the Home Assistant connection to ${result.removed}.${
      result.revoked
        ? ''
        : ' Its token could not be revoked; remove it in Home Assistant if needed.'
    }\nOpen /admin/ to connect again.\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--reset-connection')) {
    resetFromCommandLine();
  } else if (process.argv.includes('--resolve-port')) {
    resolvePortFromCommandLine();
  } else if (process.argv.includes('--resolve-ingress-port')) {
    resolveIngressPortFromCommandLine();
  } else {
    startFromCommandLine();
  }
}
