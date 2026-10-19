import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appManifest = readFileSync(new URL('../everdash/config.yaml', import.meta.url), 'utf8');
const image = appManifest.match(/^image:\s*(\S+)$/m)?.[1];

test('Home Assistant app image uses an untagged repository name', () => {
  assert.equal(image, 'ghcr.io/beniaminrychter/everdash');
});

test('optional direct HTTPS does not reserve host port 8443 by default', () => {
  assert.match(appManifest, /^ports:\s*\n\s+8443\/tcp:\s+null$/m);
});
