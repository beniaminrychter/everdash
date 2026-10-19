import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupervisorHomeAssistant } from '../server/home-assistant/client';
import { HomeAssistantUpstreamError } from '../server/home-assistant/errors';

test('uses only the Supervisor API root and server-side bearer credential', async () => {
  let requestUrl = '';
  let authorization = '';
  const client = createSupervisorHomeAssistant({
    token: 'server-only-test-token',
    request: async (input, init) => {
      requestUrl = String(input);
      authorization = new Headers(init?.headers).get('Authorization') ?? '';
      return Response.json([{ entity_id: 'light.ceiling' }], { status: 200 });
    },
  });
  assert.deepEqual(await client.getState('light.ceiling'), [{ entity_id: 'light.ceiling' }]);
  assert.equal(requestUrl, 'http://supervisor/core/api/states/light.ceiling');
  assert.equal(authorization, 'Bearer server-only-test-token');
});

test('requests weather forecasts with Home Assistant return_response semantics', async () => {
  let requestUrl = '';
  let requestBody = '';
  const client = createSupervisorHomeAssistant({
    token: 'fixture-token',
    request: async (input, init) => {
      requestUrl = String(input);
      requestBody = String(init?.body);
      return Response.json({ service_response: { forecast: [] } });
    },
  });
  await client.callService('weather', 'get_forecasts', {
    entity_id: 'weather.local',
    type: 'hourly',
  });
  assert.equal(
    requestUrl,
    'http://supervisor/core/api/services/weather/get_forecasts?return_response',
  );
  assert.deepEqual(JSON.parse(requestBody), { entity_id: 'weather.local', type: 'hourly' });
});

test('preserves Home Assistant 401, 403 and 404 meanings', async () => {
  for (const status of [401, 403, 404]) {
    const client = createSupervisorHomeAssistant({
      token: 'fixture-token',
      request: async () => new Response('denied', { status }),
    });
    await assert.rejects(client.getStates(), (error: unknown) => {
      assert.ok(error instanceof HomeAssistantUpstreamError);
      assert.equal(error.statusCode, status);
      assert.match(error.code, /^HA_/);
      return true;
    });
  }
});

test('maps upstream timeout and malformed JSON without retrying writes', async () => {
  let calls = 0;
  const timedOut = createSupervisorHomeAssistant({
    token: 'fixture-token',
    request: async () => {
      const error = new Error('timeout');
      error.name = 'TimeoutError';
      throw error;
    },
  });
  await assert.rejects(timedOut.getStates(), { statusCode: 504, code: 'HA_TIMEOUT' });

  const malformed = createSupervisorHomeAssistant({
    token: 'fixture-token',
    request: async () => new Response('<html>not json</html>', { status: 200 }),
  });
  await assert.rejects(malformed.getStates(), { statusCode: 502, code: 'HA_INVALID_JSON' });

  const unavailable = createSupervisorHomeAssistant({
    token: 'fixture-token',
    request: async () => {
      calls += 1;
      return new Response('failed', { status: 503 });
    },
  });
  await assert.rejects(unavailable.callService('light', 'turn_on', { entity_id: 'light.fixture' }));
  assert.equal(calls, 1);
});

test('rejects responses that exceed the configured bound', async () => {
  const client = createSupervisorHomeAssistant({
    token: 'fixture-token',
    request: async () => new Response('"'.padEnd(2 * 1024 * 1024 + 10, 'x'), { status: 200 }),
  });
  await assert.rejects(client.getStates(), { statusCode: 502, code: 'HA_RESPONSE_TOO_LARGE' });
});
