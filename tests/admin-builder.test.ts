import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compatibleCardKinds,
  convertCard,
  createCard,
  createConfiguredCard,
  createPendingCard,
  createView,
  isCardEditorMessage,
  moveItem,
} from '../apps/admin/src/app/draft/builder';
import { adminHomeUrl, apiUrl } from '../apps/admin/src/lib/api';

test('builder moves ordered items without changing their content', () => {
  const cards = [
    { type: 'light', entity: 'light.kitchen', name: 'Kitchen' },
    { type: 'weather', entity: 'weather.home' },
  ];
  assert.deepEqual(moveItem(cards, 1, -1), [cards[1], cards[0]]);
  assert.deepEqual(moveItem(cards, 0, -1), cards);
});

test('new views receive stable ids and preserve the title separately', () => {
  assert.deepEqual(createView('guest_room', 'Guest Room'), {
    id: 'guest_room',
    title: 'Guest Room',
    cards: [],
    badges: [],
  });
});

test('builder can start every supported card type with a valid domain placeholder', () => {
  assert.deepEqual(createCard('light'), { type: 'light', entity: 'light.select_entity' });
  assert.deepEqual(createCard('outlet'), { type: 'outlet', entity: 'switch.select_entity' });
  assert.deepEqual(createCard('climate'), { type: 'climate', entity: 'climate.select_entity' });
  assert.deepEqual(createCard('weather'), { type: 'weather', entity: 'weather.select_entity' });
  assert.deepEqual(createCard('clock'), { type: 'clock' });
  assert.deepEqual(createCard('pstryk'), { type: 'pstryk', entity: 'sensor.select_entity' });
  assert.deepEqual(createCard('value'), { type: 'value', entity: 'sensor.select_entity' });
  assert.deepEqual(createCard('toggle'), { type: 'toggle', entity: 'input_boolean.select_entity' });
  assert.deepEqual(createCard('scene'), { type: 'scene', entity: 'scene.select_entity' });
});

test('builder creates a configured card only for an explicit entity of its domain', () => {
  assert.deepEqual(createConfiguredCard('light', 'light.kitchen'), {
    type: 'light',
    entity: 'light.kitchen',
  });
  assert.throws(() => createConfiguredCard('light', ''), /valid light entity/);
  assert.throws(() => createConfiguredCard('light', 'switch.kitchen'), /valid light entity/);
  assert.deepEqual(createConfiguredCard('value', 'input_number.target'), {
    type: 'value',
    entity: 'input_number.target',
  });
  assert.deepEqual(createConfiguredCard('toggle', 'binary_sensor.door'), {
    type: 'toggle',
    entity: 'binary_sensor.door',
  });
  assert.deepEqual(createConfiguredCard('scene', 'script.goodnight'), {
    type: 'scene',
    entity: 'script.goodnight',
  });
  assert.throws(() => createConfiguredCard('scene', 'light.kitchen'), /scene or script/);
  assert.throws(() => createConfiguredCard('toggle', 'sensor.door'), /valid input_boolean/);
});

test('card editor accepts only current-view intents with a matching nonce and generation', () => {
  const message = {
    type: 'everdash.editor.card.edit',
    nonce: 'current-nonce',
    generation: 4,
    viewId: 'home',
    index: 1,
  };
  assert.equal(isCardEditorMessage(message, 'current-nonce', 4, 'home', 2), true);
  assert.equal(
    isCardEditorMessage({ ...message, nonce: 'stale' }, 'current-nonce', 4, 'home', 2),
    false,
  );
  assert.equal(
    isCardEditorMessage({ ...message, generation: 3 }, 'current-nonce', 4, 'home', 2),
    false,
  );
  assert.equal(isCardEditorMessage({ ...message, index: 2 }, 'current-nonce', 4, 'home', 2), false);
  assert.equal(
    isCardEditorMessage({ ...message, viewId: 'other' }, 'current-nonce', 4, 'home', 2),
    false,
  );
});

test('convertCard keeps the name and an entity the new type accepts', () => {
  const outlet = { type: 'outlet', entity: 'switch.kettle', name: 'Kettle' } as const;

  assert.deepEqual(convertCard(outlet, 'toggle'), {
    type: 'toggle',
    entity: 'switch.kettle',
    name: 'Kettle',
  });
  assert.deepEqual(convertCard(outlet, 'light'), { type: 'light', entity: '', name: 'Kettle' });
  assert.equal(convertCard(outlet, 'outlet'), outlet);
});

test('compatibleCardKinds lists only types that accept the entity', () => {
  const kinds = ['light', 'outlet', 'value', 'toggle', 'scene', 'pstryk'] as const;

  assert.deepEqual(compatibleCardKinds('switch.kettle', kinds), ['outlet', 'toggle']);
  assert.deepEqual(compatibleCardKinds('sensor.power', kinds), ['value', 'pstryk']);
  assert.deepEqual(compatibleCardKinds('script.bedtime', kinds), ['scene']);
});

test('the clock card needs no entity to be created, added or converted to', () => {
  assert.deepEqual(createConfiguredCard('clock', ''), { type: 'clock' });
  assert.deepEqual(createPendingCard('clock'), { type: 'clock' });
  assert.deepEqual(createPendingCard('light'), { type: 'light', entity: '' });

  const outlet = { type: 'outlet', entity: 'switch.kettle', name: 'Kettle' } as const;

  assert.deepEqual(convertCard(outlet, 'clock'), { type: 'clock', name: 'Kettle' });
  assert.deepEqual(convertCard({ type: 'clock', display: 'time' }, 'light'), {
    type: 'light',
    entity: '',
  });
  assert.deepEqual(compatibleCardKinds('switch.kettle', ['clock', 'outlet']), ['outlet']);
});

test('card move intents accept any integer offset or an in-range target index', () => {
  const move = {
    type: 'everdash.editor.card.move',
    nonce: 'n',
    generation: 1,
    viewId: 'home',
    index: 0,
  };

  assert.equal(isCardEditorMessage({ ...move, offset: 2 }, 'n', 1, 'home', 4), true);
  assert.equal(isCardEditorMessage({ ...move, offset: -1 }, 'n', 1, 'home', 4), true);
  assert.equal(isCardEditorMessage({ ...move, to: 3 }, 'n', 1, 'home', 4), true);
  assert.equal(isCardEditorMessage({ ...move, to: 4 }, 'n', 1, 'home', 4), false);
  assert.equal(isCardEditorMessage({ ...move, offset: 1.5 }, 'n', 1, 'home', 4), false);
  assert.equal(isCardEditorMessage(move, 'n', 1, 'home', 4), false);
});

test('admin URL helpers resolve API and home paths across /admin/, root /, and HA Ingress mounts', () => {
  assert.equal(apiUrl('api/manage/config', '/admin/'), '/api/manage/config');
  assert.equal(apiUrl('/api/manage/config', '/admin/index.html'), '/api/manage/config');
  assert.equal(apiUrl('api/manage/config', '/'), '/api/manage/config');
  assert.equal(
    apiUrl('api/manage/config', '/api/hassio_ingress/token123/'),
    '/api/hassio_ingress/token123/api/manage/config',
  );
  assert.equal(
    apiUrl('api/manage/devices/code', '/api/hassio_ingress/token123/admin/'),
    '/api/hassio_ingress/token123/api/manage/devices/code',
  );

  assert.equal(adminHomeUrl('/admin/'), '/admin/');
  assert.equal(adminHomeUrl('/admin/index.html'), '/admin/');
  assert.equal(adminHomeUrl('/'), '/');
  assert.equal(adminHomeUrl('/api/hassio_ingress/token123/'), '/api/hassio_ingress/token123/');
});
