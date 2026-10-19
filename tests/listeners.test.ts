import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseAddOnOptions } from '../server/http/listeners';
import { buildApp } from '../server/app';
import { ConfigRepository } from '../server/config/repository';

test('direct HTTPS stays disabled unless explicitly enabled with a valid public origin and TLS material', () => {
  assert.equal(parseAddOnOptions({ direct_enabled: false }).options.directEnabled, false);
  const missing = parseAddOnOptions({
    direct_enabled: true,
    public_url: 'http://dashboard.example',
  });
  assert.equal(missing.options.directEnabled, false);
  assert.match(missing.diagnostic ?? '', /HTTPS origin/);
});

test('management HTTP rejects non-Ingress peers while leaving health checks available', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-ingress-peer-'));
  const app = await buildApp(
    {
      config: new ConfigRepository({ directory }),
      requireIngressPeer: true,
      authorize: async () => true,
      homeAssistant: {
        getState: async () => ({}),
        getStates: async () => [],
        callService: async () => null,
      },
    },
    'management',
  );
  try {
    const protectedResponse = await app.inject({ method: 'GET', url: '/api/bootstrap' });
    assert.equal(protectedResponse.statusCode, 403);
    const health = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(health.statusCode, 200);
    assert.deepEqual(health.json(), { status: 'ok' });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('direct HTTPS rejects missing, outside-root and invalid certificate files while preserving management setup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-ssl-'));
  const ssl = join(directory, 'ssl');
  const elsewhere = join(directory, 'outside.pem');
  await mkdir(ssl);
  await writeFile(join(ssl, 'cert.pem'), 'not a certificate');
  await writeFile(join(ssl, 'key.pem'), 'not a key');
  await writeFile(elsewhere, 'outside');
  try {
    const invalid = parseAddOnOptions(
      {
        direct_enabled: true,
        public_url: 'https://dashboard.example',
        ssl_certificate: '/ssl/cert.pem',
        ssl_key: '/ssl/key.pem',
      },
      ssl,
    );
    assert.equal(invalid.options.directEnabled, false);
    assert.match(invalid.diagnostic ?? '', /PEM|certificate|key/i);

    const outside = parseAddOnOptions(
      {
        direct_enabled: true,
        public_url: 'https://dashboard.example',
        ssl_certificate: elsewhere,
        ssl_key: '/ssl/key.pem',
      },
      ssl,
    );
    assert.equal(outside.options.directEnabled, false);
    assert.match(outside.diagnostic ?? '', /inside \/ssl/);

    const unsafeUrl = parseAddOnOptions(
      {
        direct_enabled: true,
        public_url: 'https://dashboard.example/subpath',
        ssl_certificate: '/ssl/cert.pem',
        ssl_key: '/ssl/key.pem',
      },
      ssl,
    );
    assert.equal(unsafeUrl.options.directEnabled, false);
    assert.match(unsafeUrl.diagnostic ?? '', /without a path/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
