import { realpathSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { ServerOptions } from 'node:https';
import { createSecureContext } from 'node:tls';

export interface AddOnOptions {
  directEnabled: boolean;
  publicUrl: string;
  certificatePath: string;
  keyPath: string;
}

export interface ParsedListenerConfig {
  options: AddOnOptions;
  tls?: ServerOptions;
  diagnostic?: string;
}

function stringOption(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? (record[key] as string).trim() : '';
}

function optionsRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function secureCertificatePath(value: string, sslDirectory: string): string {
  const root = realpathSync(sslDirectory);
  const candidate = resolve(root, value.replace(/^\/ssl\/?/, ''));
  const real = realpathSync(candidate);
  if (!real.startsWith(`${root}${sep}`)) {
    throw new Error('Certificate paths must stay inside /ssl.');
  }
  if (!statSync(real).isFile()) {
    throw new Error('Certificate paths must refer to regular files.');
  }
  return real;
}

export function parseAddOnOptions(input: unknown, sslDirectory = '/ssl'): ParsedListenerConfig {
  const record = optionsRecord(input);
  const options: AddOnOptions = {
    directEnabled: record.direct_enabled === true,
    publicUrl: stringOption(record, 'public_url'),
    certificatePath: stringOption(record, 'ssl_certificate'),
    keyPath: stringOption(record, 'ssl_key'),
  };
  if (!options.directEnabled) {
    return { options };
  }

  try {
    const publicUrl = new URL(options.publicUrl);
    if (
      publicUrl.protocol !== 'https:' ||
      publicUrl.username ||
      publicUrl.password ||
      publicUrl.pathname !== '/' ||
      publicUrl.search ||
      publicUrl.hash
    ) {
      throw new Error('The public dashboard URL must be a trusted HTTPS origin without a path.');
    }
    if (!options.certificatePath || !options.keyPath) {
      throw new Error('Select both an HTTPS certificate and private key under /ssl.');
    }
    const certificate = secureCertificatePath(options.certificatePath, sslDirectory);
    const key = secureCertificatePath(options.keyPath, sslDirectory);
    const tls = {
      cert: readFileSync(certificate),
      key: readFileSync(key),
      minVersion: 'TLSv1.2' as const,
    };
    createSecureContext(tls);
    return { options, tls };
  } catch (error) {
    return {
      options: { ...options, directEnabled: false },
      diagnostic: error instanceof Error ? error.message : 'Direct HTTPS could not be configured.',
    };
  }
}

export async function startEverDash(
  optionsPath = process.env.EVERDASH_OPTIONS_FILE ?? '/data/options.json',
) {
  const source = readFileSync(optionsPath, 'utf8');
  const parsed = parseAddOnOptions(JSON.parse(source));
  if (parsed.diagnostic) {
    process.stderr.write(`EverDash direct HTTPS disabled: ${parsed.diagnostic}\n`);
  }
  const { createEverDashApps } = await import('../main');
  const apps = await createEverDashApps({
    publicUrl: parsed.options.directEnabled ? parsed.options.publicUrl : undefined,
    httpsOptions: parsed.options.directEnabled ? parsed.tls : undefined,
    requireIngressPeer: true,
  });
  await apps.management.listen({ host: '0.0.0.0', port: 8099 });
  process.stdout.write('EverDash management Ingress listening on port 8099.\n');
  await apps.directHttp.listen({ host: '0.0.0.0', port: 8095 });
  process.stdout.write('EverDash local HTTP dashboard listening on port 8095.\n');
  if (parsed.options.directEnabled) {
    try {
      await apps.direct.listen({ host: '0.0.0.0', port: 8443 });
      process.stdout.write('EverDash direct HTTPS listening on port 8443.\n');
    } catch (error) {
      process.stderr.write(
        `EverDash direct HTTPS could not start: ${error instanceof Error ? error.message : 'unknown error'}\n`,
      );
    }
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
