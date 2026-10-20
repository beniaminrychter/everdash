import assert from 'node:assert/strict';
import test from 'node:test';
import type { NetworkInterfaceInfo } from 'node:os';
import { createLocalAccessReader } from '../server/local/access';

const interfaceAddress = (address: string, family: 'IPv4' | 'IPv6' = 'IPv4') =>
  ({
    address,
    netmask: family === 'IPv4' ? '255.255.255.0' : 'ffff:ffff:ffff:ffff::',
    family,
    mac: '00:00:00:00:00:00',
    internal: address === '127.0.0.1',
    cidr: null,
  }) as NetworkInterfaceInfo;

test('prefers the configured LAN host override', async () => {
  const read = createLocalAccessReader({
    hostOverride: 'everdash-mac.local',
    networkInterfaces: { en0: [interfaceAddress('192.168.1.42')] },
  });

  assert.deepEqual(await read(), {
    hostName: 'everdash-mac.local',
    addresses: ['everdash-mac.local'],
    httpPort: 8095,
    httpsPort: null,
    errors: [],
  });
});

test('discovers a non-loopback IPv4 address when no override is set', async () => {
  const read = createLocalAccessReader({
    networkInterfaces: {
      lo0: [interfaceAddress('127.0.0.1')],
      en0: [interfaceAddress('192.168.1.42')],
    },
  });

  assert.deepEqual((await read()).addresses, ['192.168.1.42']);
});

test('reports an error instead of fabricating an address when none is available', async () => {
  const read = createLocalAccessReader({
    networkInterfaces: { lo0: [interfaceAddress('127.0.0.1')] },
  });

  const info = await read();
  assert.equal(info.hostName, null);
  assert.deepEqual(info.addresses, []);
  assert.ok(info.errors.some((error) => /LAN .*address/.test(error)));
});
