import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDashboard } from '../src/shared/config/validate';
import { dashboardSchema } from '../src/shared/config/schema';
import { iconNames } from '../src/shared/ui/iconNames';

const valid = {
  schemaVersion: 1,
  timeZone: 'Europe/Warsaw',
  views: [
    {
      id: 'living-room',
      title: 'Living room',
      badges: [{ type: 'temperature', entity: 'sensor.living_room' }],
      cards: [
        { type: 'light', entity: 'light.ceiling' },
        { type: 'climate', entity: 'climate.main', temperatureUnit: '°C' },
      ],
    },
  ],
};

test('validates a versioned JSON dashboard and applies the existing defaults', () => {
  const result = validateDashboard(valid);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.equal(result.config.views[0].cards[0].icon, 'bulb');
  assert.deepEqual(result.config.polling, {
    controlsMs: 5000,
    metadataMs: 300000,
    observationsMs: 30000,
  });
  assert.deepEqual(
    result.document.views[0].cards?.map((card) => card.entity),
    ['light.ceiling', 'climate.main'],
  );
});

test('returns useful field paths for malformed JSON dashboard fields', () => {
  const invalid: unknown = {
    ...valid,
    schemaVersion: 2,
    polling: { controlsMs: 0 },
    views: [
      {
        ...valid.views[0],
        id: '',
        cards: [
          { type: 'light', entity: 'switch.wrong', icon: 'not-an-icon', mystery: true },
          { type: 'unknown', entity: 'sensor.any' },
        ],
      },
    ],
    surprise: true,
  };
  const result = validateDashboard(invalid);
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  const paths = new Set(result.issues.map((issue) => issue.path));
  assert.ok(paths.has('schemaVersion'));
  assert.ok(paths.has('polling.controlsMs'));
  assert.ok(paths.has('views[0].id'));
  assert.ok(paths.has('views[0].cards[0].entity'));
  assert.ok(paths.has('views[0].cards[0].icon'));
  assert.ok(paths.has('views[0].cards[0].mystery'));
  assert.ok(paths.has('views[0].cards[1].type'));
  assert.ok(paths.has('surprise'));
});

test('rejects invalid timezone and duplicate view IDs from untyped input', () => {
  const result = validateDashboard({
    schemaVersion: 1,
    timeZone: 'Not/A-Timezone',
    views: [
      { id: 'home', title: 'One' },
      { id: 'home', title: 'Two' },
    ],
  });
  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }
  assert.ok(result.issues.some((issue) => issue.path === 'timeZone'));
  assert.ok(result.issues.some((issue) => issue.path === 'views[1].id'));
});

test('the published JSON schema rejects unknown fields and advertises every supported card', () => {
  assert.equal(dashboardSchema.additionalProperties, false);
  const viewSchema = dashboardSchema.properties.views.items;
  assert.equal(viewSchema.additionalProperties, false);
  const cardSchemas = viewSchema.properties.cards.items.oneOf;
  assert.deepEqual(
    cardSchemas.map((schema) => schema.properties.type.const),
    ['light', 'outlet', 'pstryk', 'weather', 'climate'],
  );
  assert.ok(cardSchemas.every((schema) => schema.additionalProperties === false));
  assert.ok(
    cardSchemas
      .filter((schema) => ['light', 'outlet'].includes(schema.properties.type.const))
      .every((schema) => JSON.stringify(schema.properties.icon.enum) === JSON.stringify(iconNames)),
  );
});
