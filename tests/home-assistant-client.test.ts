import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { createClient } from '../src/shared/home-assistant/client';

class FakeXmlHttpRequest {
  static requests: FakeXmlHttpRequest[] = [];
  listeners = new Map<string, (() => void)[]>();
  headers = new Map<string, string>();
  method = '';
  url = '';
  body: string | null = null;
  status = 0;
  responseText = '';
  timeout = 0;

  constructor() {
    FakeXmlHttpRequest.requests.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  addEventListener(name: string, listener: () => void) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  send(body: string | null) {
    this.body = body;
  }

  abort() {
    this.dispatch('abort');
    this.dispatch('loadend');
  }

  respond(status: number, response: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(response);
    this.dispatch('load');
    this.dispatch('loadend');
  }

  private dispatch(name: string) {
    for (const listener of this.listeners.get(name) ?? []) {
      listener();
    }
  }
}

const originalXhr = globalThis.XMLHttpRequest;

afterEach(() => {
  globalThis.XMLHttpRequest = originalXhr;
  FakeXmlHttpRequest.requests = [];
});

function installFakeXhr() {
  globalThis.XMLHttpRequest = FakeXmlHttpRequest as unknown as typeof XMLHttpRequest;
}

test('uses relative same-origin endpoints for configured HA data', async () => {
  installFakeXhr();
  const client = createClient();
  const pending = client.getState('light.ceiling');
  const request = FakeXmlHttpRequest.requests[0];
  assert.equal(request.method, 'GET');
  assert.equal(request.url, 'api/ha/states/light.ceiling');
  assert.equal(request.timeout, 10_000);
  request.respond(200, { entity_id: 'light.ceiling', state: 'on' });
  assert.deepEqual(await pending, { entity_id: 'light.ceiling', state: 'on' });
});

test('sends one constrained write with the anti-CSRF header and preserves weather response', async () => {
  installFakeXhr();
  const client = createClient('ingress-prefix/');
  const pending = client.callService({
    domain: 'light',
    service: 'turn_on',
    data: { entity_id: 'light.ceiling' },
  });
  const request = FakeXmlHttpRequest.requests[0];
  assert.equal(request.url, 'ingress-prefix/api/ha/services/light/turn_on');
  assert.equal(request.headers.get('x-everdash-request'), '1');
  assert.deepEqual(JSON.parse(request.body ?? 'null'), { entity_id: 'light.ceiling' });
  request.respond(200, []);
  await pending;

  const forecast = client.getWeatherForecast('weather.local');
  const forecastRequest = FakeXmlHttpRequest.requests[1];
  forecastRequest.respond(200, { service_response: { forecast: [{ temperature: 20 }] } });
  assert.deepEqual(await forecast, { service_response: { forecast: [{ temperature: 20 }] } });
  assert.equal(FakeXmlHttpRequest.requests.length, 2);
});

test('keeps abort ownership local to each client and does not retry a failed write', async () => {
  installFakeXhr();
  const firstClient = createClient();
  const secondClient = createClient();
  const first = firstClient.getStates();
  const second = firstClient.callService({
    domain: 'switch',
    service: 'turn_off',
    data: { entity_id: 'switch.plug' },
  });
  const independent = secondClient.getStates();
  firstClient.abort();
  await assert.rejects(first, /cancelled/);
  await assert.rejects(second, /cancelled/);
  FakeXmlHttpRequest.requests[2].respond(200, []);
  await independent;
  assert.equal(FakeXmlHttpRequest.requests.length, 3);
});

test('distinguishes a Home Assistant credential failure from a device pairing failure', async () => {
  installFakeXhr();
  const client = createClient();
  const upstreamFailure = client.getStates();
  FakeXmlHttpRequest.requests[0].respond(401, { code: 'HA_UNAUTHORIZED' });
  await assert.rejects(upstreamFailure, /EverDash could not connect to Home Assistant/);

  const pairingFailure = client.getStates();
  FakeXmlHttpRequest.requests[1].respond(401, { code: 'UNAUTHORIZED' });
  await assert.rejects(pairingFailure, /not paired or authorized/);
});
