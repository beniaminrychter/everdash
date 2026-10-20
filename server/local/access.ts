import { networkInterfaces } from 'node:os';
import type { NetworkInterfaceInfo } from 'node:os';
import type { SupervisorAccessInfo } from '../supervisor/access';

export interface LocalAccessOptions {
  hostOverride?: string;
  httpPort?: number;
  networkInterfaces?: NodeJS.Dict<NetworkInterfaceInfo[]>;
}

export function createLocalAccessReader(options: LocalAccessOptions = {}) {
  return async (): Promise<SupervisorAccessInfo> => {
    const hostOverride = options.hostOverride?.trim();
    const addresses = hostOverride
      ? [hostOverride]
      : Object.values(options.networkInterfaces ?? networkInterfaces())
          .flatMap((entries) => entries ?? [])
          .filter(
            (entry) =>
              entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('127.'),
          )
          .map((entry) => entry.address)
          .filter((address, index, all) => all.indexOf(address) === index);
    const hostName = hostOverride ?? null;
    const errors = addresses.length
      ? []
      : ['No LAN IPv4 address was detected. Enter the Mac host name or address override.'];

    return {
      hostName,
      addresses,
      httpPort: options.httpPort ?? 8095,
      httpsPort: null,
      errors,
    };
  };
}
