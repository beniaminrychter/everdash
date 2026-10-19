import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDashboard } from '../src/shared/config/validate';
import { filterConfiguredStates, validateServiceCommand } from '../server/home-assistant/policy';

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
});

test('rejects unknown services, unconfigured targets, extra fields and invalid values', () => {
  const cases: [string, string, unknown][] = [
    ['light', 'turn_on', { entity_id: 'light.private' }],
    ['light', 'turn_on', { entity_id: 'light.ceiling', surprise: true }],
    ['switch', 'turn_on', { entity_id: 'switch.kettle', brightness_pct: 5 }],
    ['light', 'turn_on', { entity_id: 'light.ceiling', brightness_pct: 101 }],
    ['light', 'turn_off', { entity_id: 'light.ceiling', brightness_pct: 5 }],
    ['climate', 'set_temperature', { entity_id: 'climate.main', temperature: '20' }],
    ['weather', 'get_forecasts', { entity_id: 'weather.local', type: 'daily' }],
    ['camera', 'record', { entity_id: 'camera.door' }],
  ];
  for (const [domain, service, data] of cases) {
    assert.throws(() => validateServiceCommand(domain, service, data, validConfig.config));
  }
});
