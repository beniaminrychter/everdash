import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultAccent, deviceTint } from '@everdash/dashboard/features/accessories/data/tint';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (light! + 0.05) / (dark! + 0.05);
}

const accents = ['#ffc414', '#ff6b6b', '#2f95ff'];

test('a device colour becomes a fill, ring and disc tint plus a light and a dark ink', () => {
  assert.deepEqual(deviceTint('#ffc414'), {
    color: '#ffc414',
    fill: 'rgba(255, 196, 20, 0.17)',
    ring: 'rgba(255, 196, 20, 0.45)',
    disc: 'rgba(255, 196, 20, 0.26)',
    inkLight: '#8c6c0b',
    inkDark: '#ffd966',
  });
});

test('the ink is readable on the light and the dark tile surface', () => {
  for (const accent of accents) {
    const tint = deviceTint(accent);

    assert.ok(contrast(tint.inkLight, '#ffffff') >= 4.5, `${accent} light ink`);
    assert.ok(contrast(tint.inkDark, '#283444') >= 4.5, `${accent} dark ink`);
  }
});

test('a malformed device colour falls back to the default accent without NaN', () => {
  for (const bad of ['', 'red', '#fff', '#ggg000']) {
    const tint = deviceTint(bad);

    assert.deepEqual(tint, deviceTint(defaultAccent));
    assert.ok(!JSON.stringify(tint).includes('NaN'), bad);
  }
});
