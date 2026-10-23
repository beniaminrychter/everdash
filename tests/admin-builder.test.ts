import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCard,
  createConfiguredCard,
  createView,
  isCardEditorMessage,
  moveItem,
} from '../admin/src/builder';

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
  assert.deepEqual(createCard('pstryk'), { type: 'pstryk', entity: 'sensor.select_entity' });
});

test('builder creates a configured card only for an explicit entity of its domain', () => {
  assert.deepEqual(createConfiguredCard('light', 'light.kitchen'), {
    type: 'light',
    entity: 'light.kitchen',
  });
  assert.throws(() => createConfiguredCard('light', ''), /valid light entity/);
  assert.throws(() => createConfiguredCard('light', 'switch.kitchen'), /valid light entity/);
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
