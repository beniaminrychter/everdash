import { resolve } from 'node:path';
import { ConfigRepository } from './config/repository';
import { buildApp } from './app';
import { createSupervisorHomeAssistant } from './home-assistant/client';

export interface RuntimeOptions {
  dataDirectory?: string;
  staticDirectory?: string;
  supervisorToken?: string;
}

export async function createEverDashApps(options: RuntimeOptions = {}) {
  const token = options.supervisorToken ?? process.env.SUPERVISOR_TOKEN;
  if (!token) {
    throw new Error('SUPERVISOR_TOKEN is required by the EverDash server.');
  }
  const config = new ConfigRepository({ directory: options.dataDirectory ?? '/data' });
  const homeAssistant = createSupervisorHomeAssistant({ token });
  const shared = {
    config,
    homeAssistant,
    logger: true,
    staticDirectory: options.staticDirectory ?? resolve('dist'),
  };
  // Authorization remains deny-by-default until the pairing and Ingress boundary is installed.
  const management = await buildApp(shared, 'management');
  const direct = await buildApp(shared, 'direct');
  return { config, direct, management };
}
