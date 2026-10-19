export interface SupervisorAccessInfo {
  hostName: string | null;
  addresses: string[];
  httpPort: number | null;
  httpsPort: number | null;
  errors: string[];
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mappedPort(network: unknown, key: string): number | null {
  if (!isRecord(network)) {
    return null;
  }
  const value = network[key];
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 65535
    ? value
    : null;
}

function addressesFrom(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.interfaces)) {
    return [];
  }
  const addresses = new Set<string>();
  for (const networkInterface of value.interfaces) {
    if (!isRecord(networkInterface) || !isRecord(networkInterface.ipv4)) {
      continue;
    }
    const candidates = networkInterface.ipv4.address;
    if (!Array.isArray(candidates)) {
      continue;
    }
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const address = candidate.split('/')[0]?.trim();
        if (address && address !== '127.0.0.1' && address !== '0.0.0.0') {
          addresses.add(address);
        }
      }
    }
  }
  return [...addresses];
}

export function createSupervisorAccessReader(
  token: string,
  request: typeof fetch = fetch,
): () => Promise<SupervisorAccessInfo> {
  async function get(path: string): Promise<unknown> {
    const response = await request(new URL(path, 'http://supervisor/'), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
    });
    if (!response.ok) {
      throw new Error(`Supervisor returned HTTP ${response.status}.`);
    }
    return response.json() as Promise<unknown>;
  }

  return async () => {
    const results = await Promise.allSettled([
      get('addons/self/info'),
      get('host/info'),
      get('network/info'),
    ]);
    const errors: string[] = [];
    const names = ['add-on port mapping', 'Home Assistant hostname', 'LAN network addresses'];
    const values: unknown[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      errors.push(`Could not read ${names[index]} from Supervisor.`);
      return null;
    });
    const [addon, host, network] = values;
    const hostName = isRecord(host) && typeof host.hostname === 'string' ? host.hostname : null;
    const httpPort = isRecord(addon) ? mappedPort(addon.network, '8095/tcp') : null;
    const httpsPort =
      isRecord(addon) && isRecord(addon.options) && addon.options.direct_enabled === true
        ? mappedPort(addon.network, '8443/tcp')
        : null;
    if (!httpPort && !errors.some((message) => message.includes('add-on port mapping'))) {
      errors.push('EverDash port 8095 is not mapped to the Home Assistant host.');
    }
    if (!hostName && !errors.some((message) => message.includes('hostname'))) {
      errors.push('Home Assistant did not report a hostname. Enter a local host override.');
    }
    return {
      hostName,
      addresses: addressesFrom(network),
      httpPort,
      httpsPort,
      errors,
    };
  };
}
