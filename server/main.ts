import { resolve } from 'node:path';
import { ConfigRepository } from './config/repository';
import { buildApp } from './app';
import { createSupervisorHomeAssistant } from './home-assistant/client';
import { DeviceRepository } from './auth/devices';
import { PairingService } from './auth/pairing';
import { createAuthorizer, DeviceSessions } from './auth/sessions';
import type { FastifyRequest } from 'fastify';
import type { ServerOptions } from 'node:https';
import { pathToFileURL } from 'node:url';

export interface RuntimeOptions {
  dataDirectory?: string;
  staticDirectory?: string;
  supervisorToken?: string;
  publicUrl?: string;
  httpsOptions?: ServerOptions;
  requireIngressPeer?: boolean;
}

export async function createEverDashApps(options: RuntimeOptions = {}) {
  const token = options.supervisorToken ?? process.env.SUPERVISOR_TOKEN;
  if (!token) {
    throw new Error('SUPERVISOR_TOKEN is required by the EverDash server.');
  }
  const dataDirectory = options.dataDirectory ?? process.env.EVERDASH_DATA_DIR ?? '/data';
  const config = new ConfigRepository({ directory: dataDirectory });
  const devices = new DeviceRepository({ directory: dataDirectory });
  const pairing = new PairingService({ devices });
  const deviceSessions = new DeviceSessions(devices);
  const homeAssistant = createSupervisorHomeAssistant({ token });
  const publicUrl = options.publicUrl ?? process.env.EVERDASH_PUBLIC_URL;
  const authorize = createAuthorizer(devices);
  const expectedOrigin = (request: FastifyRequest, mode: 'management' | 'direct') => {
    if (mode === 'direct') {
      if (!publicUrl) {
        return null;
      }
      try {
        const url = new URL(publicUrl);
        if (
          url.protocol === 'https:' &&
          !url.username &&
          !url.password &&
          url.pathname === '/' &&
          !url.search &&
          !url.hash
        ) {
          return url.origin;
        }
      } catch {
        return null;
      }
      return null;
    }
    const origin = request.headers.origin;
    if (typeof origin !== 'string') {
      return null;
    }
    try {
      const url = new URL(origin);
      return ['http:', 'https:'].includes(url.protocol) && url.origin === origin
        ? url.origin
        : null;
    } catch {
      return null;
    }
  };
  const shared = {
    config,
    devices,
    deviceSessions,
    pairing,
    homeAssistant,
    authorize,
    expectedOrigin,
    logger: true,
    staticDirectory: options.staticDirectory ?? resolve('dist'),
    requireIngressPeer: options.requireIngressPeer ?? false,
  };
  const management = await buildApp(shared, 'management');
  const direct = await buildApp({ ...shared, httpsOptions: options.httpsOptions }, 'direct');
  return { config, devices, direct, management };
}

async function startFromCommandLine() {
  try {
    const { startEverDash } = await import('./http/listeners');
    await startEverDash();
  } catch (error) {
    process.stderr.write(
      `EverDash failed to start: ${error instanceof Error ? error.message : 'unknown error'}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startFromCommandLine();
}
