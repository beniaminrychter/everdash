import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, extname, resolve as resolvePath } from 'node:path';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dashboardDocument } from './fixtures/dashboard.ts';

// Isolated fixtures use Playwright; the user's existing IAB tab is verified separately.
// A separate build uses an isolated HA fixture, never the user's credentials or devices.
const temporary = await mkdtemp(join(tmpdir(), 'my-home-ha-check-'));
const buildDirectory = join(temporary, 'dist');
const output = process.env.MY_HOME_SCREENSHOT_DIR || join(tmpdir(), 'my-home-browser-check');

/**
 * Resizes a page and waits for its layout to follow. The cards' grid measures its container, so
 * it settles on the first animation frames after a resize rather than inside setViewportSize.
 */
async function resize(target, size) {
  await target.setViewportSize(size);
  await target.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}
/** Presses the brightness pill at the first percentage and drags it through the rest. */
async function dragBrightness(target, percents) {
  const box = await target.locator('#brightness').boundingBox();
  const at = (percent) => box.y + box.height * (1 - percent / 100);
  const x = box.x + box.width / 2;

  await target.mouse.move(x, at(percents[0]));
  await target.mouse.down();
  for (const percent of percents.slice(1)) {
    await target.mouse.move(x, at(percent));
  }
  await target.mouse.up();
}
await mkdir(output, { recursive: true });
const lightId = 'light.salon_dodatkowe';
const outletId = 'switch.ogrod_taras_kinkiety';
const climateId = 'climate.ac';
const usageId = 'sensor.pstryk_multisensor_activepower_0';
const token = 'isolated-browser-test-token';
const states = {
  [lightId]: {
    attributes: { brightness: 204, supported_color_modes: ['brightness'] },
    entity_id: lightId,
    state: 'on',
  },
  [outletId]: { attributes: {}, entity_id: outletId, state: 'off' },
};
// Exact IDs mirror the application config; names do not determine bindings.
for (const [id, name] of [
  ['light.salon_glowne', 'Salon Główne'],
  ['light.tv', 'TV'],
  ['light.kuchnia', 'Kuchnia'],
  ['light.jadalnia', 'Jadalnia'],
  ['light.szafki', 'Szafki'],
  ['light.skrytka', 'Skrytka'],
]) {
  states[id] = {
    attributes: { brightness: 180, friendly_name: name, supported_color_modes: ['brightness'] },
    entity_id: id,
    state: 'off',
  };
}
const observed = (id, name, state, attributes = {}) => ({
  attributes: { friendly_name: name, ...attributes },
  entity_id: id,
  state,
});
const sensorIds = [
  'sensor.czujnik_jadalnia_temperatura',
  'sensor.fixture_kitchen_humidity',
  'sensor.fixture_living_temp',
  'binary_sensor.fixture_living_window',
];
states[sensorIds[0]] = observed(sensorIds[0], 'Czujnik Jadalnia Temperatura', '21.2', {
  device_class: 'temperature',
  unit_of_measurement: '°C',
});
states[sensorIds[1]] = observed(sensorIds[1], 'Czujnik Jadalnia Wilgotność', '68.9', {
  device_class: 'humidity',
  unit_of_measurement: '%',
});
states[sensorIds[2]] = observed(sensorIds[2], 'Salon Temperature', '22.5', {
  device_class: 'temperature',
  unit_of_measurement: '°C',
});
states[sensorIds[3]] = observed(sensorIds[3], 'Living room window', 'off', {
  device_class: 'window',
});
const hour = Math.floor(Date.now() / 3_600_000) * 3_600_000;
const schedule = Array.from({ length: 24 }, (_, index) => ({
  price: index === 8 ? -0.1 : 0.3 + (index % 7) * 0.08,
  time: new Date(hour + (index - 6) * 3600000).toISOString(),
}));
states['sensor.pstryk_current_buy_price'] = observed(
  'sensor.pstryk_current_buy_price',
  'Pstryk Buy Price',
  '0.68',
  {
    'Next hour': 0.45,
    is_cheap: false,
    prices_today: schedule,
    unit_of_measurement: 'PLN/kWh',
  },
);
states['sensor.pstryk_current_sell_price'] = observed(
  'sensor.pstryk_current_sell_price',
  'Pstryk Sell Price',
  '0.24',
  {
    unit_of_measurement: 'PLN/kWh',
  },
);
states['sensor.fixture_next'] = observed(
  'sensor.fixture_next',
  'Pstryk Buy Price Next Hour',
  '0.45',
  { unit_of_measurement: 'PLN/kWh' },
);
states[usageId] = observed(usageId, 'Pstryk Active power', '13586', {
  device_class: 'power',
  unit_of_measurement: 'W',
});
states['weather.dom'] = observed('weather.dom', 'Home', 'partlycloudy', {
  apparent_temperature: 12.6,
  humidity: 72,
  precipitation_unit: 'mm',
  pressure: 1013,
  pressure_unit: 'hPa',
  supported_features: 3,
  temperature: 14.2,
  temperature_unit: '°C',
  wind_bearing: 225,
  wind_speed: 8,
  wind_speed_unit: 'km/h',
});
states['sun.sun'] = observed('sun.sun', 'Sun', 'above_horizon');
const guestId = 'input_boolean.fixture_guest';
const sceneId = 'scene.fixture_evening';
states[guestId] = observed(guestId, 'Guest mode', 'off');
states['binary_sensor.fixture_door'] = observed('binary_sensor.fixture_door', 'Front door', 'on', {
  device_class: 'door',
});
states['sensor.fixture_value'] = observed('sensor.fixture_value', 'Fixture power', '1234.5678', {
  unit_of_measurement: 'W',
});
// A never-activated scene reports "unknown" and must stay runnable.
states[sceneId] = observed(sceneId, 'Evening', 'unknown');
states[climateId] = observed(climateId, 'Air Conditioner', 'heat', {
  current_temperature: 24,
  fan_mode: 'auto',
  fan_modes: ['auto', 'low', 'middle_low', 'medium', 'middle_high', 'high'],
  hvac_modes: ['off', 'fan_only', 'heat', 'cool', 'dry', 'auto'],
  max_temp: 32,
  min_temp: 16,
  supported_features: 441,
  target_temp_step: 1,
  temperature: 22,
});
// Forty hours reach past tomorrow's midnight; the first one has already started.
const forecast = Array.from({ length: 40 }, (_, index) => ({
  condition: index < 3 ? 'sunny' : index % 9 === 8 ? 'rainy' : 'partlycloudy',
  datetime: new Date(hour + index * 3600000).toISOString(),
  precipitation_probability: (index * 5) % 60,
  temperature: 15 + index / 10,
}));
// Daily entries name their calendar day in the dashboard time zone, from today on.
const dailyForecast = Array.from({ length: 8 }, (_, index) => ({
  condition: index % 3 === 2 ? 'rainy' : 'sunny',
  datetime: `${new Date(hour + index * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' })}T00:00:00+00:00`,
  precipitation_probability: index * 10,
  temperature: 17 + index / 10,
  templow: 9 + index / 10,
}));
let forecastStatus = 200;
let forecastRequests = 0;
const commands = [];
const reads = [];
let responseStatus = 200;
let malformed = false;
let appUnavailable = false;
let holdServices = false;
let nextServiceStatus = 200;
const serviceWaiters = [];
let appUrl;
const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const api = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://fixture');
    response.setHeader('Access-Control-Allow-Origin', appUrl.slice(0, -1));
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Cache-Control', 'no-store');
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    if (request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401).end('{}');
      return;
    }
    if (responseStatus !== 200) {
      response.writeHead(responseStatus).end('{}');
      return;
    }
    if (url.pathname === '/api/states') {
      response.end(malformed ? '<html>invalid</html>' : JSON.stringify(Object.values(states)));
      return;
    }
    if (url.pathname.startsWith('/api/states/')) {
      const id = decodeURIComponent(url.pathname.slice('/api/states/'.length));
      reads.push(id);
      if (!states[id]) {
        response.writeHead(404).end('{}');
        return;
      }
      response.end(malformed ? '<html>not JSON</html>' : JSON.stringify(states[id]));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/services/weather/get_forecasts') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const { entity_id: forecastEntity, type: forecastType, ...extra } = JSON.parse(body);
      assert.equal(forecastEntity, 'weather.dom');
      assert.ok(['hourly', 'daily'].includes(forecastType));
      assert.deepEqual(extra, {});
      assert.ok(url.searchParams.has('return_response'));
      forecastRequests++;
      response.writeHead(forecastStatus).end(
        JSON.stringify({
          service_response: {
            'weather.dom': { forecast: forecastType === 'daily' ? dailyForecast : forecast },
          },
        }),
      );
      return;
    }
    const climateMatch = url.pathname.match(
      /^\/api\/services\/climate\/(set_temperature|set_hvac_mode|set_fan_mode)$/,
    );
    if (request.method === 'POST' && climateMatch) {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const data = JSON.parse(body);
      assert.equal(data.entity_id, climateId);
      commands.push({ data, domain: 'climate', service: climateMatch[1] });
      const status = nextServiceStatus;
      nextServiceStatus = 200;
      if (holdServices) {
        await new Promise((resolve) => serviceWaiters.push(resolve));
      }
      if (status !== 200) {
        response.writeHead(status).end('{}');
        return;
      }
      if (climateMatch[1] === 'set_temperature') {
        states[climateId].attributes.temperature = data.temperature;
      }
      if (climateMatch[1] === 'set_hvac_mode') {
        states[climateId].state = data.hvac_mode;
      }
      if (climateMatch[1] === 'set_fan_mode') {
        states[climateId].attributes.fan_mode = data.fan_mode;
      }
      response.end('[]');
      return;
    }
    const match = url.pathname.match(
      /^\/api\/services\/(light|switch|input_boolean|scene)\/(turn_on|turn_off)$/,
    );
    if (request.method === 'POST' && match) {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const data = JSON.parse(body);
      assert.ok([lightId, outletId, guestId, sceneId].includes(data.entity_id));
      assert.equal(match[1], data.entity_id.split('.')[0]);
      commands.push({ data, domain: match[1], service: match[2] });
      const status = nextServiceStatus;
      nextServiceStatus = 200;
      if (holdServices) {
        await new Promise((resolve) => serviceWaiters.push(resolve));
      }
      if (status !== 200) {
        response.writeHead(status).end('{}');
        return;
      }
      const entity = states[data.entity_id];
      if (match[1] === 'scene') {
        entity.state = new Date().toISOString();
        response.end(JSON.stringify([entity]));
        return;
      }
      entity.state = match[2] === 'turn_on' ? 'on' : 'off';
      if (data.brightness_pct !== undefined) {
        entity.attributes.brightness = Math.round((data.brightness_pct / 100) * 255);
      }
      if (data.rgb_color) {
        entity.attributes.rgb_color = data.rgb_color;
      }
      response.end(JSON.stringify([entity]));
      return;
    }
    response.writeHead(404).end('{}');
  } catch (error) {
    response.writeHead(500).end(JSON.stringify({ error: error.message }));
  }
});
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://fixture');
    const { pathname } = url;
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (appUnavailable && url.searchParams.has('__reload')) {
      response.writeHead(503).end('Unavailable');
      return;
    }
    if (relative.includes('..')) {
      response.writeHead(400).end();
      return;
    }
    let contents = await readFile(join(buildDirectory, relative));
    if (relative === 'index.html' && url.searchParams.has('__reload')) {
      contents = contents.toString().replace('<html', '<html data-hard-reload-proof="fresh"');
    }
    if (relative === 'index.html' && url.searchParams.has('legacy')) {
      contents = contents
        .toString()
        .replaceAll(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g, '')
        .replaceAll(' nomodule', '');
    }
    response.setHeader('Content-Type', types[extname(relative)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.end(contents);
  } catch {
    response.writeHead(404).end();
  }
});
const listen = (serverInstance) =>
  new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
let browser;
const errors = [];
try {
  await listen(server);
  await listen(api);
  appUrl = `http://127.0.0.1:${server.address().port}/`;
  const apiUrl = `http://127.0.0.1:${api.address().port}`;
  const routeHaApi = async (browserContext) => {
    await browserContext.route('**/api/access', (route) =>
      route.fulfill({ json: { status: 'registered' } }),
    );
    await browserContext.route('**/api/bootstrap', async (route) => {
      const source = route.request().headers().referer || route.request().url();
      const url = new URL(source);
      const fixtureViews = [
        ...dashboardDocument.views,
        {
          id: 'fixture-room',
          title: 'Meter room',
          badges: [{ type: 'temperature', entity: 'sensor.fixture_living_temp' }],
          cards: [
            { type: 'weather', entity: 'weather.dom', name: 'Room weather' },
            {
              type: 'light',
              entity: 'light.salon_dodatkowe',
              name: 'Reading lamp',
              icon: 'pendant',
            },
            {
              type: 'pstryk',
              entity: 'sensor.pstryk_current_buy_price',
              name: 'Room energy',
              usage: 'sensor.pstryk_multisensor_activepower_0',
            },
            { type: 'weather', entity: 'weather.dom', name: 'Outdoor weather', forecast: 'daily' },
          ],
        },
        {
          id: 'fixture-sensors',
          title: 'Sensors',
          badges: [{ type: 'temperature', entity: 'sensor.fixture_living_temp' }],
        },
        ...(url.searchParams.has('weather')
          ? [
              {
                id: 'fixture-weather',
                title: 'Weather layouts',
                cards: [
                  { type: 'weather', entity: 'weather.dom', name: 'Full two rows' },
                  { type: 'weather', entity: 'weather.dom', name: 'Half two rows', size: 'half' },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Daily half two rows',
                    size: 'half',
                    forecast: 'daily',
                  },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Quarter two rows',
                    size: 'quarter',
                  },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Daily quarter two rows',
                    size: 'quarter',
                    forecast: 'daily',
                  },
                  { type: 'weather', entity: 'weather.dom', name: 'Full one row', rows: 1 },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Half one row',
                    size: 'half',
                    rows: 1,
                  },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Daily half one row',
                    size: 'half',
                    forecast: 'daily',
                    rows: 1,
                  },
                  {
                    type: 'weather',
                    entity: 'weather.dom',
                    name: 'Quarter one row',
                    size: 'quarter',
                    rows: 1,
                  },
                ],
              },
            ]
          : []),
        ...(url.searchParams.has('extras')
          ? [
              {
                id: 'fixture-extras',
                title: 'Extras',
                cards: [
                  {
                    type: 'value',
                    entity: 'sensor.fixture_value',
                    name: 'Tile power',
                    precision: 1,
                    unit: 'watts',
                  },
                  {
                    type: 'value',
                    entity: 'sensor.fixture_value',
                    name: 'Compact power',
                    template: 'compact',
                  },
                  {
                    type: 'value',
                    entity: 'sensor.fixture_value',
                    name: 'Hero power',
                    template: 'hero',
                  },
                  { type: 'toggle', entity: guestId, name: 'Guest mode' },
                  { type: 'toggle', entity: 'binary_sensor.fixture_door', name: 'Front door' },
                  { type: 'scene', entity: sceneId, name: 'Evening' },
                ],
              },
            ]
          : []),
      ];
      // One view of widgets of every width and tiles, to check how the grid lays them out.
      const widthViews = [
        {
          id: 'fixture-widths',
          title: 'Widths',
          badges: [],
          cards: [
            { type: 'clock', name: 'Quarter one' },
            { type: 'clock', name: 'Quarter two' },
            { type: 'clock', name: 'Quarter three' },
            { type: 'clock', name: 'Half one', size: 'half' },
            { type: 'clock', name: 'Half two', size: 'half' },
            { type: 'clock', name: 'Full row', size: 'full' },
            { type: 'value', entity: 'sensor.fixture_living_temp', name: 'Tile one' },
            { type: 'value', entity: 'sensor.fixture_living_temp', name: 'Tile two' },
            { type: 'value', entity: 'sensor.fixture_living_temp', name: 'Tile three' },
            { type: 'value', entity: 'sensor.fixture_living_temp', name: 'Tile four' },
          ],
        },
      ];
      const config = {
        ...dashboardDocument,
        views: url.searchParams.has('sensors-only')
          ? fixtureViews.filter((view) => view.id === 'fixture-sensors')
          : url.searchParams.has('widths-only')
            ? widthViews
            : fixtureViews,
      };
      await route.fulfill({
        json: { mode: 'direct', configured: true, revision: 'fixture-v1', config },
      });
    });
    await browserContext.route('**/api/ha/**', async (route) => {
      const incoming = new URL(route.request().url());
      const upstreamPath = incoming.pathname.replace('/api/ha', '/api');
      const query = incoming.pathname.endsWith('/weather/get_forecasts')
        ? '?return_response'
        : incoming.search;
      try {
        const response = await route.fetch({
          url: `${apiUrl}${upstreamPath}${query}`,
          headers: { ...route.request().headers(), authorization: `Bearer ${token}` },
        });
        await route.fulfill({ response });
      } catch {
        try {
          await route.abort();
        } catch {
          // The owning page may have navigated or closed while the fixture was in flight.
        }
      }
    });
  };
  // Build an isolated copy so browser checks never edit the user's installed app.
  const testConfig = join(temporary, 'vite.config.mjs');
  await writeFile(
    testConfig,
    `
    import original from ${JSON.stringify(resolvePath('vite.config.ts'))};
    export default original;
  `,
  );
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'build',
        '--config',
        testConfig,
        '--outDir',
        buildDirectory,
      ],
      {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let log = '';
    child.stdout.on('data', (chunk) => {
      log += chunk;
    });
    child.stderr.on('data', (chunk) => {
      log += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(log))));
  });
  browser = await chromium.launch({
    channel: process.env.MY_HOME_BROWSER_CHANNEL || 'chrome',
    headless: true,
  });
  const context = await browser.newContext({ viewport: { height: 768, width: 1024 } });
  await routeHaApi(context);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  const openSettings = async (target = page) =>
    target.getByRole('button', { exact: true, name: 'Settings' }).click();
  const closeSettings = async (target = page) =>
    target.getByRole('button', { exact: true, name: 'Close settings' }).click();
  const refreshPage = async () => {
    await openSettings();
    await page.getByRole('button', { exact: true, name: 'Refresh' }).click();
    await closeSettings();
  };
  const expectConnection = async (text) => {
    await openSettings();
    await expect(page.getByRole('status', { name: 'Home Assistant connection' })).toContainText(
      text,
    );
    await closeSettings();
  };
  await page.goto(appUrl);
  await expect(page).toHaveTitle('EverDash');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /maximum-scale=1, user-scalable=no/,
  );
  expect(
    await page.evaluate(() => {
      const target = document;
      const gesture = (type) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };
      const touch = (type, count) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'touches', {
          value: Array.from({ length: count }, () => ({})),
        });
        target.dispatchEvent(event);
        return event.defaultPrevented;
      };
      return [
        gesture('gesturestart'),
        gesture('gesturechange'),
        touch('touchstart', 2),
        touch('touchmove', 2),
        touch('touchstart', 1),
        touch('touchmove', 1),
      ];
    }),
  ).toEqual([true, true, true, true, false, false]);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await expect(page.getByText('Home, sweet home.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { exact: true, name: 'Refresh' })).toHaveCount(0);
  await expect(page.locator('[data-device]')).toHaveCount(8);
  const light = page.locator(`[data-device="${lightId}"]`);
  const outlet = page.locator(`[data-device="${outletId}"]`);
  await expect(light.getByTestId('device-status')).toHaveText('80%');
  await expect(outlet.getByTestId('device-status')).toHaveText('Off');
  await expectConnection('Connected to Home Assistant');
  // The focus ring is for keyboard use only, so focus follows a key press as it would with Tab.
  await page.keyboard.press('Shift');
  await page.getByRole('button', { exact: true, name: 'Settings' }).focus();
  expect(
    await page
      .getByRole('button', { exact: true, name: 'Settings' })
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe('solid');
  expect(
    await page.locator('main').evaluate((element) => getComputedStyle(element).userSelect),
  ).toBe('none');

  await expect(light.locator('svg').first()).toHaveAttribute('stroke-width', '1.8');
  await expect(light.locator('svg').first()).toHaveAttribute('stroke-linecap', 'round');
  await expect(page.getByRole('button', { exact: true, name: 'Show price chart' })).toBeVisible();
  await expect(page.getByRole('heading', { exact: true, name: 'Energy' })).toBeVisible();
  await expect(page.getByTestId('energy-buy')).toHaveText('0.68');
  await expect(page.getByTestId('energy-usage')).toHaveText('13.59 kW');
  // Refresh reads the selected meter, including valid zero, export and unavailable states.
  states[usageId].state = '0';
  await refreshPage();
  await expect(page.getByTestId('energy-usage')).toHaveText('0.00 kW');
  states[usageId].state = '-1200';
  await refreshPage();
  await expect(page.getByText('Grid export', { exact: true })).toBeVisible();
  await expect(page.getByTestId('energy-usage')).toHaveText('1.20 kW');
  states[usageId].state = 'unavailable';
  await refreshPage();
  await expect(page.getByTestId('energy-usage')).toHaveText('—');
  states[usageId].state = '13586';
  await refreshPage();
  await expect(page.getByText('Current usage', { exact: true })).toBeVisible();
  await expect(page.getByTestId('energy-usage')).toHaveText('13.59 kW');
  await expect(page.getByTestId('energy-chart')).toHaveCount(0);
  await page.getByRole('button', { exact: true, name: 'Show price chart' }).click();
  await expect(page.getByTestId('energy-chart')).toBeVisible();
  await expect(page.getByTestId('energy-price-bar')).toHaveCount(24);
  expect(
    await page
      .getByTestId('energy-chart')
      .evaluate(
        (element) =>
          element.getBoundingClientRect().top <
          document.querySelector('[data-testid="energy-buy"]').getBoundingClientRect().top,
      ),
  ).toBe(true);
  const axisBeforeScroll = await page.getByTestId('energy-chart-axis').boundingBox();
  await page.getByTestId('energy-price-bar').last().click();
  const axisAfterScroll = await page.getByTestId('energy-chart-axis').boundingBox();
  expect(axisAfterScroll.x).toBeLessThan(axisBeforeScroll.x);
  expect(axisAfterScroll.width).toBeGreaterThanOrEqual(24 * 24);
  const firstPrice = String(schedule[0].price.toFixed(2));
  await page.getByTestId('energy-price-bar').first().click();
  await expect(page.getByTestId('energy-selected-price')).toContainText(firstPrice);
  await expect(page.getByTestId('energy-price-bar').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByTestId('energy-price-bar').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('energy-selected-price')).toContainText(
    schedule[1].price.toFixed(2),
  );
  await expect(page.getByTestId('energy-price-bar').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('energy-price-bar').nth(2).focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('energy-price-bar').nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ fullPage: true, path: join(output, 'energy-chart-ipad.png') });

  // Older ha_Pstryk versions use local wall-clock timestamps and a Next hour attribute.
  const originalBuy = states['sensor.pstryk_current_buy_price'];
  const originalNext = states['sensor.fixture_next'];
  const localTime = new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
  });
  states['sensor.pstryk_current_buy_price'] = observed(
    'sensor.pstryk_current_buy_price',
    'Pstryk Buy Price',
    '-0.10',
    {
      'All prices': schedule.map((slot) => ({
        start: localTime.format(new Date(slot.time)).replace(' ', 'T'),
        price: slot.time === new Date(hour).toISOString() ? -0.1 : slot.price,
      })),
      'Is cheap': false,
      'Next hour': 0.91,
      unit_of_measurement: 'PLN/kWh',
    },
  );
  delete states['sensor.fixture_next'];
  await refreshPage();
  await expect(page.getByText('Next hour', { exact: true }).locator('..')).toContainText('0.91');
  await expect(page.locator('[data-price-status]')).toHaveAttribute('data-price-status', 'cheap');
  await expect(page.getByText('Lowest today', { exact: true })).toBeVisible();
  await expect(page.getByTestId('energy-price-bar')).toHaveCount(24);
  states['sensor.pstryk_current_buy_price'] = originalBuy;
  states['sensor.fixture_next'] = originalNext;
  await refreshPage();
  await expect(page.getByText('Next hour', { exact: true }).locator('..')).toContainText('0.45');
  await expect(page.getByTestId('weather-temperature')).toHaveText('14.2°C');
  const weather = page.getByRole('region', { exact: true, name: 'Current weather' });
  await expect(weather.locator('[data-forecast-hour]').first()).toContainText('15.1°C');
  // The strip holds the next day and a half, not just a few hours, and says where tomorrow starts.
  expect(await weather.locator('[data-forecast-hour]').count()).toBeGreaterThanOrEqual(36);
  await expect(weather.locator('[data-forecast-day-break]').first()).toHaveText('Tomorrow');
  await expect(weather.getByTestId('weather-feels-like')).toHaveText('Feels like 12.6°C');
  await expect(weather.getByTestId('weather-range')).toContainText('High 17.0°C');
  await expect(weather.getByTestId('weather-range')).toContainText('Low 9.0°C');
  await expect(weather.getByTestId('weather-details')).toContainText('72%');
  await expect(weather.getByTestId('weather-details')).toContainText('SW 8 km/h');
  await expect(weather.getByTestId('weather-details')).toContainText('1013 hPa');
  const strip = weather.getByRole('list', { exact: true, name: 'Hourly forecast' });
  const fades = () =>
    strip.evaluate((list) =>
      [list.nextElementSibling, list.nextElementSibling.nextElementSibling].map(
        (fade) => getComputedStyle(fade).opacity,
      ),
    );
  expect(await strip.evaluate((list) => list.scrollWidth > list.clientWidth)).toBe(true);
  expect(await strip.evaluate((list) => getComputedStyle(list).overflowX)).toBe('auto');
  expect(await fades()).toEqual(['0', '1']);
  await strip.evaluate((list) => {
    list.scrollLeft = list.scrollWidth;
  });
  await expect.poll(fades).toEqual(['1', '0']);
  expect(forecastRequests).toBeGreaterThan(0);
  forecastStatus = 500;
  await refreshPage();
  await expect(weather.getByText('Hourly forecast unavailable')).toBeVisible();
  await expect(page.getByTestId('weather-temperature')).toHaveText('14.2°C');
  forecastStatus = 200;
  await refreshPage();
  await expect(weather.locator('[data-forecast-hour]').first()).toContainText('15.1°C');

  await expect(page.locator('[data-sensor="sensor.czujnik_jadalnia_temperatura"]')).toContainText(
    '21.2',
  );
  await expect(page.locator('[data-sensor]')).toHaveCount(1);
  await expect(page.getByRole('heading', { exact: true, name: 'Kitchen sensors' })).toHaveCount(0);
  await page.getByRole('button', { exact: true, name: 'Hide price chart' }).click();
  await openSettings();
  await page.getByRole('button', { exact: true, name: 'Polski' }).click();
  await expect(page.getByRole('heading', { exact: true, name: 'Ustawienia' })).toBeVisible();
  await expect(page.getByRole('button', { exact: true, name: 'Polski' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { exact: true, name: 'Zamknij ustawienia' }).click();
  await expect(page).toHaveTitle('EverDash');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await expect(page.getByRole('heading', { exact: true, name: 'Air Conditioner' })).toBeVisible();
  await expect(page.getByRole('heading', { exact: true, name: 'Energia' })).toBeVisible();
  await expect(page.getByTestId('energy-buy')).toHaveText('0,68');
  await expect(page.getByTestId('energy-usage')).toHaveText('13,59 kW');
  await expect(page.getByTestId('weather-temperature')).toHaveText('14,2°C');
  await expect(page.getByTestId('climate-temperature')).toHaveText('22,0°C');
  await expect(
    page.getByRole('paragraph').filter({ hasText: /^Częściowe zachmurzenie$/ }),
  ).toBeVisible();
  await page.getByRole('button', { exact: true, name: 'Pokaż wykres cen' }).click();
  await page.getByTestId('energy-price-bar').nth(8).click();
  await expect(page.getByTestId('energy-selected-price')).toContainText('-0,10');
  for (const width of [1024, 375, 320]) {
    await resize(page, { height: 768, width });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({ fullPage: true, path: join(output, `polish-graph-${width}.png`) });
  }
  await resize(page, { height: 768, width: 1024 });
  await page.getByRole('button', { exact: true, name: 'First floor, wybierz pulpit' }).click();
  await page.getByRole('button', { exact: true, name: 'Meter room' }).click();
  await expect(page.getByRole('heading', { exact: true, name: 'Room weather' })).toBeVisible();
  await expect(page.getByRole('heading', { exact: true, name: 'Outdoor weather' })).toBeVisible();
  // The daily variant lists one entry per day, labelled in the app language.
  const dailyWeather = page.getByRole('region', { exact: true, name: 'Outdoor weather' });
  await expect(dailyWeather.locator('[data-forecast-day]')).toHaveCount(8);
  await expect(dailyWeather.locator('[data-forecast-day]').nth(0)).toContainText('Dziś');
  await expect(dailyWeather.locator('[data-forecast-day]').nth(0)).toContainText('17,0°C');
  await expect(dailyWeather.locator('[data-forecast-day]').nth(0)).toContainText('9,0°C');
  await expect(dailyWeather.locator('[data-forecast-day]').nth(1)).toContainText('Jutro');
  await expect(dailyWeather.locator('[data-forecast-hour]')).toHaveCount(0);
  await expect(
    page
      .getByRole('region', { exact: true, name: 'Room weather' })
      .locator('[data-forecast-hour]')
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { exact: true, name: 'Meter room, wybierz pulpit' }).click();
  await page.getByRole('button', { exact: true, name: 'First floor' }).click();

  await page.reload();
  await expect(page.getByRole('heading', { exact: true, name: 'Energia' })).toBeVisible();
  await expect(page.getByTestId('energy-buy')).toHaveText('0,68');
  await page.getByRole('button', { exact: true, name: 'Ustawienia' }).click();
  await expect(page.getByRole('heading', { exact: true, name: 'Język' })).toBeVisible();
  await page.getByRole('button', { exact: true, name: 'English' }).click();
  await closeSettings();
  await expect(page).toHaveTitle('EverDash');
  await expect(page.getByRole('heading', { exact: true, name: 'Energy' })).toBeVisible();
  const picker = page.getByRole('button', { exact: true, name: 'First floor, choose dashboard' });
  await picker.click();
  await expect(page.getByRole('button', { exact: true, name: 'First floor' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(picker).toBeFocused();
  await picker.click();
  await page.getByRole('button', { exact: true, name: 'First floor' }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('my-home:preferences:v1')).page),
  ).toBe('first-floor');
  await openSettings();
  await expect(page.getByText('Connected through EverDash', { exact: true })).toBeVisible();
  await page.getByRole('button', { exact: true, name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await closeSettings();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await openSettings();
  await page.getByRole('button', { exact: true, name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { exact: true, name: 'Auto' }).click();
  await closeSettings();
  states['sun.sun'].state = 'below_horizon';
  await refreshPage();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  states['sun.sun'].state = 'above_horizon';
  await refreshPage();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // Refresh and price status do not send any service commands.
  expect(commands).toHaveLength(0);
  const controlIds = new Set([
    lightId,
    outletId,
    'light.salon_glowne',
    'light.tv',
    'light.kuchnia',
    'light.jadalnia',
    'light.szafki',
    'light.skrytka',
  ]);
  expect(
    reads.every(
      (id) =>
        controlIds.has(id) ||
        id === climateId ||
        sensorIds.includes(id) ||
        id === usageId ||
        ['sensor.pstryk_current_buy_price', 'sensor.pstryk_current_sell_price'].includes(id) ||
        id.startsWith('weather.') ||
        id === 'sun.sun',
    ),
  ).toBe(true);
  const ac = page.getByRole('region', { exact: true, name: 'Air Conditioner' });
  await expect(ac.getByTestId('climate-temperature')).toHaveText('22.0°C');
  for (const direction of ['Decrease', 'Increase']) {
    const button = ac.getByRole('button', {
      exact: true,
      name: `${direction} Air Conditioner temperature`,
    });
    const geometry = await button.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const icon = element.querySelector('svg').getBoundingClientRect();
      return {
        appearance: getComputedStyle(element).webkitAppearance,
        dx: Math.abs(box.x + box.width / 2 - icon.x - icon.width / 2),
        dy: Math.abs(box.y + box.height / 2 - icon.y - icon.height / 2),
        height: box.height,
        width: box.width,
      };
    });
    expect(geometry).toEqual({ appearance: 'none', dx: 0, dy: 0, height: 44, width: 44 });
  }

  await expect(ac.getByText('Set temperature', { exact: true })).toHaveCount(0);
  await expect(ac.getByRole('button', { exact: true, name: 'Heat' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  holdServices = true;
  await ac
    .getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' })
    .click();
  await ac
    .getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' })
    .click();
  await expect(ac.getByTestId('climate-temperature')).toHaveText('24.0°C');
  await expect.poll(() => serviceWaiters.length).toBe(1);
  await ac.getByRole('button', { exact: true, name: 'High' }).click();
  await expect(ac.getByRole('button', { exact: true, name: 'High' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    ac.getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' }),
  ).toBeEnabled();
  holdServices = false;
  serviceWaiters.shift()();
  await expect.poll(() => states[climateId].attributes.fan_mode).toBe('high');
  expect(
    commands.find(
      (command) => command.domain === 'climate' && command.service === 'set_temperature',
    ).data,
  ).toEqual({ entity_id: climateId, temperature: 24 });
  await ac.getByRole('button', { exact: true, name: 'Mid' }).click();
  await expect.poll(() => states[climateId].attributes.fan_mode).toBe('medium');
  for (const [label, value] of [
    ['Off', 'off'],
    ['Cool', 'cool'],
    ['Heat', 'heat'],
    ['Dry', 'dry'],
  ]) {
    await ac.getByRole('button', { exact: true, name: label }).click();
    await expect(ac.getByRole('button', { exact: true, name: label })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect.poll(() => states[climateId].state).toBe(value);
  }
  const activeTemperatureColor = await ac
    .getByTestId('climate-temperature')
    .evaluate((element) => getComputedStyle(element).color);
  // Off uses the HVAC service, updates before its response and rolls back on failure.
  holdServices = true;
  nextServiceStatus = 500;
  await ac.getByRole('button', { exact: true, name: 'Off' }).click();
  await expect(ac.getByRole('button', { exact: true, name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    ac.getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' }),
  ).toBeDisabled();
  await expect(
    ac.getByRole('button', { exact: true, name: 'Decrease Air Conditioner temperature' }),
  ).toBeDisabled();
  for (const label of ['Auto', 'Low', 'Mid', 'High']) {
    await expect(ac.getByRole('button', { name: label, exact: true })).toBeDisabled();
  }
  await expect(ac.getByRole('button', { exact: true, name: 'Cool' })).toBeEnabled();
  await expect(ac.getByTestId('climate-temperature')).toHaveText('24.0°C');
  await expect(ac.getByTestId('climate-temperature')).toHaveCSS(
    'color',
    await ac
      .getByText('Fan', { exact: true })
      .evaluate((element) => getComputedStyle(element).color),
  );
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: join(output, 'ac-off.png'),
  });
  await expect.poll(() => serviceWaiters.length).toBe(1);
  expect(commands.at(-1)).toEqual({
    data: { entity_id: climateId, hvac_mode: 'off' },
    domain: 'climate',
    service: 'set_hvac_mode',
  });
  holdServices = false;
  serviceWaiters.shift()();
  await expect(ac.getByRole('button', { exact: true, name: 'Dry' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('alert')).toHaveText('Couldn’t update Air Conditioner.');
  await expect(
    ac.getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' }),
  ).toBeEnabled();
  await expect(ac.getByRole('button', { exact: true, name: 'Mid' })).toBeEnabled();
  await expect(ac.getByTestId('climate-temperature')).toHaveCSS('color', activeTemperatureColor);
  nextServiceStatus = 500;
  await ac
    .getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' })
    .click();
  await expect(ac.getByTestId('climate-temperature')).toHaveText('25.0°C');
  await expect(ac.getByTestId('climate-temperature')).toHaveText('24.0°C');
  await expect(page.getByRole('alert')).toHaveText('Couldn’t update Air Conditioner.');
  await expect(
    ac.getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' }),
  ).toBeEnabled();
  states[climateId].attributes.temperature = 32;
  await refreshPage();
  await expect(
    ac.getByRole('button', { exact: true, name: 'Increase Air Conditioner temperature' }),
  ).toBeDisabled();
  states[climateId].attributes.temperature = 16;
  states[climateId].attributes.hvac_modes = ['heat'];
  await refreshPage();
  await expect(
    ac.getByRole('button', { exact: true, name: 'Decrease Air Conditioner temperature' }),
  ).toBeDisabled();
  await expect(ac.getByRole('button', { exact: true, name: 'Cool' })).toBeDisabled();
  states[climateId].attributes.temperature = 24;
  states[climateId].attributes.hvac_modes = ['off', 'heat', 'cool', 'dry'];
  await refreshPage();
  await expect(ac.getByRole('button', { exact: true, name: 'Cool' })).toBeEnabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // UI remains interactive while a real HTTP service request is held open.
  const beforeRapid = commands.length;
  holdServices = true;
  await outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }).click();
  await expect(outlet.getByTestId('device-status')).toHaveText('On');
  await expect(
    outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }),
  ).toBeEnabled();
  await expect.poll(() => serviceWaiters.length).toBe(1);
  await outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }).click();
  await expect(outlet.getByTestId('device-status')).toHaveText('Off');
  expect(commands.length - beforeRapid).toBe(1);
  holdServices = false;
  serviceWaiters.shift()();
  await expect.poll(() => commands.length - beforeRapid).toBe(2);
  await expect.poll(() => states[outletId].state).toBe('off');
  await expect(outlet.getByTestId('device-status')).toHaveText('Off');
  await outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }).click();
  await expect.poll(() => commands.at(-1)?.service).toBe('turn_on');
  await expect(outlet.getByTestId('device-status')).toHaveText('On');
  expect(commands.at(-1)).toEqual({
    data: { entity_id: outletId },
    domain: 'switch',
    service: 'turn_on',
  });
  await light.getByRole('button', { exact: true, name: 'Salon Dodatkowe power' }).click();
  await expect.poll(() => commands.at(-1)?.service).toBe('turn_off');
  await expect(light.getByTestId('device-status')).toHaveText('Off');
  expect(commands.at(-1).service).toBe('turn_off');
  await page.getByRole('button', { exact: true, name: 'Adjust Salon Dodatkowe' }).click();
  await expect(page.getByRole('button', { exact: true, name: 'Close settings' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('slider', { exact: true, name: 'Brightness' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { exact: true, name: 'Close settings' })).toBeFocused();
  const beforeDimming = commands.length;
  await dragBrightness(page, [20, 40, 67]);
  await expect(page.locator('#brightness-value')).toHaveText('67%');
  await expect(
    page.getByRole('dialog').getByRole('status', { name: 'Accessory connection' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('dialog').getByRole('button', { exact: true, name: 'Salon Dodatkowe power' }),
  ).toBeEnabled();
  await expect.poll(() => commands.length - beforeDimming).toBe(1);
  expect(commands.length - beforeDimming).toBe(1);
  expect(commands.at(-1).data.brightness_pct).toBe(67);
  await expect(page.locator('#custom-color')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { exact: true, name: 'Adjust Salon Dodatkowe' }),
  ).toBeFocused();

  // A physical or other-client change appears on the next automatic polling cycle.
  states[outletId].state = 'off';
  await expect(outlet.getByTestId('device-status')).toHaveText('Off', { timeout: 8000 });
  states[lightId].attributes.supported_color_modes = ['rgb'];
  states[lightId].attributes.rgb_color = [255, 179, 63];
  await refreshPage();
  await page.getByRole('button', { exact: true, name: 'Adjust Salon Dodatkowe' }).click();
  await expect(page.locator('#custom-color')).toBeVisible();
  await page.getByRole('button', { exact: true, name: 'Coral' }).click();
  await expect.poll(() => commands.at(-1)?.data.rgb_color).toEqual([255, 124, 121]);
  await expect(
    page.getByRole('dialog').getByText(/Sending.*Home Assistant|Connected to Home Assistant/),
  ).toHaveCount(0);
  holdServices = true;
  nextServiceStatus = 500;
  await dragBrightness(page, [40, 12]);
  await expect(page.locator('#brightness-value')).toHaveText('12%');
  await expect(
    page.getByRole('dialog').getByRole('button', { exact: true, name: 'Salon Dodatkowe power' }),
  ).toBeEnabled();
  await expect.poll(() => serviceWaiters.length).toBe(1);
  holdServices = false;
  serviceWaiters.shift()();
  await expect(page.locator('#brightness-value')).toHaveText('67%');
  await expect(page.getByRole('alert')).toHaveText('Couldn’t update Salon Dodatkowe.');
  await expect(page.getByRole('slider', { exact: true, name: 'Brightness' })).toBeEnabled();
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: join(output, 'optimistic-error-toast.png'),
  });
  await page.keyboard.press('Escape');

  responseStatus = 401;
  await refreshPage();
  await expectConnection('not paired or authorized');
  await expect(
    light.getByRole('button', { exact: true, name: 'Salon Dodatkowe power' }),
  ).toBeDisabled();
  responseStatus = 200;
  await refreshPage();
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  malformed = true;
  await refreshPage();
  await expectConnection('invalid JSON');
  malformed = false;
  states[outletId].state = 'unavailable';
  await refreshPage();
  await expect(outlet.getByTestId('device-status')).toHaveText('Unavailable');
  await expect(
    outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }),
  ).toBeDisabled();
  states[outletId].state = 'off';
  await refreshPage();
  await expect(outlet.getByTestId('device-status')).toHaveText('Off');

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  const cached = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const requests = await (
      await caches.open(cacheNames.find((name) => name.startsWith('everdash-')))
    ).keys();
    return requests.map((request) => request.url);
  });
  expect(cached.some((url) => url.includes('legacy'))).toBe(true);
  expect(cached.some((url) => url.includes('/api/'))).toBe(false);
  await context.setOffline(true);
  await expectConnection('offline');
  await expect(page.getByTestId('energy-usage')).toHaveText('—');
  await expect(ac.getByRole('button', { exact: true, name: 'Cool' })).toBeDisabled();
  await expect(ac.getByTestId('climate-temperature')).toHaveText('—');
  await openSettings();
  await expect(page.getByRole('button', { exact: true, name: 'Hard reload app' })).toBeDisabled();
  await closeSettings();

  await expect(
    outlet.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }),
  ).toBeDisabled();
  const beforeOffline = commands.length;
  await page.reload();
  await expect(page.locator('[data-device]')).toHaveCount(8);
  await expectConnection('offline');
  expect(commands.length).toBe(beforeOffline);
  await context.setOffline(false);
  await expectConnection('Connected to Home Assistant');
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  const beforeReload = commands.length;
  const savedPreferences = await page.evaluate(() =>
    localStorage.getItem('my-home:preferences:v1'),
  );
  await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((value) => value.startsWith('everdash-'));
    await (await caches.open(name)).put('/stale-test-marker', new Response('old'));
    await (await caches.open('unrelated-app-cache')).put('/keep', new Response('keep'));
  });
  await openSettings();
  appUnavailable = true;
  await page.getByRole('button', { exact: true, name: 'Hard reload app' }).click();
  await expect(page.getByRole('alert')).toContainText('Cannot download the latest app');
  expect(await page.evaluate(() => caches.match('/stale-test-marker').then(Boolean))).toBe(true);
  appUnavailable = false;
  await page.getByRole('button', { exact: true, name: 'Hard reload app' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-hard-reload-proof', 'fresh');
  await expect(page).toHaveURL(appUrl);
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  expect(await page.evaluate(() => localStorage.getItem('my-home:preferences:v1'))).toBe(
    savedPreferences,
  );
  await page.evaluate(() => navigator.serviceWorker.ready);
  expect(await page.evaluate(() => caches.match('/stale-test-marker').then(Boolean))).toBe(false);
  expect(await page.evaluate(() => caches.match('/keep').then(Boolean))).toBe(true);
  expect(commands.length).toBe(beforeReload);
  await openSettings();
  await page.screenshot({
    animations: 'disabled',
    fullPage: true,
    path: join(output, 'settings-hard-reload.png'),
  });
  await closeSettings();
  // The normalized URL must still support offline reload after a hard reload.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await context.setOffline(false);
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  for (const [width, height, label] of [
    [1024, 768, 'ipad-landscape'],
    [768, 1024, 'ipad-portrait'],
    [375, 812, 'phone'],
    [320, 568, 'small-phone'],
  ]) {
    await resize(page, { height, width });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({
      animations: 'disabled',
      fullPage: true,
      path: join(output, label + '.png'),
    });
  }
  await openSettings();
  await page.getByRole('button', { exact: true, name: 'Dark' }).click();
  await closeSettings();
  for (const [width, height, label] of [
    [1024, 768, 'dark-ipad'],
    [375, 812, 'dark-phone'],
  ]) {
    await resize(page, { height, width });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({
      animations: 'disabled',
      fullPage: true,
      path: join(output, label + '.png'),
    });
  }
  // A shared entity keeps its value across views; widgets follow the configured order.
  await page.getByRole('button', { exact: true, name: 'First floor, choose dashboard' }).click();
  await page.getByRole('button', { exact: true, name: 'Meter room' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meter room');
  await expect(
    page.getByRole('button', { exact: true, name: 'Adjust Reading lamp' }),
  ).toBeVisible();
  await expect(page.locator(`[data-device="${lightId}"]`).getByTestId('device-status')).toHaveText(
    '67%',
  );
  await expect(page.locator('[data-sensor="sensor.fixture_living_temp"]')).toContainText('22.5');
  expect(
    await page
      .locator('main [data-device], main [data-card-entity]')
      .evaluateAll((elements) =>
        elements.map((element) => element.dataset.device || element.dataset.cardEntity),
      ),
  ).toEqual(['weather.dom', lightId, 'sensor.pstryk_current_buy_price', 'weather.dom']);
  expect(
    await page.locator('[id]').evaluateAll((elements) => {
      const ids = elements.map((element) => element.id);
      return ids.length === new Set(ids).size;
    }),
  ).toBe(true);
  await page.getByRole('button', { exact: true, name: 'Adjust Reading lamp' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { exact: true, name: 'Reading lamp' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meter room');
  await page.getByRole('button', { exact: true, name: 'Meter room, choose dashboard' }).click();
  await page.getByRole('button', { exact: true, name: 'Sensors' }).click();
  await expect(page.locator('[data-device], [data-card-entity]')).toHaveCount(0);
  await expect(page.locator('[data-sensor="sensor.fixture_living_temp"]')).toContainText('22.5');
  await page.getByRole('button', { exact: true, name: 'Sensors, choose dashboard' }).click();
  await page.getByRole('button', { exact: true, name: 'First floor' }).click();
  await expect(page.locator('[data-device]')).toHaveCount(8);
  await context.close();

  // Entirely read-only apps must connect without a successful accessory read.
  const sensorContext = await browser.newContext();
  await routeHaApi(sensorContext);
  const sensorPage = await sensorContext.newPage();
  sensorPage.on('pageerror', (error) => errors.push(error.message));
  await sensorPage.goto(`${appUrl}?sensors-only=1`);
  await expect(sensorPage.locator('[data-sensor="sensor.fixture_living_temp"]')).toContainText(
    '22.5',
  );
  await expect(sensorPage.locator('[data-device]')).toHaveCount(0);
  await openSettings(sensorPage);
  await expect(sensorPage.getByLabel('Home Assistant connection', { exact: true })).toHaveText(
    'Connected to Home Assistant',
  );
  await sensorContext.close();

  // One grid per area: a quarter is as wide as an accessory tile (four, three, two per row) and
  // becomes a half when tiles are two to a row; widgets and tiles may share a row.
  const widthContext = await browser.newContext();
  await routeHaApi(widthContext);
  const widthPage = await widthContext.newPage();
  widthPage.on('pageerror', (error) => errors.push(error.message));
  await widthPage.goto(`${appUrl}?widths-only=1`);
  await expect(widthPage.getByRole('heading', { name: 'Full row' })).toBeVisible();
  const widgetBoxes = async () =>
    widthPage.evaluate(() =>
      Array.from(document.querySelectorAll('main [data-card="clock"]')).map((element) => {
        const box = element.getBoundingClientRect();

        return { y: Math.round(box.y), w: box.width, x: box.x };
      }),
    );
  const tileBoxes = async () =>
    widthPage.evaluate(() =>
      Array.from(document.querySelectorAll('main [data-value-card="tile"]')).map((element) => {
        const cell = element.closest('[style*="grid-column"]') ?? element;
        const box = cell.getBoundingClientRect();

        return { y: Math.round(box.y), w: box.width, x: box.x };
      }),
    );
  const widthShots = process.env.EVERDASH_SMOKE_SHOTS ?? output;
  for (const [width, height, label, quarters, tilesPerRow] of [
    [1024, 768, 'tablet-1024', 'quarter', 4],
    [768, 1024, 'tablet-768', 'quarter', 3],
    [375, 812, 'tablet-375', 'full', 2],
  ]) {
    await resize(widthPage, { height, width });
    await expect.poll(async () => (await widgetBoxes()).length).toBe(6);
    const [one, two, three, halfOne, halfTwo, full] = await widgetBoxes();
    const row = full.w;

    if (quarters === 'quarter') {
      // Three quarters on one row, each as wide as a tile of the row, and halves two to a row.
      assert.ok(one.y === two.y && two.y === three.y, `${label}: quarters share a row`);
      assert.ok(
        Math.abs(one.w * tilesPerRow + 16 * (tilesPerRow - 1) - row) <= 2,
        `${label}: a quarter is as wide as an accessory tile, not a half`,
      );
      assert.ok(halfOne.y === halfTwo.y, `${label}: halves share a row`);
      assert.ok(Math.abs(halfOne.w * 2 + 16 - row) <= 2, `${label}: a half is a half`);
      assert.ok(one.w >= 185, `${label}: a quarter is at least 185px wide`);
    } else {
      assert.ok(
        Math.abs(one.w - row) <= 2,
        `${label}: a narrow container gives every card the row`,
      );
      assert.ok(two.y > one.y && three.y > two.y, `${label}: cards stack`);
    }

    // Tiles span three, four or six of the twelve columns: four, three or two per row.
    const tiles = await tileBoxes();
    assert.equal(tiles.length, 4);
    const firstRow = tiles.filter((tile) => tile.y === tiles[0].y).length;
    assert.equal(firstRow, tilesPerRow, `${label}: ${tilesPerRow} tiles per row`);
    assert.equal(
      await widthPage.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await widthPage.screenshot({
      animations: 'disabled',
      fullPage: true,
      path: join(widthShots, `${label}.png`),
    });
  }
  await widthContext.close();

  const registerContext = await browser.newContext();
  await routeHaApi(registerContext);
  let deviceRegistered = false;
  let dropSessionOnce = true;
  await registerContext.route('**/api/access', (route) =>
    route.fulfill({ json: { status: deviceRegistered ? 'registered' : 'registration_required' } }),
  );
  await registerContext.route('**/api/access/register', (route) => {
    const payload = route.request().postDataJSON();
    assert.equal(payload.code, '482910');
    assert.ok(typeof payload.deviceType === 'string' && payload.deviceType.length > 0);
    assert.ok(typeof payload.screenSize === 'string' && payload.screenSize.length > 0);
    if (dropSessionOnce) {
      dropSessionOnce = false;
      return route.fulfill({ json: { ok: true, deviceId: 'dev1' } });
    }
    deviceRegistered = true;
    return route.fulfill({ json: { ok: true, deviceId: 'dev1' } });
  });
  const registerPage = await registerContext.newPage();
  registerPage.on('pageerror', (error) => errors.push(error.message));
  await registerPage.goto(appUrl);
  await expect(registerPage.getByRole('heading', { name: 'Register device' })).toBeVisible();
  const gateReload = registerPage.getByRole('button', { name: 'Hard reload app', exact: true });
  await expect(gateReload).toBeVisible();
  const reloadBox = await gateReload.boundingBox();
  const viewportSize = registerPage.viewportSize();
  assert.ok(reloadBox.x > viewportSize.width / 2);
  assert.ok(reloadBox.y > viewportSize.height / 2);
  expect(
    await gateReload.evaluate((element) => Number(getComputedStyle(element).opacity)),
  ).toBeLessThan(0.7);
  await registerPage.screenshot({ path: join(output, 'register-gate.png') });
  appUnavailable = true;
  await gateReload.click();
  await expect(registerPage.getByText('Cannot download the latest app')).toBeVisible();
  appUnavailable = false;
  await gateReload.click();
  await expect(registerPage.locator('html')).toHaveAttribute('data-hard-reload-proof', 'fresh');
  await expect(registerPage).toHaveURL(appUrl);
  await expect(registerPage.getByRole('heading', { name: 'Register device' })).toBeVisible();
  await expect(registerPage.getByRole('button', { name: '4', exact: true })).toHaveCSS(
    'touch-action',
    'manipulation',
  );
  for (const digit of ['4', '8', '2', '9', '1', '0']) {
    await registerPage.getByRole('button', { name: digit, exact: true }).click();
  }
  await expect(registerPage.getByRole('img', { name: '6 of 6 digits entered' })).toHaveText(
    '482910',
  );
  // Typing the 6th digit must not auto-submit before pressing Register.
  assert.equal(deviceRegistered, false);
  await registerPage.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(
    registerPage.getByText('Device registered, but this browser did not keep the session.'),
  ).toBeVisible();
  for (const digit of ['4', '8', '2', '9', '1', '0']) {
    await registerPage.getByRole('button', { name: digit, exact: true }).click();
  }
  await registerPage.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(registerPage.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await registerPage.reload();
  await expect(registerPage.getByRole('heading', { level: 1 })).toHaveText('First floor');
  await registerContext.close();

  const logoutContext = await browser.newContext();
  await routeHaApi(logoutContext);
  let logoutCompleted = false;
  let logoutRequests = 0;
  await logoutContext.route('**/api/bootstrap', async (route) => {
    if (logoutCompleted) {
      await route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED', mode: 'direct' } });
      return;
    }
    await route.fulfill({
      json: { mode: 'direct', configured: true, revision: 'logout-v1', config: dashboardDocument },
    });
  });
  await logoutContext.route('**/api/access/unregister', async (route) => {
    logoutRequests++;
    logoutCompleted = true;
    await route.fulfill({
      json: { ok: true },
      headers: {
        'set-cookie': 'everdash_tablet=; Path=/api; Max-Age=0; HttpOnly; SameSite=Strict',
      },
    });
  });
  await logoutContext.route('**/api/access', (route) =>
    route.fulfill({ json: { status: logoutCompleted ? 'registration_required' : 'registered' } }),
  );
  const logoutPage = await logoutContext.newPage();
  logoutPage.on('pageerror', (error) => errors.push(error.message));
  await logoutPage.goto(appUrl);
  await expect(logoutPage.getByRole('heading', { level: 1 })).toHaveText('First floor');
  const preferencesBeforeLogout = await logoutPage.evaluate(() =>
    localStorage.getItem('my-home:preferences:v1'),
  );
  await openSettings(logoutPage);
  await logoutPage.getByRole('button', { name: 'Unregister device', exact: true }).click();
  await expect(logoutPage.getByRole('heading', { name: 'Register device' })).toBeVisible();
  assert.equal(logoutRequests, 1);
  assert.equal(
    await logoutPage.evaluate(() => localStorage.getItem('everdash:offline-config:v1')),
    null,
  );
  assert.equal(
    await logoutPage.evaluate(() => localStorage.getItem('my-home:preferences:v1')),
    preferencesBeforeLogout,
  );
  await logoutContext.close();

  const liveContext = await browser.newContext();
  await routeHaApi(liveContext);
  let liveRevision = 'live-v1';
  let liveDocument = dashboardDocument;
  let liveBootstrapCalls = 0;
  await liveContext.route('**/api/bootstrap', async (route) => {
    liveBootstrapCalls++;
    await route.fulfill({
      json: { mode: 'direct', configured: true, revision: liveRevision, config: liveDocument },
    });
  });
  const livePage = await liveContext.newPage();
  livePage.on('pageerror', (error) => errors.push(error.message));
  await livePage.clock.install();
  await livePage.goto(appUrl);
  await expect(livePage.getByRole('heading', { level: 1 })).toHaveText('First floor');
  liveDocument = structuredClone(dashboardDocument);
  liveDocument.views[0].title = 'Updated live';
  liveRevision = 'live-v2';
  await livePage.bringToFront();
  await livePage.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => liveBootstrapCalls).toBeGreaterThan(1);
  await expect(livePage.getByRole('heading', { level: 1 })).toHaveText('Updated live');
  await liveContext.close();

  const extrasContext = await browser.newContext();
  await routeHaApi(extrasContext);
  const extrasPage = await extrasContext.newPage();
  extrasPage.on('pageerror', (error) => errors.push(error.message));
  await extrasPage.addInitScript(() => {
    localStorage.setItem(
      'my-home:preferences:v1',
      JSON.stringify({ appearance: 'light', language: 'en', page: 'fixture-extras' }),
    );
  });
  await extrasPage.goto(`${appUrl}?extras`);
  await expect(extrasPage.getByRole('heading', { level: 1 })).toHaveText('Extras');
  await expect(
    extrasPage.locator('[data-value-card="tile"] [data-testid="value-reading"]'),
  ).toHaveText('1,234.6watts');
  await expect(extrasPage.locator('[data-value-card="compact"]')).toContainText('1,234.57W');
  await expect(extrasPage.locator('[data-value-card="hero"]')).toContainText('1,234.57');
  const guest = extrasPage.getByRole('switch', { name: 'Guest mode power' });
  await expect(guest).toHaveAttribute('aria-checked', 'false');
  await guest.click();
  await expect(guest).toHaveAttribute('aria-checked', 'true');
  expect(
    commands.some((item) => item.domain === 'input_boolean' && item.service === 'turn_on'),
  ).toBe(true);
  const door = extrasPage.locator('[data-toggle-card="readonly"]');
  await expect(door).toContainText('Open');
  await expect(door).toHaveAttribute('aria-readonly', 'true');
  const scene = extrasPage.locator('[data-scene-card]');
  await expect(scene).toContainText('Tap to run');
  await scene.click();
  await expect(scene).toContainText('Done');
  expect(commands.some((item) => item.domain === 'scene' && item.service === 'turn_on')).toBe(true);
  await extrasContext.close();

  // Weather cards: every width and row count fills its height and keeps inside its card.
  const weatherContext = await browser.newContext({ viewport: { height: 1400, width: 1024 } });
  await routeHaApi(weatherContext);
  const weatherPage = await weatherContext.newPage();
  weatherPage.on('pageerror', (error) => errors.push(error.message));
  await weatherPage.addInitScript(() => {
    localStorage.setItem(
      'my-home:preferences:v1',
      JSON.stringify({ appearance: 'light', language: 'en', page: 'fixture-weather' }),
    );
  });
  await weatherPage.goto(`${appUrl}?weather`);
  await expect(weatherPage.getByRole('heading', { level: 1 })).toHaveText('Weather layouts');
  const weatherCard = (name) => weatherPage.getByRole('region', { exact: true, name });
  const cardHeight = async (name) => Math.round((await weatherCard(name).boundingBox()).height);
  // The card's own title stays the region's name but takes no room on the card.
  const titleWidth = async (name) =>
    (await weatherCard(name).getByRole('heading', { name }).boundingBox()).width;
  // Whether a part of the card lies inside the card's box.
  const insideCard = (name, selector) =>
    weatherCard(name).evaluate((card, inner) => {
      const box = card.getBoundingClientRect();
      const part = card.querySelector(inner).getBoundingClientRect();

      return (
        part.left >= box.left - 1 &&
        part.right <= box.right + 1 &&
        part.top >= box.top - 1 &&
        part.bottom <= box.bottom + 1
      );
    }, selector);
  const details = (name) => weatherCard(name).getByTestId('weather-details').locator('li');
  const spillsOut = (name) =>
    weatherCard(name).evaluate((card) => card.scrollHeight > card.clientHeight + 1);
  // Text that is wider than the box it sits in runs into its neighbour.
  const crowded = (name) =>
    weatherCard(name).evaluate((card) =>
      Array.from(
        card.querySelectorAll(
          'li strong, [data-testid="weather-temperature"], [data-testid="weather-range"]',
        ),
      ).some((part) => part.scrollWidth > part.clientWidth + 1),
    );
  const hours = (name) => weatherCard(name).locator('[data-forecast-hour]');

  expect(await cardHeight('Full two rows')).toBe(224);
  expect(await titleWidth('Full two rows')).toBeGreaterThan(1);
  await expect(weatherCard('Full two rows').getByTestId('weather-feels-like')).toBeVisible();
  await expect(weatherCard('Full two rows').getByTestId('weather-range')).toBeVisible();
  await expect(details('Full two rows')).toHaveCount(4);
  expect(await hours('Full two rows').count()).toBeGreaterThanOrEqual(36);

  expect(await cardHeight('Half two rows')).toBe(224);
  await expect(weatherCard('Half two rows').getByTestId('weather-temperature')).toBeVisible();
  await expect(details('Half two rows')).toHaveCount(4);
  await expect(hours('Half two rows')).toHaveCount(4);
  expect(await insideCard('Half two rows', '[data-forecast-hour]:last-of-type')).toBe(true);

  await expect(weatherCard('Daily half two rows').locator('[data-forecast-day]')).toHaveCount(4);

  expect(await titleWidth('Half two rows')).toBeGreaterThan(1);
  for (const name of [
    'Full two rows',
    'Half two rows',
    'Daily half two rows',
    'Quarter two rows',
  ]) {
    expect(await spillsOut(name), `${name} spills`).toBe(false);
  }
  expect(await titleWidth('Quarter two rows')).toBeGreaterThan(1);

  // A daily list keeps the low next to the high.
  const dailyList = weatherCard('Daily quarter two rows').locator('[data-forecast-day]');
  await expect(dailyList).toHaveCount(4);
  await expect(dailyList.first()).toContainText('17.0°C');
  await expect(dailyList.first()).toContainText('9.0°');
  expect(await cardHeight('Daily quarter two rows')).toBe(224);
  expect(await spillsOut('Daily quarter two rows')).toBe(false);

  expect(await cardHeight('Quarter two rows')).toBe(224);
  await expect(weatherCard('Quarter two rows').getByTestId('weather-temperature')).toBeVisible();
  await expect(weatherCard('Quarter two rows').getByTestId('weather-details')).toHaveCount(0);
  await expect(hours('Quarter two rows')).toHaveCount(4);
  expect(await insideCard('Quarter two rows', '[data-forecast-hour]:last-of-type')).toBe(true);

  // One row is as tall as an accessory tile and nothing in it spills out of the card.
  const oneRow = ['Full one row', 'Half one row', 'Daily half one row', 'Quarter one row'];
  const spills = (name) =>
    weatherCard(name).evaluate((card) => card.scrollHeight > card.clientHeight + 1);
  const textInside = async (name, text) => {
    const box = await weatherCard(name).boundingBox();
    const part = await weatherCard(name).getByText(text).boundingBox();

    return (
      part.x >= box.x - 1 &&
      part.x + part.width <= box.x + box.width + 1 &&
      part.y >= box.y - 1 &&
      part.y + part.height <= box.y + box.height + 1
    );
  };
  for (const name of oneRow) {
    expect(await cardHeight(name)).toBe(104);
    expect(await titleWidth(name)).toBeLessThanOrEqual(1);
    expect(await spills(name)).toBe(false);
    expect(await insideCard(name, '[data-testid="weather-temperature"]')).toBe(true);
  }
  await expect(details('Full one row')).toHaveCount(4);
  await expect(hours('Full one row')).toHaveCount(5);
  expect(await insideCard('Full one row', '[data-forecast-hour]:last-of-type')).toBe(true);
  await expect(hours('Half one row')).toHaveCount(3);
  expect(await insideCard('Half one row', '[data-forecast-hour]:last-of-type')).toBe(true);
  await expect(weatherCard('Daily half one row').locator('[data-forecast-day]')).toHaveCount(3);
  expect(await insideCard('Daily half one row', '[data-forecast-day]:last-of-type')).toBe(true);
  await expect(weatherCard('Quarter one row').getByTestId('weather-range')).toBeVisible();
  await expect(weatherCard('Quarter one row').getByTestId('weather-details')).toHaveCount(0);
  await expect(hours('Quarter one row')).toHaveCount(0);

  // Without a forecast the one-row cards say so inside the card.
  forecastStatus = 500;
  await weatherPage.reload();
  await expect(weatherCard('Half one row').getByText('Hourly forecast unavailable')).toBeVisible();
  expect(await textInside('Half one row', 'Hourly forecast unavailable')).toBe(true);
  expect(await textInside('Full one row', 'Hourly forecast unavailable')).toBe(true);
  for (const name of oneRow) {
    expect(await spills(name)).toBe(false);
  }
  forecastStatus = 200;
  await weatherPage.reload();
  await expect(hours('Half one row')).toHaveCount(3);

  // A quarter that no longer fits a column is drawn as the full row, still one row high.
  await resize(weatherPage, { height: 1400, width: 600 });
  await expect(hours('Quarter one row')).toHaveCount(5);
  await expect(details('Quarter one row')).toHaveCount(0);
  expect(await cardHeight('Quarter one row')).toBe(104);
  expect(await spills('Quarter one row')).toBe(false);

  // Nothing in a one-row card runs into its neighbour or out of the card at any width, with or
  // without a forecast; when no entry fits, none is shown.
  const assertOneRowFits = async () => {
    for (const name of oneRow) {
      expect(await crowded(name), `${name} text is crowded`).toBe(false);
      expect(await spills(name), `${name} spills`).toBe(false);
      expect(await insideCard(name, '[data-testid="weather-temperature"]')).toBe(true);
    }
  };
  for (const width of [640, 375, 320]) {
    await resize(weatherPage, { height: 1400, width });
    await assertOneRowFits();
  }
  forecastStatus = 500;
  await weatherPage.reload();
  await expect(weatherCard('Full one row').getByTestId('weather-temperature')).toBeVisible();
  await assertOneRowFits();
  for (const name of oneRow) {
    const message = weatherCard(name).getByText(/forecast unavailable/);

    if ((await message.count()) > 0) {
      expect(await textInside(name, /forecast unavailable/), `${name} message`).toBe(true);
    }
  }
  forecastStatus = 200;
  await weatherPage.reload();
  await weatherContext.close();

  const polishContext = await browser.newContext({ viewport: { height: 1400, width: 1024 } });
  await routeHaApi(polishContext);
  const polishPage = await polishContext.newPage();
  polishPage.on('pageerror', (error) => errors.push(error.message));
  await polishPage.addInitScript(() => {
    localStorage.setItem(
      'my-home:preferences:v1',
      JSON.stringify({ appearance: 'light', language: 'pl', page: 'fixture-weather' }),
    );
  });
  await polishPage.goto(`${appUrl}?weather`);
  for (const width of [1024, 768, 640]) {
    await resize(polishPage, { height: 1400, width });
    for (const name of ['Half one row', 'Quarter one row', 'Daily half one row']) {
      const card = polishPage.getByRole('region', { exact: true, name });
      await expect(card.getByTestId('weather-temperature')).toBeVisible();
      expect(
        await card.evaluate((element) =>
          Array.from(
            element.querySelectorAll(
              'li strong, [data-testid="weather-temperature"], [data-testid="weather-range"]',
            ),
          ).some((part) => part.scrollWidth > part.clientWidth + 1),
        ),
        `${name} in Polish at ${width}`,
      ).toBe(false);
    }
  }
  await polishContext.close();

  const blockedContext = await browser.newContext();
  await routeHaApi(blockedContext);
  await blockedContext.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  const blockedPage = await blockedContext.newPage();
  blockedPage.on('pageerror', (error) => errors.push(error.message));
  await blockedPage.goto(appUrl);
  await openSettings(blockedPage);
  await expect(blockedPage.getByRole('alert')).toContainText('Preferences could not be saved');
  await blockedPage.getByRole('button', { exact: true, name: 'Dark' }).click();
  await expect(blockedPage.locator('html')).toHaveAttribute('data-theme', 'dark');
  await blockedContext.close();

  const changingContext = await browser.newContext();
  await routeHaApi(changingContext);
  const changingPage = await changingContext.newPage();
  changingPage.on('pageerror', (error) => errors.push(error.message));
  await changingPage.clock.install();
  await changingPage.goto(appUrl);
  await changingPage
    .locator('[data-device="light.tv"]')
    .getByRole('button', { name: /^Adjust / })
    .click();
  const removedTv = states['light.tv'];
  delete states['light.tv'];
  await changingPage.clock.fastForward(300_001);
  await expect(
    changingPage.getByRole('dialog').getByRole('button', { name: / power$/ }),
  ).toBeDisabled();
  await changingPage.keyboard.press('Escape');
  await expect(
    changingPage.locator('[data-device="light.tv"]').getByTestId('device-status'),
  ).toHaveText('Entity not found');
  await expect(changingPage.locator('main')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(
    changingPage.getByRole('button', { exact: true, name: 'First floor, choose dashboard' }),
  ).toBeVisible();
  states['light.tv'] = removedTv;
  await changingContext.close();

  const legacyContext = await browser.newContext();
  await routeHaApi(legacyContext);
  const legacyPage = await legacyContext.newPage();
  legacyPage.on('pageerror', (error) => errors.push(error.message));
  // Serve the ES5-only HTML over real HTTP: route.fulfill gives Chrome an unknown
  // address space and its Local Network Access policy then blocks cross-origin XHR.
  await legacyPage.goto(`${appUrl}?legacy=1`);
  await expect(
    legacyPage.locator(`[data-device="${lightId}"]`).getByTestId('device-status'),
  ).toHaveText('67%');
  await legacyPage.getByRole('button', { exact: true, name: 'Kinkiety Taras power' }).click();
  await expect(
    legacyPage.locator(`[data-device="${outletId}"]`).getByTestId('device-status'),
  ).toHaveText('On');
  const legacyAc = legacyPage.getByRole('region', { exact: true, name: 'Air Conditioner' });
  await expect(legacyAc.getByTestId('climate-temperature')).toHaveText('24.0°C');
  await legacyAc.getByRole('button', { exact: true, name: 'Low' }).click();
  await expect.poll(() => states[climateId].attributes.fan_mode).toBe('low');
  await legacyPage.evaluate(() => navigator.serviceWorker.ready);
  await legacyPage.getByRole('button', { exact: true, name: 'Settings' }).click();
  await legacyPage.getByText('Installation & about', { exact: true }).click();
  await expect(
    legacyPage.getByRole('heading', { exact: true, name: 'Add to your Home Screen' }),
  ).toBeVisible();
  await legacyPage.getByRole('button', { exact: true, name: 'Close settings' }).focus();
  await legacyPage.keyboard.press('Shift+Tab');
  await expect(legacyPage.getByText('Connected data sources', { exact: true })).toBeFocused();
  await legacyPage.keyboard.press('Tab');
  await expect(
    legacyPage.getByRole('button', { exact: true, name: 'Close settings' }),
  ).toBeFocused();
  await legacyPage.keyboard.press('Escape');
  await expect(legacyPage.getByRole('button', { exact: true, name: 'Settings' })).toBeFocused();
  await legacyContext.close();
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify(
      {
        appUrl,
        checks: [
          'same-origin dashboard API with isolated Home Assistant fixture',
          'device registration gate persists across reload',
          'JSON editor import, previous recovery, validation, stale-save preservation and publish',
          'open tablet dashboards refresh published configuration revisions',
          'Unregister clears the tablet session and offline snapshot',
          'management mode does not register a service worker',
          'configured views, persistent selection, shared control state, badge-only view and widget order',
          'saved appearance and HA sunrise/sunset',
          'one-decimal temperatures, five real forecast hours, forecast failure recovery, daily-low price status and compact usage',
          'header chart toggle, selectable price bars, top-of-card readout and keyboard controls',
          'persistent Polish/English interface, localized numbers and static configured titles',
          '44px circular AC buttons with centered SVG symbols',
          'optimistic power, brightness and color; controls remain interactive during requests',
          'failed action rolls back and shows a small toast',
          'light/switch services',
          'inline AC setpoint, limits, modes, fan mapping, optimistic requests, rollback and offline controls',
          'debounced brightness',
          'capability-based colors',
          'automatic polling',
          'authentication and malformed-response recovery',
          'unavailable controls',
          'focus trap/restoration',
          'offline shell with disabled controls',
          'reconnect',
          'API excluded from precache',
          'hard reload, failed download recovery, scoped cache reset and saved preferences',
          'visible focus and controlled text selection',
          'pinch gestures blocked; single-touch input remains enabled',
          'forced legacy boot and controls',
          'responsive overflow',
          'no page errors',
        ],
        result: 'PASS',
        screenshots: output,
        viewports: [1024, 768, 375, 320],
      },
      null,
      2,
    ),
  );
} finally {
  holdServices = false;
  serviceWaiters.splice(0).forEach((resolve) => resolve());
  if (browser) {
    await browser.close();
  }
  await Promise.all([
    new Promise((resolve) => server.close(resolve)),
    new Promise((resolve) => api.close(resolve)),
  ]);
  await rm(temporary, { force: true, recursive: true });
}
