import assert from 'node:assert/strict';
import test from 'node:test';
import { createCard, createView, moveItem } from '../admin/src/builder';

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
