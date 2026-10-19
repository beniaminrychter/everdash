import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupervisorAccessReader } from '../server/supervisor/access';

test('Supervisor access discovery reports hostname, LAN addresses and active port mappings', async () => {
  const fixtures: Record<string, unknown> = {
    'http://supervisor/addons/self/info': {
      network: { '8095/tcp': 8095, '8443/tcp': 8443 },
      options: { direct_enabled: true },
    },
    'http://supervisor/host/info': { hostname: 'homeassistant' },
    'http://supervisor/network/info': {
      interfaces: [{ ipv4: { address: ['192.168.1.40/24', '10.0.0.5/24'] } }],
    },
  };
  const read = createSupervisorAccessReader('fixture-token', async (input, init) => {
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer fixture-token');
    return Response.json(fixtures[String(input)]);
  });
  assert.deepEqual(await read(), {
    hostName: 'homeassistant',
    addresses: ['192.168.1.40', '10.0.0.5'],
    httpPort: 8095,
    httpsPort: 8443,
    errors: [],
  });
});

test('Supervisor access discovery exposes a setup error when the dashboard port is not mapped', async () => {
  const read = createSupervisorAccessReader('fixture-token', async (input) => {
    const fixture = String(input).endsWith('/addons/self/info')
      ? { network: { '8095/tcp': null, '8443/tcp': null }, options: { direct_enabled: false } }
      : String(input).endsWith('/host/info')
        ? { hostname: 'homeassistant' }
        : { interfaces: [] };
    return Response.json(fixture);
  });
  const result = await read();
  assert.equal(result.httpPort, null);
  assert.ok(result.errors.some((message) => message.includes('8095')));
});
