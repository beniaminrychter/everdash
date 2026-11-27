import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import type { NetworkInterfaceInfo } from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildApp } from '../apps/server/src/app';
import { TabletAccess } from '../apps/server/src/auth/tablet-access';
import { ConfigRepository } from '../apps/server/src/config/repository';
import {
  classifyProbeError,
  extractSupervisorPrimaryIpv4,
  isDockerOrSupervisorBridgeIpv4,
  isExternalHostname,
  isPrivateLanIpv4,
  probeDashboardAddress,
  resolveDashboardAddresses,
} from '../apps/server/src/http/dashboard-addresses';
import { createStandaloneApp } from '../apps/server/src/standalone';

function ipv4Interface(address: string, internal = false): NetworkInterfaceInfo {
  return {
    address,
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal,
    cidr: `${address}/24`,
  };
}

function reachableProbe() {
  const probed: string[] = [];

  return {
    probed,
    probe: async (url: string) => {
      probed.push(url);
      return { url, reachable: true };
    },
  };
}

test('prefers real private LAN IPv4 over Docker and Supervisor bridge subnets', async () => {
  assert.equal(isPrivateLanIpv4('192.168.1.40'), true);
  assert.equal(isPrivateLanIpv4('10.0.0.15'), true);
  assert.equal(isPrivateLanIpv4('172.20.1.5'), true);
  assert.equal(isPrivateLanIpv4('8.8.8.8'), false);
  assert.equal(isDockerOrSupervisorBridgeIpv4('172.30.32.2'), true);
  assert.equal(isDockerOrSupervisorBridgeIpv4('172.30.33.4'), true);
  assert.equal(isDockerOrSupervisorBridgeIpv4('172.17.0.2'), true);
  assert.equal(isDockerOrSupervisorBridgeIpv4('172.20.1.5'), false);

  const { probe } = reachableProbe();

  const result = await resolveDashboardAddresses(
    {
      isIngress: true,
      tabletPort: 8095,
      browserOrigin: 'https://your-smart-home.com',
    },
    {
      networkInterfaces: () => ({
        lo: [ipv4Interface('127.0.0.1', true)],
        docker0: [ipv4Interface('172.17.0.2')],
        hassio: [ipv4Interface('172.30.32.5'), ipv4Interface('172.30.33.9')],
        linklocal: [ipv4Interface('169.254.10.20')],
        eth0: [ipv4Interface('192.168.1.50')],
      }),
      env: {},
      probe,
    },
  );

  assert.deepEqual(result.local, {
    url: 'http://192.168.1.50:8095/',
    reachable: true,
  });
  assert.deepEqual(result.external, {
    url: 'http://your-smart-home.com:8095/',
    reachable: true,
  });
});

test('uses Home Assistant internal_url (direct IPv4 and DNS-resolved hostname) before interfaces', async () => {
  const directIp = await resolveDashboardAddresses(
    {
      isIngress: true,
      tabletPort: 8095,
      browserOrigin: 'https://home.example.com',
    },
    {
      getHaConfig: async () => ({
        internal_url: 'http://10.10.0.25:8123',
        external_url: 'https://home.example.com',
      }),
      networkInterfaces: () => ({
        eth0: [ipv4Interface('192.168.1.99')],
      }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(directIp.local?.url, 'http://10.10.0.25:8095/');
  assert.equal(directIp.external?.url, 'http://home.example.com:8095/');

  const resolvedHostname = await resolveDashboardAddresses(
    {
      isIngress: true,
      tabletPort: 80,
      browserOrigin: 'https://home.example.com',
    },
    {
      getHaConfig: async () => ({
        internal_url: 'http://homeassistant.local:8123',
      }),
      lookupIpv4: async (hostname) => {
        assert.equal(hostname, 'homeassistant.local');
        return '192.168.50.10';
      },
      networkInterfaces: () => ({
        hassio: [ipv4Interface('172.30.33.5')],
      }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  // Port 80 is omitted from formatted HTTP URLs.
  assert.equal(resolvedHostname.local?.url, 'http://192.168.50.10/');
  assert.equal(resolvedHostname.external?.url, 'http://home.example.com/');
});

test('uses Supervisor primary IPv4 when host interfaces only expose bridge subnets', async () => {
  assert.equal(
    extractSupervisorPrimaryIpv4({
      result: 'ok',
      data: {
        interfaces: [
          {
            interface: 'docker0',
            primary: false,
            connected: true,
            ipv4: { address: ['172.17.0.1/16'] },
          },
          {
            interface: 'end0',
            primary: true,
            connected: true,
            ipv4: { address: ['192.168.88.12/24'] },
          },
        ],
      },
    }),
    '192.168.88.12',
  );

  const result = await resolveDashboardAddresses(
    {
      isIngress: true,
      tabletPort: 8095,
      browserOrigin: 'https://smart.example.org',
    },
    {
      networkInterfaces: () => ({
        eth0: [ipv4Interface('172.30.33.4')],
      }),
      getSupervisorPrimaryIp: async () => '192.168.88.12',
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(result.local?.url, 'http://192.168.88.12:8095/');
  assert.equal(result.external?.url, 'http://smart.example.org:8095/');
});

test('direct access uses LAN request origin directly and preserves protocol/port for external direct origin', async () => {
  const directLan = await resolveDashboardAddresses(
    {
      isIngress: false,
      tabletPort: 8095,
      requestOrigin: 'http://192.168.1.44:8095',
    },
    {
      getHaConfig: async () => ({
        external_url: 'https://ha.example.net',
      }),
      networkInterfaces: () => ({
        eth0: [ipv4Interface('10.0.0.5')],
      }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(directLan.local?.url, 'http://192.168.1.44:8095/');
  assert.equal(directLan.external?.url, 'http://ha.example.net:8095/');

  const directExternal = await resolveDashboardAddresses(
    {
      isIngress: false,
      tabletPort: 8095,
      browserOrigin: 'https://everdash.example.com:8443',
    },
    {
      networkInterfaces: () => ({
        eth0: [ipv4Interface('192.168.1.44')],
      }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(directExternal.local?.url, 'http://192.168.1.44:8095/');
  assert.equal(directExternal.external?.url, 'https://everdash.example.com:8443/');
});

test('omits external when none exists, when hostname is local, or when equal to local', async () => {
  assert.equal(isExternalHostname('your-smart-home.com'), true);
  assert.equal(isExternalHostname('203.0.113.10'), true);
  assert.equal(isExternalHostname('192.168.1.10'), false);
  assert.equal(isExternalHostname('10.0.0.1'), false);
  assert.equal(isExternalHostname('127.0.0.1'), false);
  assert.equal(isExternalHostname('localhost'), false);
  assert.equal(isExternalHostname('[::1]'), false);
  assert.equal(isExternalHostname('169.254.1.2'), false);
  assert.equal(isExternalHostname('homeassistant.local'), false);
  assert.equal(isExternalHostname('homeassistant'), false);

  const localOnly = await resolveDashboardAddresses(
    {
      isIngress: false,
      browserOrigin: 'http://homeassistant.local:8095',
      requestOrigin: 'http://192.168.1.20:8095',
    },
    {
      getHaConfig: async () => ({ internal_url: 'http://192.168.1.20:8123', external_url: null }),
      networkInterfaces: () => ({ eth0: [ipv4Interface('192.168.1.20')] }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(localOnly.local?.url, 'http://192.168.1.20:8095/');
  assert.equal(localOnly.external, null);

  const samePublicIp = await resolveDashboardAddresses(
    {
      isIngress: false,
      tabletPort: 8095,
      browserOrigin: 'http://203.0.113.50:8095',
    },
    {
      networkInterfaces: () => ({ eth0: [ipv4Interface('203.0.113.50')] }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(samePublicIp.local?.url, 'http://203.0.113.50:8095/');
  assert.equal(samePublicIp.external, null);

  const loopbackFallback = await resolveDashboardAddresses(
    {
      isIngress: false,
      browserOrigin: 'http://127.0.0.1:8095',
    },
    {
      networkInterfaces: () => ({ lo: [ipv4Interface('127.0.0.1', true)] }),
      env: {},
      probe: async (url) => ({ url, reachable: true }),
    },
  );

  assert.equal(loopbackFallback.local?.url, 'http://127.0.0.1:8095/');
  assert.equal(loopbackFallback.external, null);
});

test('probeDashboardAddress classifies healthy responses, wrong services, and network errors', async () => {
  const ok = await probeDashboardAddress('http://192.168.1.10:8095/', {
    fetchImpl: async (input) => {
      assert.equal(String(input), 'http://192.168.1.10:8095/health');
      return Response.json({ status: 'ok' }, { status: 200 });
    },
  });
  assert.deepEqual(ok, { url: 'http://192.168.1.10:8095/', reachable: true });

  const otherJson = await probeDashboardAddress('http://192.168.1.10:8095/', {
    fetchImpl: async () => Response.json({ status: 'healthy' }, { status: 200 }),
  });
  assert.deepEqual(otherJson, {
    url: 'http://192.168.1.10:8095/',
    reachable: false,
    reasonCode: 'wrong_service',
    httpStatus: 200,
  });

  const html404 = await probeDashboardAddress('http://192.168.1.10:8095/', {
    fetchImpl: async () => new Response('<html>Not found</html>', { status: 404 }),
  });
  assert.deepEqual(html404, {
    url: 'http://192.168.1.10:8095/',
    reachable: false,
    reasonCode: 'wrong_service',
    httpStatus: 404,
  });

  const badGateway = await probeDashboardAddress('http://your-smart-home.com:8095/', {
    fetchImpl: async () => new Response('Bad Gateway', { status: 502 }),
  });
  assert.deepEqual(badGateway, {
    url: 'http://your-smart-home.com:8095/',
    reachable: false,
    reasonCode: 'wrong_service',
    httpStatus: 502,
  });

  const errorCases: [unknown, string][] = [
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      }),
      'connection_refused',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: new AggregateError(
          [Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })],
          'All connection attempts failed',
        ),
      }),
      'connection_refused',
    ],
    [
      Object.assign(new Error('The operation was aborted due to timeout'), {
        name: 'TimeoutError',
      }),
      'timeout',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('connect timeout'), { code: 'UND_ERR_CONNECT_TIMEOUT' }),
      }),
      'timeout',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' }),
      }),
      'dns_failed',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('self-signed certificate'), {
          code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
        }),
      }),
      'tls_error',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('wrong version number'), {
          code: 'ERR_SSL_WRONG_VERSION_NUMBER',
        }),
      }),
      'tls_error',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('connect ENETUNREACH'), { code: 'ENETUNREACH' }),
      }),
      'network_unreachable',
    ],
    [
      Object.assign(new TypeError('fetch failed'), {
        cause: new Error('unexpected redirect'),
      }),
      'wrong_service',
    ],
    [new Error('something unexpected'), 'unknown'],
  ];

  for (const [err, expectedReason] of errorCases) {
    assert.equal(classifyProbeError(err), expectedReason);

    const probed = await probeDashboardAddress('http://your-smart-home.com:8095/', {
      fetchImpl: async () => {
        throw err;
      },
    });
    assert.deepEqual(probed, {
      url: 'http://your-smart-home.com:8095/',
      reachable: false,
      reasonCode: expectedReason,
    });
  }
});

test('GET /api/manage/devices/addresses enforces admin access and responds for admin and ingress', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-addresses-route-'));

  try {
    const standalone = await createStandaloneApp({
      dataDirectory: directory,
      logger: false,
      ingress: { allowedProxyIps: ['127.0.0.1'], tabletPort: 8095 },
    });

    try {
      const unauth = await standalone.app.inject({
        method: 'GET',
        url: '/api/manage/devices/addresses',
        headers: { cookie: 'everdash_device=fake' },
      });
      assert.equal(unauth.statusCode, 401);
    } finally {
      await standalone.app.close();
      await standalone.ingressApp?.close();
    }

    // Authenticated direct app bound to an ephemeral port can probe its own /health endpoint.
    const config = new ConfigRepository({ directory });
    const tabletAccess = await TabletAccess.open(directory);
    let listenPort = 0;

    const authedApp = await buildApp({
      config,
      tabletAccess,
      access: {
        isAdmin: () => true,
        isTablet: () => false,
      },
      homeAssistant: {
        getStates: async () => [],
        getState: async () => null,
        getConfig: async () => ({ internal_url: null, external_url: null }),
        callService: async () => ({}),
      },
      logger: false,
    });

    try {
      await authedApp.listen({ host: '127.0.0.1', port: 0 });
      const address = authedApp.server.address();
      assert.ok(address && typeof address !== 'string');
      listenPort = address.port;

      // Test authenticated direct request where HA internal_url points at loopback/LAN is bypassed via direct request.
      const res = await authedApp.inject({
        method: 'GET',
        url: `/api/manage/devices/addresses?origin=${encodeURIComponent(`http://127.0.0.1:${listenPort}`)}`,
        headers: { host: `127.0.0.1:${listenPort}` },
      });
      assert.equal(res.statusCode, 200);
      const body = res.json() as {
        local: { url: string; reachable: boolean } | null;
        external: { url: string; reachable: boolean } | null;
      };
      assert.ok(body.local);
      assert.equal(typeof body.local.url, 'string');
      assert.equal(typeof body.local.reachable, 'boolean');
      assert.equal(body.external, null);

      // Invalid origin query param is ignored rather than causing 400/500.
      const invalidOriginRes = await authedApp.inject({
        method: 'GET',
        url: '/api/manage/devices/addresses?origin=javascript:alert(1)',
        headers: { host: `127.0.0.1:${listenPort}` },
      });
      assert.equal(invalidOriginRes.statusCode, 200);
    } finally {
      await authedApp.close();
    }

    // Ingress app allows trusted proxy IP and returns 200.
    const ingressApp = await buildApp({
      config,
      tabletAccess,
      access: {
        isAdmin: () => true,
        isTablet: () => false,
      },
      ingress: {
        allowedProxyIps: ['127.0.0.1'],
        tabletPort: listenPort || 8095,
      },
      homeAssistant: {
        getStates: async () => [],
        getState: async () => null,
        getConfig: async () => ({ internal_url: null, external_url: null }),
        callService: async () => ({}),
      },
      logger: false,
    });

    try {
      const ingressRes = await ingressApp.inject({
        method: 'GET',
        url: '/api/manage/devices/addresses',
        remoteAddress: '127.0.0.1',
      });
      assert.equal(ingressRes.statusCode, 200);
      const payload = ingressRes.json() as { local: unknown; external: unknown };
      assert.ok('local' in payload);
      assert.ok('external' in payload);
    } finally {
      await ingressApp.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
