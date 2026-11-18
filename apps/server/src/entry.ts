import type { FastifyInstance } from 'fastify';
import { request as httpRequest } from 'node:http';
import type { RequestOptions } from 'node:http';
import { pathToFileURL } from 'node:url';

const DEFAULT_PORT = 8095;
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

function extractSupervisorNetworkPort(payload: unknown): number | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const { data } = payload as { data?: unknown };
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  const { network } = data as { network?: unknown };
  if (typeof network !== 'object' || network === null) {
    return undefined;
  }

  return parsePortNumber((network as Record<string, unknown>)[SUPERVISOR_PORT_KEY]);
}

async function querySupervisorPort(
  options: RequestOptions,
  timeoutMs: number,
): Promise<number | undefined> {
  const payload = await readJsonOverHttp(options, timeoutMs);
  return extractSupervisorNetworkPort(payload);
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
  const socketPath = env.SUPERVISOR_SOCKET?.trim();
  if (socketPath) {
    try {
      const port = await querySupervisorPort(
        { socketPath, path: '/addons/self/info', method: 'GET' },
        timeoutMs,
      );
      return port ?? DEFAULT_PORT;
    } catch (error) {
      process.stderr.write(
        `EverDash could not read Supervisor network port via socket, using ${DEFAULT_PORT}: ${
          error instanceof Error ? error.message : 'unknown error'
        }\n`,
      );
    }
  }

  const supervisorToken = env.SUPERVISOR_TOKEN?.trim();
  if (supervisorToken) {
    try {
      const port = await querySupervisorPort(
        {
          host: 'supervisor',
          path: '/addons/self/info',
          method: 'GET',
          headers: { Authorization: `Bearer ${supervisorToken}` },
        },
        timeoutMs,
      );
      return port ?? DEFAULT_PORT;
    } catch (error) {
      process.stderr.write(
        `EverDash could not read Supervisor network port via API, using ${DEFAULT_PORT}: ${
          error instanceof Error ? error.message : 'unknown error'
        }\n`,
      );
    }
  }

  return DEFAULT_PORT;
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
    const port = await resolveListenPort();
    const { createStandaloneApp } = await import('./standalone');
    const { app } = await createStandaloneApp();
    await listenWithHostFallback(app, {
      host: process.env.EVERDASH_HOST,
      port,
    });
    const stop = () => {
      app.close().finally(() => process.exit(0));
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
  } else {
    startFromCommandLine();
  }
}
