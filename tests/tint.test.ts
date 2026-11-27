import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDevice,
  deviceAccent,
  mapState,
} from '@everdash/dashboard/features/accessories/data/model';
import { defaultAccent, deviceTint, glyphOn } from '@everdash/dashboard/shared/color/tint';

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

const accents = ['#ffc414', '#ff6b6b', '#2f95ff', defaultAccent, '#3489fa', '#ffffff', '#0000ff'];

/** The icon disc as drawn: the accent at 26% over the lit tile surface. */
function litDisc(accent: string, surface: string): string {
  const hex = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(accent.slice(start, start + 2), 16);
    const base = Number.parseInt(surface.slice(start, start + 2), 16);

    return Math.round(channel * 0.26 + base * 0.74)
      .toString(16)
      .padStart(2, '0');
  });

  return `#${hex.join('')}`;
}

test('a device colour becomes a disc tint plus a light and a dark ink', () => {
  assert.deepEqual(deviceTint('#ffc414'), {
    color: '#ffc414',
    disc: 'rgba(255, 196, 20, 0.26)',
    inkLight: '#80620a',
    inkDark: '#ffdf7e',
  });
});

test('the ink is readable on the icon disc as drawn, in the light and the dark theme', () => {
  for (const accent of accents) {
    const tint = deviceTint(accent);

    assert.ok(contrast(tint.inkLight, litDisc(accent, '#ffffff')) >= 4.5, `${accent} light ink`);
    assert.ok(contrast(tint.inkDark, litDisc(accent, '#354458')) >= 4.5, `${accent} dark ink`);
  }
});

test('a malformed device colour falls back to the default accent without NaN', () => {
  for (const bad of ['', 'red', '#fff', '#ggg000']) {
    const tint = deviceTint(bad);

    assert.deepEqual(tint, deviceTint(defaultAccent));
    assert.ok(!JSON.stringify(tint).includes('NaN'), bad);
  }
});

test('the glyph on a solid fill is white, or dark when the fill is pale', () => {
  assert.equal(glyphOn('#ff0000'), '#ffffff');
  assert.equal(glyphOn('#5aaff5'), '#ffffff');
  assert.equal(glyphOn('#f4e9cf'), '#1c2533');
  assert.equal(glyphOn('#ffd60a'), '#1c2533');
  assert.equal(glyphOn('not a colour'), glyphOn(defaultAccent));
});

test('non-RGB lights, switches, and toggles share the same on-state tint while RGB lights keep their colour', () => {
  const plainLight = createDevice({
    entityId: 'light.hall',
    icon: 'lamp',
    name: 'Hall',
    room: 'Home',
    type: 'light',
  });
  const outlet = createDevice({
    entityId: 'switch.lamp',
    icon: 'outlet',
    name: 'Lamp',
    room: 'Home',
    type: 'outlet',
  });
  const toggle = createDevice({
    entityId: 'input_boolean.guest',
    icon: 'toggle',
    name: 'Guest',
    room: 'Home',
    type: 'toggle',
  });
  const rgbLight = mapState(plainLight, {
    attributes: { rgb_color: [255, 124, 121], supported_color_modes: ['rgb'] },
    entity_id: plainLight.id,
    state: 'on',
  });

  const expectedDefaultTint = deviceTint(defaultAccent);
  assert.deepEqual(deviceTint(deviceAccent(plainLight)), expectedDefaultTint);
  assert.deepEqual(deviceTint(deviceAccent(outlet)), expectedDefaultTint);
  assert.deepEqual(deviceTint(deviceAccent(toggle)), expectedDefaultTint);
  assert.deepEqual(deviceTint(deviceAccent(rgbLight)), deviceTint('#ff7c79'));
});
