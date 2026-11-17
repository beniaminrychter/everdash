import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDashboard } from '@everdash/contracts/config/validate';
import {
  filterConfiguredStates,
  validateServiceCommand,
} from '../apps/server/src/home-assistant/policy';

const config = {
  schemaVersion: 1,
  views: [
    {
      id: 'home',
      title: 'Home',
      badges: [{ type: 'temperature', entity: 'sensor.room_temp' }],
      cards: [
        { type: 'light', entity: 'light.ceiling' },
        { type: 'outlet', entity: 'switch.kettle' },
        { type: 'climate', entity: 'climate.main' },
        {
          type: 'pstryk',
          entity: 'sensor.pstryk_price',
          sellPrice: 'sensor.sell_price',
          usage: 'sensor.daily_usage',
        },
        { type: 'weather', entity: 'weather.local' },
        { type: 'clock' },
        { type: 'toggle', entity: 'input_boolean.guest' },
        { type: 'toggle', entity: 'switch.pump' },
        { type: 'toggle', entity: 'binary_sensor.door' },
        { type: 'scene', entity: 'scene.evening' },
        { type: 'scene', entity: 'script.goodnight' },
        { type: 'value', entity: 'input_number.target' },
      ],
    },
  ],
};

const validConfig = validateDashboard(config);
assert.equal(validConfig.ok, true);
if (!validConfig.ok) {
  throw new Error('test config should be valid');
}

test('state catalog includes only exact configured entities and configured observations', () => {
  const states = [
    { entity_id: 'light.ceiling', state: 'on' },
    { entity_id: 'sensor.room_temp', state: '21' },
    { entity_id: 'sensor.sell_price', state: '0.5' },
    { entity_id: 'weather.local', state: 'sunny' },
    { entity_id: 'light.private', state: 'off' },
    { entity_id: 'climate.main ', state: 'heat' },
    { state: 'malformed' },
  ];
  assert.deepEqual(filterConfiguredStates(states, validConfig.config), states.slice(0, 4));
});

test('allows supported light, outlet and climate payloads for configured targets', () => {
  assert.deepEqual(
    validateServiceCommand(
      'light',
      'turn_on',
      {
        entity_id: 'light.ceiling',
        brightness_pct: 45,
        rgb_color: [1, 2, 3],
      },
      validConfig.config,
    ),
    { entity_id: 'light.ceiling', brightness_pct: 45, rgb_color: [1, 2, 3] },
  );
  assert.deepEqual(
    validateServiceCommand(
      'switch',
      'turn_off',
      { entity_id: 'switch.kettle' },
      validConfig.config,
    ),
    { entity_id: 'switch.kettle' },
  );
  assert.deepEqual(
    validateServiceCommand(
      'climate',
      'set_temperature',
      {
        entity_id: 'climate.main',
        temperature: 20.5,
      },
      validConfig.config,
    ),
    { entity_id: 'climate.main', temperature: 20.5 },
  );
  assert.deepEqual(
    validateServiceCommand(
      'weather',
      'get_forecasts',
      {
        entity_id: 'weather.local',
        type: 'hourly',
      },
      validConfig.config,
    ),
    { entity_id: 'weather.local', type: 'hourly' },
  );
  assert.deepEqual(
    validateServiceCommand(
      'weather',
      'get_forecasts',
      { entity_id: 'weather.local', type: 'daily' },
      validConfig.config,
    ),
    { entity_id: 'weather.local', type: 'daily' },
  );
});

test('rejects unknown services, unconfigured targets, extra fields and invalid values', () => {
  const cases: [string, string, unknown][] = [
    ['light', 'turn_on', { entity_id: 'light.private' }],
    ['light', 'turn_on', { entity_id: 'light.ceiling', surprise: true }],
    ['switch', 'turn_on', { entity_id: 'switch.kettle', brightness_pct: 5 }],
    ['light', 'turn_on', { entity_id: 'light.ceiling', brightness_pct: 101 }],
    ['light', 'turn_off', { entity_id: 'light.ceiling', brightness_pct: 5 }],
    ['climate', 'set_temperature', { entity_id: 'climate.main', temperature: '20' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: 'twice_daily' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: 'weekly' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: 'Daily' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: ['daily'] }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.private', type: 'daily' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: 'daily', extra: true }],
    ['camera', 'record', { entity_id: 'camera.door' }],
  ];
  for (const [domain, service, data] of cases) {
    assert.throws(() => validateServiceCommand(domain, service, data, validConfig.config));
  }
});

const run = (domain: string, service: string, body: unknown) =>
  validateServiceCommand(domain, service, body, validConfig.config);

test('allows toggle, scene and script commands only for their configured card types', () => {
  assert.deepEqual(run('input_boolean', 'turn_on', { entity_id: 'input_boolean.guest' }), {
    entity_id: 'input_boolean.guest',
  });
  assert.deepEqual(run('input_boolean', 'turn_off', { entity_id: 'input_boolean.guest' }), {
    entity_id: 'input_boolean.guest',
  });
  assert.deepEqual(run('switch', 'turn_on', { entity_id: 'switch.pump' }), {
    entity_id: 'switch.pump',
  });
  assert.deepEqual(run('scene', 'turn_on', { entity_id: 'scene.evening' }), {
    entity_id: 'scene.evening',
  });
  assert.deepEqual(run('script', 'turn_on', { entity_id: 'script.goodnight' }), {
    entity_id: 'script.goodnight',
  });
});

test('rejects commands that a toggle or scene card does not authorize', () => {
  // A binary_sensor toggle is read-only.
  assert.throws(() => run('binary_sensor', 'turn_on', { entity_id: 'binary_sensor.door' }));
  assert.throws(() => run('switch', 'turn_on', { entity_id: 'binary_sensor.door' }));
  // Scene and script accept only entity_id.
  assert.throws(() => run('scene', 'turn_on', { entity_id: 'scene.evening', transition: 5 }));
  assert.throws(() => run('script', 'turn_on', { entity_id: 'script.goodnight', variables: {} }));
  // Other scene/script services and mismatched domains stay blocked.
  assert.throws(() => run('scene', 'create', { entity_id: 'scene.evening' }));
  assert.throws(() => run('script', 'turn_off', { entity_id: 'script.goodnight' }));
  assert.throws(() => run('scene', 'turn_on', { entity_id: 'script.goodnight' }));
  assert.throws(() => run('script', 'turn_on', { entity_id: 'scene.evening' }));
  // input_boolean works only for configured toggle cards, never for other card types.
  assert.throws(() => run('input_boolean', 'turn_on', { entity_id: 'input_boolean.other' }));
  assert.throws(() => run('input_boolean', 'turn_on', { entity_id: 'switch.kettle' }));
  assert.throws(() => run('input_boolean', 'toggle', { entity_id: 'input_boolean.guest' }));
  // An outlet card cannot be driven through the input_boolean service, and value cards are read-only.
  assert.throws(() => run('input_number', 'set_value', { entity_id: 'input_number.target' }));
  assert.throws(() => run('switch', 'turn_on', { entity_id: 'switch.unconfigured' }));
});

test('entities on section cards are exposed and may be commanded like any other card', () => {
  const sectioned = validateDashboard({
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        sections: [
          {
            id: 'kitchen',
            title: 'Kitchen',
            cards: [
              { type: 'light', entity: 'light.island' },
              { type: 'weather', entity: 'weather.kitchen' },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(sectioned.ok, true);
  if (!sectioned.ok) {
    return;
  }

  const states = [
    { entity_id: 'light.island', state: 'on' },
    { entity_id: 'weather.kitchen', state: 'sunny' },
    { entity_id: 'light.other', state: 'off' },
  ];
  assert.deepEqual(filterConfiguredStates(states, sectioned.config), states.slice(0, 2));
  assert.deepEqual(
    validateServiceCommand('light', 'turn_on', { entity_id: 'light.island' }, sectioned.config),
    { entity_id: 'light.island' },
  );
  assert.throws(() =>
    validateServiceCommand('light', 'turn_on', { entity_id: 'light.other' }, sectioned.config),
  );
});
