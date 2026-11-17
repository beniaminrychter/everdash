import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardSchema } from '@everdash/contracts/config/schema';
import { iconNames } from '@everdash/contracts/iconNames';
import { iconShapes } from '@everdash/ui/ui/Icon/iconShapes';
import { iconGroups } from '../apps/admin/src/features/editor/iconGroups';

const originalIcons = [
  'away',
  'bed',
  'bulb',
  'check',
  'close',
  'cloud',
  'coffee',
  'desk-lamp',
  'door',
  'droplet',
  'floor-lamp',
  'gauge',
  'home',
  'laptop',
  'moon',
  'more',
  'movie',
  'outlet',
  'pendant',
  'plug',
  'rain',
  'share',
  'sliders',
  'sofa',
  'sparkle',
  'sun',
  'sunrise',
  'thermometer',
  'toggle',
];

test('icon names stay unique, include every original icon, and match the artwork', () => {
  assert.equal(new Set(iconNames).size, iconNames.length);
  for (const name of originalIcons) {
    assert.ok((iconNames as readonly string[]).includes(name), `${name} was removed`);
  }
  assert.deepEqual(Object.keys(iconShapes).sort(), [...iconNames].sort());
  for (const name of iconNames) {
    assert.ok(iconShapes[name].length > 0, `${name} has no shapes`);
  }
});

test('the JSON schema icon enum is derived from the canonical icon names', () => {
  assert.deepEqual(
    dashboardSchema.properties.views.items.properties.badges.items.properties.icon.enum,
    [...iconNames],
  );
});

test('the picker lists every icon exactly once', () => {
  const grouped = iconGroups.flatMap((group) => group.icons);
  assert.equal(new Set(grouped).size, grouped.length);
  assert.deepEqual([...grouped].sort(), [...iconNames].sort());
});
