import assert from 'node:assert/strict';
import type { NetworkInterfaceInfo } from 'node:os';
import { test } from 'node:test';
import {
  buildMdnsPtrQuery,
  collectSubnetHosts,
  discoverHomeAssistantInstances,
  extractMdnsCandidates,
  parseMdnsResponse,
  probeHomeAssistantAuth,
} from '../apps/server/src/auth/discover';

function encodeName(name: string): Buffer {
  const parts = name
    .replace(/\.$/, '')
    .split('.')
    .filter(Boolean)
    .map((label) => {
      const buf = Buffer.from(label, 'utf8');

      return Buffer.concat([Buffer.from([buf.length]), buf]);
    });

  return Buffer.concat([...parts, Buffer.from([0])]);
}

function makeRecord(owner: string, type: number, rdata: Buffer): Buffer {
  const name = encodeName(owner);
  const meta = Buffer.alloc(10);

  meta.writeUInt16BE(type, 0);
  meta.writeUInt16BE(1, 2);
  meta.writeUInt32BE(120, 4);
  meta.writeUInt16BE(rdata.length, 8);

  return Buffer.concat([name, meta, rdata]);
}

function makeTxtRdata(entries: string[]): Buffer {
  return Buffer.concat(
    entries.map((entry) => {
      const value = Buffer.from(entry, 'utf8');

      return Buffer.concat([Buffer.from([value.length]), value]);
    }),
  );
}

test('buildMdnsPtrQuery builds a valid PTR query for _home-assistant._tcp.local', () => {
  const query = buildMdnsPtrQuery();

  assert.equal(query.readUInt16BE(4), 1);
  assert.equal(query.readUInt16BE(query.length - 4), 12);
  assert.equal(query.readUInt16BE(query.length - 2), 0x8001);
  assert.equal(query.includes(Buffer.from('_home-assistant')), true);
});

test('parseMdnsResponse and extractMdnsCandidates decode PTR, SRV, TXT, and A records', () => {
  const header = Buffer.alloc(12);

  header.writeUInt16BE(0x8400, 2);
  header.writeUInt16BE(1, 6);
  header.writeUInt16BE(3, 10);

  const instanceName = 'Home._home-assistant._tcp.local';
  const ptrRdata = encodeName(instanceName);
  const srvHeader = Buffer.alloc(6);

  srvHeader.writeUInt16BE(8123, 4);
  const srvRdata = Buffer.concat([srvHeader, encodeName('homeassistant.local')]);
  const txtRdata = makeTxtRdata([
    'location_name=My House',
    'version=2026.1.0',
    'internal_url=http://192.168.1.50:8123',
  ]);
  const aRdata = Buffer.from([192, 168, 1, 50]);

  const packet = Buffer.concat([
    header,
    makeRecord('_home-assistant._tcp.local', 12, ptrRdata),
    makeRecord(instanceName, 33, srvRdata),
    makeRecord(instanceName, 16, txtRdata),
    makeRecord('homeassistant.local', 1, aRdata),
  ]);

  const parsed = parseMdnsResponse(packet);

  assert.deepEqual(parsed.ptrs.get('_home-assistant._tcp.local'), [
    'home._home-assistant._tcp.local',
  ]);
  assert.deepEqual(parsed.srvs.get('home._home-assistant._tcp.local'), {
    port: 8123,
    target: 'homeassistant.local',
  });

  const candidates = extractMdnsCandidates([packet]);

  assert.deepEqual(candidates, [
    {
      origin: 'http://192.168.1.50:8123',
      source: 'mdns',
      name: 'My House',
      version: '2026.1.0',
      groupKey: 'mdns:home._home-assistant._tcp.local',
    },
    {
      origin: 'http://192.168.1.50:8123',
      source: 'mdns',
      name: 'My House',
      version: '2026.1.0',
      groupKey: 'mdns:home._home-assistant._tcp.local',
    },
    {
      origin: 'http://homeassistant.local:8123',
      source: 'mdns',
      name: 'My House',
      version: '2026.1.0',
      groupKey: 'mdns:home._home-assistant._tcp.local',
      resolvedIps: ['192.168.1.50'],
    },
  ]);

  // Malformed or truncated packets never throw.
  assert.deepEqual(parseMdnsResponse(Buffer.from([0, 1, 2])).ptrs.size, 0);
});

test('collectSubnetHosts scans /24 LAN blocks, clamps wider masks, and ignores loopback/link-local', () => {
  const interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = {
    lo0: [
      {
        address: '127.0.0.1',
        netmask: '255.0.0.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: true,
        cidr: '127.0.0.1/8',
      },
    ],
    en0: [
      {
        address: '192.168.1.42',
        netmask: '255.255.0.0',
        family: 'IPv4',
        mac: '00:11:22:33:44:55',
        internal: false,
        cidr: '192.168.1.42/16',
      },
    ],
    utun0: [
      {
        address: '169.254.10.2',
        netmask: '255.255.0.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: false,
        cidr: '169.254.10.2/16',
      },
    ],
  };

  const hosts = collectSubnetHosts(interfaces);

  assert.equal(hosts.length, 254);
  assert.equal(hosts[0], '192.168.1.1');
  assert.equal(hosts[hosts.length - 1], '192.168.1.254');
});

test('probeHomeAssistantAuth confirms Home Assistant auth catalog and rejects non-HA servers', async () => {
  const haFetch = (async () =>
    Response.json(
      { providers: [{ type: 'homeassistant', name: 'Local' }] },
      { status: 200 },
    )) as typeof fetch;
  const routerFetch = (async () =>
    Response.json({ status: 'ok' }, { status: 200 })) as typeof fetch;
  const failFetch = (async () => new Response('Unauthorized', { status: 401 })) as typeof fetch;

  assert.equal(await probeHomeAssistantAuth('http://192.168.1.50:8123', { fetch: haFetch }), true);
  assert.equal(
    await probeHomeAssistantAuth('http://192.168.1.1:8123', { fetch: routerFetch }),
    false,
  );
  assert.equal(
    await probeHomeAssistantAuth('http://192.168.1.2:8123', { fetch: failFetch }),
    false,
  );
  assert.equal(await probeHomeAssistantAuth('not a url', { fetch: haFetch }), false);
});

test('discoverHomeAssistantInstances merges mDNS metadata with subnet scan and filters non-HA hosts', async () => {
  const interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = {
    en0: [
      {
        address: '192.168.1.2',
        netmask: '255.255.255.0',
        family: 'IPv4',
        mac: '00:11:22:33:44:55',
        internal: false,
        cidr: '192.168.1.2/24',
      },
    ],
  };

  const discovered = await discoverHomeAssistantInstances({
    networkInterfaces: () => interfaces,
    includeLoopback: false,
    wellKnownOrigins: ['http://homeassistant.local:8123'],
    discoverMdnsCandidates: async () => [
      {
        origin: 'http://192.168.1.50:8123',
        source: 'mdns',
        name: 'Home',
        version: '2026.1.0',
      },
    ],
    checkTcpPort: async (host) =>
      host === '192.168.1.50' || host === '192.168.1.60' || host === '192.168.1.70',
    fetch: (async (input: string | URL) => {
      const url = String(input);

      if (
        url.startsWith('http://192.168.1.50:8123') ||
        url.startsWith('http://192.168.1.60:8123')
      ) {
        return Response.json(
          { providers: [{ type: 'homeassistant', name: 'Home Assistant Local' }] },
          { status: 200 },
        );
      }

      return new Response('not home assistant', { status: 404 });
    }) as typeof fetch,
  });

  assert.deepEqual(discovered, [
    {
      origin: 'http://192.168.1.50:8123',
      origins: ['http://192.168.1.50:8123'],
      source: 'mdns',
      name: 'Home',
      version: '2026.1.0',
    },
    {
      origin: 'http://192.168.1.60:8123',
      origins: ['http://192.168.1.60:8123'],
      source: 'network',
    },
  ]);
});

test('discoverHomeAssistantInstances groups multiple URLs belonging to the same instance', async () => {
  const uuid = '9e87c99c1225491f93fa807030508518';
  const discovered = await discoverHomeAssistantInstances({
    networkInterfaces: () => ({}),
    includeLoopback: false,
    wellKnownOrigins: ['http://homeassistant.local:8123'],
    discoverMdnsCandidates: async () => [
      {
        origin: 'https://home.example.com',
        source: 'mdns',
        name: 'My Home',
        version: '2026.10.3',
        groupKey: `mdns-uuid:${uuid}`,
      },
      {
        origin: `http://${uuid}.local:8123`,
        source: 'mdns',
        name: 'My Home',
        version: '2026.10.3',
        groupKey: `mdns-uuid:${uuid}`,
        resolvedIps: ['192.168.1.33'],
      },
      {
        origin: 'http://192.168.1.33:8123',
        source: 'mdns',
        name: 'My Home',
        version: '2026.10.3',
        groupKey: `mdns-uuid:${uuid}`,
      },
    ],
    resolveHostAddresses: async (hostname) => {
      if (hostname === 'homeassistant.local') {
        return ['192.168.1.33'];
      }

      return [];
    },
    fetch: (async (input: string | URL) => {
      const url = String(input);

      if (
        url.startsWith('http://192.168.1.33:8123') ||
        url.startsWith(`http://${uuid}.local:8123`) ||
        url.startsWith('http://homeassistant.local:8123') ||
        url.startsWith('https://home.example.com')
      ) {
        return Response.json(
          { providers: [{ type: 'homeassistant', name: 'Home Assistant Local' }] },
          { status: 200 },
        );
      }

      return new Response('not found', { status: 404 });
    }) as typeof fetch,
  });

  assert.deepEqual(discovered, [
    {
      origin: 'http://192.168.1.33:8123',
      origins: [
        'http://192.168.1.33:8123',
        'http://homeassistant.local:8123',
        'https://home.example.com',
        `http://${uuid}.local:8123`,
      ],
      source: 'mdns',
      name: 'My Home',
      version: '2026.10.3',
    },
  ]);
});
