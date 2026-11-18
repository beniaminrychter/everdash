import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const repositoryManifest = readFileSync(new URL('../repository.yaml', import.meta.url), 'utf8');
const appManifest = readFileSync(new URL('../everdash/config.yaml', import.meta.url), 'utf8');

function manifestValue(source: string, key: string): string {
  return source.match(new RegExp(`^${key}:\\s*["']?([^"'\\s]+)`, 'm'))?.[1] ?? '';
}

test('Home Assistant repository and app manifests match the published EverDash image', () => {
  assert.equal(
    manifestValue(repositoryManifest, 'url'),
    'https://github.com/beniaminrychter/everdash',
  );
  assert.equal(manifestValue(appManifest, 'url'), 'https://github.com/beniaminrychter/everdash');
  assert.equal(manifestValue(appManifest, 'image'), 'ghcr.io/beniaminrychter/everdash');
  assert.equal(manifestValue(appManifest, 'version'), packageJson.version);
});

test('Home Assistant app uses host networking with configurable port, Ingress sidebar, and Core API access', () => {
  assert.equal(manifestValue(appManifest, 'host_network'), 'true');
  assert.equal(manifestValue(appManifest, 'ingress'), 'true');
  assert.equal(manifestValue(appManifest, 'ingress_port'), '8099');
  assert.equal(manifestValue(appManifest, 'panel_icon'), 'mdi:tablet-dashboard');
  assert.equal(manifestValue(appManifest, 'panel_title'), 'EverDash');
  assert.equal(manifestValue(appManifest, 'panel_admin'), 'true');
  assert.equal(manifestValue(appManifest, 'homeassistant_api'), 'true');
  assert.match(appManifest, /^\s+8095\/tcp:\s+8095$/m);
  assert.equal(manifestValue(appManifest, 'webui'), 'http://[HOST]:[PORT:8095]/admin/');
  assert.equal(manifestValue(appManifest, 'watchdog'), 'http://[HOST]:[PORT:8095]/health');
  assert.match(appManifest, /^\s+-\s+aarch64$/m);
  assert.match(appManifest, /^\s+-\s+amd64$/m);
  assert.equal(existsSync(new URL('../everdash/icon.png', import.meta.url)), true);
  assert.equal(existsSync(new URL('../everdash/logo.png', import.meta.url)), true);
  assert.equal(existsSync(new URL('../everdash/translations/en.yaml', import.meta.url)), true);
});
