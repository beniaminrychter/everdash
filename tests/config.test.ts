import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardSchema, defineConfig, viewCards } from '@everdash/contracts/config';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { isWidget, resolveDashboard } from '@everdash/dashboard/features/dashboard/data/discovery';
import type { ResolvedWidget } from '@everdash/dashboard/features/dashboard/data/types';
import {
  accessorySpan,
  cardSpan,
  effectiveSize,
  gridColumns,
  widgetSize,
  widgetSpan,
} from '@everdash/dashboard/features/dashboard/data/gridLayout';

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
  const [light] = result.views[0].cards;
  assert.ok(light.type === 'light');
  assert.equal(light.resolution.status, 'missing');
  assert.equal(light.resolution.entityId, 'light.kitchen');
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

test('widgets and accessories share one list and keep the view order', () => {
  const { cards } = config().views[0];
  const result = resolveDashboard(
    defineConfig({
      views: [{ cards: [cards[2], cards[0], cards[3], cards[1]], id: 'home', title: 'Home' }],
    }),
    [],
  );
  assert.deepEqual(
    result.views[0].cards.map((card) => [card.entity, isWidget(card)]),
    [
      ['sensor.buy', true],
      ['light.kitchen', false],
      ['weather.home', true],
      ['switch.terrace', false],
    ],
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

test('clock cards are widgets without an entity, observation or resolution', () => {
  const result = resolveDashboard(
    defineConfig({
      views: [
        {
          cards: [
            { type: 'light', entity: 'light.kitchen' },
            { type: 'clock' },
            { type: 'clock', display: 'date', size: 'half', name: 'Today' },
            { type: 'weather', entity: 'weather.home', size: 'quarter' },
          ],
          id: 'home',
          title: 'Home',
        },
      ],
    }),
    [],
  );
  const [, clock, named] = result.views[0].cards;
  assert.equal(clock.name, 'Time and date');
  assert.equal(clock.defaultTitle, true);
  assert.equal('resolution' in clock, false);
  assert.equal(named.name, 'Today');
  assert.equal(named.defaultTitle, false);
  assert.deepEqual(result.observationIds, ['weather.home']);
  assert.deepEqual(result.views[0].cards.map(isWidget), [false, true, true, true]);
});

test('widget sizes default per card type and follow the configured size', () => {
  const { cards } = resolveDashboard(
    defineConfig({
      views: [
        {
          cards: [
            { type: 'clock' },
            { type: 'clock', size: 'full' },
            { type: 'weather', entity: 'weather.home' },
            { type: 'weather', entity: 'weather.home', size: 'half' },
            { type: 'pstryk', entity: 'sensor.price' },
            { type: 'climate', entity: 'climate.ac' },
            { type: 'value', entity: 'sensor.power', template: 'hero' },
          ],
          id: 'home',
          title: 'Home',
        },
      ],
    }),
    [],
  ).views[0];
  assert.ok(cards.every(isWidget));
  assert.deepEqual((cards as ResolvedWidget[]).map(widgetSize), [
    'quarter',
    'full',
    'full',
    'half',
    'half',
    'half',
    'full',
  ]);
});

test('a quarter stays as wide as an accessory tile and collapses when tiles are two to a row', () => {
  assert.equal(effectiveSize('quarter', 1000), 'quarter');
  assert.equal(effectiveSize('quarter', 800), 'quarter');
  // The admin preview (about 760px of cards) and an iPad in portrait (768px window) still have
  // three tiles to a row, so a quarter is a tile wide.
  assert.equal(effectiveSize('quarter', 768), 'quarter');
  assert.equal(effectiveSize('quarter', 620), 'quarter');
  assert.equal(effectiveSize('quarter', 619), 'half');
  // A half needs 280px a column, a full row never collapses.
  assert.equal(effectiveSize('quarter', 575), 'full');
  assert.equal(effectiveSize('half', 576), 'half');
  assert.equal(effectiveSize('half', 575), 'full');
  assert.equal(effectiveSize('full', 320), 'full');
});

test('widget and accessory column spans come from one function of the container width', () => {
  assert.equal(gridColumns, 12);
  assert.deepEqual(
    (['quarter', 'half', 'full'] as const).map((size) => widgetSpan(size, 1000)),
    [3, 6, 12],
  );
  assert.deepEqual(
    (['quarter', 'half', 'full'] as const).map((size) => widgetSpan(size, 700)),
    [4, 6, 12],
  );
  assert.deepEqual(
    (['quarter', 'half', 'full'] as const).map((size) => widgetSpan(size, 600)),
    [6, 6, 12],
  );
  assert.deepEqual(
    (['quarter', 'half', 'full'] as const).map((size) => widgetSpan(size, 400)),
    [12, 12, 12],
  );
  // Accessory tiles go four, three, two per row.
  assert.deepEqual([1000, 800, 799, 620, 619, 400].map(accessorySpan), [3, 3, 4, 4, 6, 6]);

  const { cards } = resolveDashboard(
    defineConfig({
      views: [
        {
          cards: [
            { type: 'light', entity: 'light.kitchen' },
            { type: 'clock' },
            { type: 'value', entity: 'sensor.power', template: 'hero' },
          ],
          id: 'home',
          title: 'Home',
        },
      ],
    }),
    [],
  ).views[0];

  assert.deepEqual(
    cards.map((card) => cardSpan(card, 760)),
    [4, 4, 12],
  );
});

const withCard = (card: Record<string, unknown>) =>
  validateDashboard({
    schemaVersion: 1,
    views: [{ cards: [card], id: 'home', title: 'Home' }],
  });
const issuePaths = (card: Record<string, unknown>) => {
  const result = withCard(card);

  return result.ok ? [] : result.issues.map((issue) => issue.path);
};

test('value and toggle cards keep an unset icon (auto); scenes default to a sparkle', () => {
  const result = validateDashboard({
    schemaVersion: 1,
    views: [
      {
        cards: [
          { type: 'value', entity: 'sensor.power', template: 'hero', unit: 'kW', precision: 2 },
          { type: 'value', entity: 'input_number.target' },
          { type: 'toggle', entity: 'input_boolean.guest_mode', icon: 'moon' },
          { type: 'toggle', entity: 'switch.pump' },
          { type: 'toggle', entity: 'binary_sensor.door' },
          { type: 'scene', entity: 'scene.evening' },
          { type: 'scene', entity: 'script.goodnight' },
        ],
        id: 'home',
        title: 'Home',
      },
    ],
  });
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  const icons = result.config.views[0].cards.map((card) => card.icon);
  assert.deepEqual(icons, [
    undefined,
    undefined,
    'moon',
    undefined,
    undefined,
    'sparkle',
    'sparkle',
  ]);
});

test('value cards reject bad domains, templates, precision, units and unknown keys', () => {
  assert.deepEqual(issuePaths({ type: 'value', entity: 'light.kitchen' }), [
    'views[0].cards[0].entity',
  ]);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', template: 'giant' }), [
    'views[0].cards[0].template',
  ]);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', precision: 4 }), [
    'views[0].cards[0].precision',
  ]);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', precision: 1.5 }), [
    'views[0].cards[0].precision',
  ]);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', unit: 'x'.repeat(13) }), [
    'views[0].cards[0].unit',
  ]);
  for (const unit of ['   ', '\u0007', 'a\nb']) {
    assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', unit }), [
      'views[0].cards[0].unit',
    ]);
  }
  // An empty unit hides the unit.
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', unit: '' }), []);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', sellPrice: 'sensor.y' }), [
    'views[0].cards[0].sellPrice',
  ]);
});

test('toggle and scene cards reject unsupported domains, options and icons', () => {
  assert.deepEqual(issuePaths({ type: 'toggle', entity: 'light.kitchen' }), [
    'views[0].cards[0].entity',
  ]);
  assert.deepEqual(issuePaths({ type: 'toggle', entity: 'sensor.door' }), [
    'views[0].cards[0].entity',
  ]);
  assert.deepEqual(issuePaths({ type: 'toggle', entity: 'switch.x', template: 'tile' }), [
    'views[0].cards[0].template',
  ]);
  assert.deepEqual(issuePaths({ type: 'scene', entity: 'switch.x' }), ['views[0].cards[0].entity']);
  assert.deepEqual(issuePaths({ type: 'scene', entity: 'scene.x', icon: 'nope' }), [
    'views[0].cards[0].icon',
  ]);
  assert.deepEqual(issuePaths({ type: 'scene', entity: 'scene.x', extra: 1 }), [
    'views[0].cards[0].extra',
  ]);
});

test('clock cards validate without an entity and reject bad display, size and entity fields', () => {
  assert.equal(withCard({ type: 'clock' }).ok, true);
  assert.equal(withCard({ type: 'clock', display: 'time', size: 'half', name: 'Clock' }).ok, true);
  assert.deepEqual(issuePaths({ type: 'clock', display: 'seconds' }), [
    'views[0].cards[0].display',
  ]);
  assert.deepEqual(issuePaths({ type: 'clock', size: 'wide' }), ['views[0].cards[0].size']);
  assert.deepEqual(issuePaths({ type: 'clock', entity: 'sensor.time' }), [
    'views[0].cards[0].entity',
  ]);
  assert.deepEqual(issuePaths({ type: 'clock', icon: 'sun' }), ['views[0].cards[0].icon']);
});

test('only weather and clock cards accept a size', () => {
  assert.equal(withCard({ type: 'weather', entity: 'weather.home', size: 'quarter' }).ok, true);
  assert.deepEqual(issuePaths({ type: 'weather', entity: 'weather.home', size: 'huge' }), [
    'views[0].cards[0].size',
  ]);
  assert.deepEqual(issuePaths({ type: 'light', entity: 'light.kitchen', size: 'half' }), [
    'views[0].cards[0].size',
  ]);
  assert.deepEqual(issuePaths({ type: 'value', entity: 'sensor.x', size: 'half' }), [
    'views[0].cards[0].size',
  ]);
});

test('weather cards accept an hourly or daily forecast and reject other values and cards', () => {
  assert.equal(withCard({ type: 'weather', entity: 'weather.home' }).ok, true);
  assert.equal(withCard({ type: 'weather', entity: 'weather.home', forecast: 'hourly' }).ok, true);
  assert.equal(
    withCard({ type: 'weather', entity: 'weather.home', forecast: 'daily', size: 'half' }).ok,
    true,
  );
  assert.deepEqual(issuePaths({ type: 'weather', entity: 'weather.home', forecast: 'weekly' }), [
    'views[0].cards[0].forecast',
  ]);
  assert.deepEqual(issuePaths({ type: 'weather', entity: 'weather.home', forecast: 5 }), [
    'views[0].cards[0].forecast',
  ]);
  assert.deepEqual(issuePaths({ type: 'clock', forecast: 'daily' }), [
    'views[0].cards[0].forecast',
  ]);
  assert.deepEqual(issuePaths({ type: 'light', entity: 'light.kitchen', forecast: 'daily' }), [
    'views[0].cards[0].forecast',
  ]);
});

test('the forecast option survives the schema, validation and defineConfig unchanged', () => {
  const card = { type: 'weather', entity: 'weather.home', forecast: 'daily' };
  const result = withCard(card);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok ? result.document.views[0].cards?.[0] : null, card);
  assert.match(JSON.stringify(dashboardSchema), /"forecast":\{"enum":\["hourly","daily"\]\}/);
  const configured = defineConfig({
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [{ type: 'weather', entity: 'weather.home', forecast: 'daily' }],
      },
    ],
  });
  assert.equal((configured.views[0].cards[0] as { forecast?: string }).forecast, 'daily');
});

const withSections = (sections: unknown, cards?: unknown) =>
  validateDashboard({
    schemaVersion: 1,
    views: [{ id: 'home', title: 'Home', ...(cards ? { cards } : {}), sections }],
  });
const sectionIssues = (sections: unknown) => {
  const result = withSections(sections);

  return result.ok ? [] : result.issues.map((issue) => `${issue.path}: ${issue.message}`);
};

test('a view without sections is unchanged and resolves to no sections', () => {
  const result = validateDashboard({
    schemaVersion: 1,
    views: [{ id: 'home', title: 'Home', cards: [{ type: 'light', entity: 'light.kitchen' }] }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.config.views[0].sections, []);
  assert.equal('sections' in result.document.views[0], false);
});

test('sections hold their own cards, in order, after the view cards', () => {
  const result = withSections(
    [
      { id: 'kitchen', title: 'Kitchen', cards: [{ type: 'light', entity: 'light.kitchen' }] },
      { id: 'empty', title: 'Nothing yet' },
      { id: 'time', title: 'Time', cards: [{ type: 'clock' }] },
    ],
    [{ type: 'outlet', entity: 'switch.lamp' }],
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  const [view] = result.config.views;

  assert.deepEqual(
    view.sections.map((section) => [section.id, section.title, section.cards.length]),
    [
      ['kitchen', 'Kitchen', 1],
      ['empty', 'Nothing yet', 0],
      ['time', 'Time', 1],
    ],
  );
  // Section cards get the same defaults as the view's own cards.
  assert.equal(view.sections[0].cards[0].icon, 'bulb');
  assert.deepEqual(
    viewCards(view).map((card) => card.type),
    ['outlet', 'light', 'clock'],
  );
  assert.deepEqual(
    viewCards(result.document.views[0]).map((card) => card.type),
    ['outlet', 'light', 'clock'],
  );
});

test('section validation reports unknown keys, bad ids and titles, and duplicate ids', () => {
  assert.deepEqual(sectionIssues({}), ['views[0].sections: Expected an array.']);
  assert.deepEqual(sectionIssues(['x']), ['views[0].sections[0]: Expected an object.']);
  assert.deepEqual(sectionIssues([{ id: 'a', title: 'A', icon: 'sun' }]), [
    'views[0].sections[0].icon: Unknown field.',
  ]);
  assert.deepEqual(sectionIssues([{ id: ' ', title: '' }]), [
    'views[0].sections[0].id: Expected a non-empty string.',
    'views[0].sections[0].title: Expected a non-empty string.',
  ]);
  assert.deepEqual(sectionIssues([{ title: 'No id' }]), [
    'views[0].sections[0].id: Expected a non-empty string.',
  ]);
  assert.deepEqual(
    sectionIssues([
      { id: 'a', title: 'A' },
      { id: 'a', title: 'Again' },
    ]),
    ['views[0].sections[1].id: Section IDs must be unique within a view.'],
  );
});

test('section ids only need to be unique within their own view', () => {
  const result = validateDashboard({
    schemaVersion: 1,
    views: [
      { id: 'one', title: 'One', sections: [{ id: 'main', title: 'Main' }] },
      { id: 'two', title: 'Two', sections: [{ id: 'main', title: 'Main' }] },
    ],
  });

  assert.equal(result.ok, true);
});

test('cards inside a section are validated with the path of their section', () => {
  const result = withSections([
    {
      id: 'a',
      title: 'A',
      cards: [
        { type: 'light', entity: 'switch.wrong' },
        { type: 'mystery' },
        { type: 'clock', entity: 'sensor.x' },
      ],
    },
  ]);

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.deepEqual(
    result.issues.map((issue) => issue.path),
    [
      'views[0].sections[0].cards[0].entity',
      'views[0].sections[0].cards[1].type',
      'views[0].sections[0].cards[2].entity',
    ],
  );
});

const sectioned = (sections: { id: string; title: string }[]) =>
  defineConfig({ views: [{ id: 'home', title: 'Home', sections }] });

test('defineConfig rejects blank or duplicate section ids and blank titles', () => {
  assert.throws(() => sectioned([{ id: '', title: 'A' }]), /section/i);
  assert.throws(
    () =>
      sectioned([
        { id: 'a', title: 'A' },
        { id: 'a', title: 'B' },
      ]),
    /Duplicate section/,
  );
  assert.throws(() => sectioned([{ id: 'a', title: ' ' }]), /needs a title/);
});

test('discovery resolves section cards, observes and commands their entities', () => {
  const resolved = resolveDashboard(
    defineConfig({
      views: [
        {
          id: 'home',
          title: 'Home',
          cards: [{ type: 'light', entity: 'light.hall' }],
          sections: [
            {
              id: 'kitchen',
              title: 'Kitchen',
              cards: [
                { type: 'light', entity: 'light.kitchen' },
                { type: 'weather', entity: 'weather.home' },
                { type: 'clock' },
              ],
            },
          ],
        },
      ],
    }),
    [],
  );
  const [view] = resolved.views;

  assert.deepEqual(
    resolved.cards.map((card) => [card.entityId, card.room]),
    [
      ['light.hall', 'Home'],
      ['light.kitchen', 'Home'],
    ],
  );
  assert.deepEqual(resolved.observationIds, ['weather.home']);
  assert.deepEqual(
    view.sections[0].cards.map((card) => card.name),
    ['light.kitchen', 'Current weather', 'Time and date'],
  );
  assert.deepEqual(view.sections[0].cards.map(isWidget), [false, true, true]);
});
