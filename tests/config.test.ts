import assert from 'node:assert/strict';
import test from 'node:test';
import { defineConfig } from '../src/shared/config';
import { resolveDashboard, groupCards } from '../src/features/dashboard/data/discovery';

const config = () =>
  defineConfig({
    views: [
      {
        badges: [{ type: 'temperature', entity: 'sensor.kitchen', name: 'Kitchen' }],
        cards: [
          { type: 'light', entity: 'light.kitchen' },
          { type: 'outlet', entity: 'switch.terrace', name: 'Terrace', icon: 'bulb' },
          { type: 'pstryk', entity: 'sensor.buy', usage: 'sensor.power' },
          { type: 'weather', entity: 'weather.home' },
        ],
        id: 'first-floor',
        title: 'First floor',
      },
    ],
  });
const entity = (id: string, name: string) => ({
  attributes: { friendly_name: name },
  entity_id: id,
  state: 'on',
});

test('defineConfig supplies icons and polling defaults without mutating the source', () => {
  const card = { entity: 'light.kitchen' as const, type: 'light' as const };
  const result = defineConfig({ views: [{ cards: [card], id: 'home', title: 'Home' }] });
  assert.equal(result.views[0].cards[0].icon, 'bulb');
  assert.equal('icon' in card, false);
  assert.deepEqual(result.polling, { controlsMs: 5000, metadataMs: 300000, observationsMs: 30000 });
  assert.deepEqual(result.views[0].badges, []);
  assert.equal(config().views[0].cards[1].icon, 'bulb');
});

test('config rejects empty/duplicate view IDs, invalid entity domains and unsafe polling intervals', () => {
  assert.throws(() => defineConfig({ views: [] }), /view/i);
  assert.throws(() => defineConfig({ views: [{ id: '', title: 'Home' }] }), /id/i);
  assert.throws(
    () =>
      defineConfig({
        views: [
          { id: 'home', title: 'One' },
          { id: 'home', title: 'Two' },
        ],
      }),
    /duplicate/i,
  );
  assert.throws(
    () => defineConfig({ polling: { controlsMs: 0 }, views: [{ id: 'home', title: 'Home' }] }),
    /poll/i,
  );
  assert.throws(
    () =>
      defineConfig({
        polling: { observationsMs: Infinity },
        views: [{ id: 'home', title: 'Home' }],
      }),
    /poll/i,
  );
  assert.throws(
    () =>
      defineConfig({
        views: [
          {
            cards: [
              // @ts-expect-error Deliberately exercise runtime validation for JS/cast callers.
              { type: 'light', entity: 'switch.wrong' },
            ],
            id: 'home',
            title: 'Home',
          },
        ],
      }),
    /entity/i,
  );
});

test('explicit entities keep their order and omitted names use HA metadata', () => {
  const result = resolveDashboard(config(), [
    entity('light.kitchen', 'Kitchen ceiling'),
    entity('switch.terrace', 'Other name'),
  ]);
  assert.deepEqual(
    result.views[0].cards.map((c) => c.entity),
    ['light.kitchen', 'switch.terrace', 'sensor.buy', 'weather.home'],
  );
  assert.equal(result.views[0].cards[0].name, 'Kitchen ceiling');
  assert.equal(result.views[0].cards[1].name, 'Terrace');
  assert.equal(result.views[0].cards[2].name, 'Energy');
  assert.equal(result.views[0].cards[3].name, 'Current weather');
  assert.equal(result.cards[0].entityId, 'light.kitchen');
});

test('missing exact entities retain their IDs and never match a different friendly name', () => {
  const result = resolveDashboard(config(), [entity('light.other', 'light.kitchen')]);
  assert.equal(result.views[0].cards[0].resolution.status, 'missing');
  assert.equal(result.views[0].cards[0].resolution.entityId, 'light.kitchen');
  assert.equal(result.views[0].cards[0].name, 'light.kitchen');
  assert.ok(result.observationIds.includes('sensor.kitchen'));
  assert.ok(!result.observationIds.includes('light.other'));
});

test('views share one command binding per entity while retaining their display overrides', () => {
  const result = resolveDashboard(
    defineConfig({
      views: [
        {
          cards: [{ type: 'light', entity: 'light.kitchen', name: 'Kitchen' }],
          id: 'home',
          title: 'Home',
        },
        {
          cards: [{ type: 'light', entity: 'light.kitchen', name: 'Ceiling', icon: 'pendant' }],
          id: 'room',
          title: 'Room',
        },
      ],
    }),
    [],
  );
  assert.equal(result.cards.length, 1);
  assert.equal(result.views[1].cards[0].name, 'Ceiling');
  assert.equal(result.views[1].cards[0].icon, 'pendant');
});

test('only configured badge and widget sources are observed, deduplicated across views', () => {
  const result = resolveDashboard(config(), [entity('sensor.unconfigured', 'Unconfigured')]);
  assert.deepEqual(result.observationIds, [
    'sensor.kitchen',
    'sensor.buy',
    'sensor.power',
    'weather.home',
  ]);
  const badgeOnly = resolveDashboard(
    defineConfig({
      views: [
        {
          badges: [{ type: 'temperature', entity: 'sensor.only' }],
          id: 'sensors',
          title: 'Sensors',
        },
      ],
    }),
    [],
  );
  assert.deepEqual(badgeOnly.observationIds, ['sensor.only']);
  assert.deepEqual(badgeOnly.cards, []);
});

test('adjacent card groups preserve widget and accessory order without reordering the view', () => {
  const { cards } = config().views[0];
  const result = resolveDashboard(
    defineConfig({
      views: [{ cards: [cards[2], cards[0], cards[3], cards[1]], id: 'home', title: 'Home' }],
    }),
    [],
  );
  assert.deepEqual(
    groupCards(result.views[0].cards).map((group) => group.cards.map((card) => card.entity)),
    [['sensor.buy'], ['light.kitchen'], ['weather.home'], ['switch.terrace']],
  );
});

test('climate cards use exact climate IDs, share one binding and stay out of passive observations', () => {
  const result = resolveDashboard(
    defineConfig({
      views: [
        { cards: [{ type: 'climate', entity: 'climate.ac' }], id: 'one', title: 'One' },
        { cards: [{ type: 'climate', entity: 'climate.ac', name: 'AC' }], id: 'two', title: 'Two' },
      ],
    }),
    [entity('climate.ac', 'Air Conditioner')],
  );
  assert.equal(result.climates.length, 1);
  assert.equal(result.climates[0].entityId, 'climate.ac');
  assert.equal(result.views[0].cards[0].name, 'Air Conditioner');
  assert.equal(result.views[1].cards[0].name, 'AC');
  assert.deepEqual(result.observationIds, []);
});

test('default widget titles are localizable while explicit config titles remain static', () => {
  const cfg = defineConfig({
    views: [
      {
        cards: [
          { type: 'pstryk', entity: 'sensor.price' },
          { type: 'weather', entity: 'weather.home', name: 'Current weather' },
        ],
        id: 'home',
        title: 'Home',
      },
    ],
  });
  const { cards } = resolveDashboard(cfg, []).views[0];
  assert.equal(cards[0].defaultTitle, true);
  assert.equal(cards[1].defaultTitle, false);
  assert.equal(cards[1].name, 'Current weather');
});
