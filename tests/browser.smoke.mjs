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
  humidity: 72,
  supported_features: 3,
  temperature: 14.2,
  temperature_unit: '°C',
  wind_speed: 8,
  wind_speed_unit: 'km/h',
});
states['sun.sun'] = observed('sun.sun', 'Sun', 'above_horizon');
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
const forecast = Array.from({ length: 8 }, (_, index) => ({
  condition: index < 3 ? 'sunny' : 'partlycloudy',
  datetime: new Date(hour + index * 3600000).toISOString(),
  temperature: 15 + index / 10,
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
      assert.deepEqual(JSON.parse(body), { entity_id: 'weather.dom', type: 'hourly' });
      assert.ok(url.searchParams.has('return_response'));
      forecastRequests++;
      response
        .writeHead(forecastStatus)
        .end(JSON.stringify({ service_response: { 'weather.dom': { forecast } } }));
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
    const match = url.pathname.match(/^\/api\/services\/(light|switch)\/(turn_on|turn_off)$/);
    if (request.method === 'POST' && match) {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      const data = JSON.parse(body);
      assert.ok([lightId, outletId].includes(data.entity_id));
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
            { type: 'weather', entity: 'weather.dom', name: 'Outdoor weather' },
          ],
        },
        {
          id: 'fixture-sensors',
          title: 'Sensors',
          badges: [{ type: 'temperature', entity: 'sensor.fixture_living_temp' }],
        },
      ];
      const config = {
        ...dashboardDocument,
        views: url.searchParams.has('sensors-only')
          ? fixtureViews.filter((view) => view.id === 'fixture-sensors')
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
      const response = await route.fetch({
        url: `${apiUrl}${upstreamPath}${query}`,
        headers: { ...route.request().headers(), authorization: `Bearer ${token}` },
      });
      await route.fulfill({ response });
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
  await page.getByRole('button', { exact: true, name: 'Settings' }).focus();
  expect(
    await page
      .getByRole('button', { exact: true, name: 'Settings' })
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe('none');
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
  await expect(weather.locator('[data-forecast-hour]')).toHaveCount(5);
  await expect(weather.locator('[data-forecast-hour]').first()).toContainText('15.1°C');
  expect(forecastRequests).toBeGreaterThan(0);
  forecastStatus = 500;
  await refreshPage();
  await expect(weather.getByText('Hourly forecast unavailable')).toBeVisible();
  await expect(page.getByTestId('weather-temperature')).toHaveText('14.2°C');
  forecastStatus = 200;
  await refreshPage();
  await expect(weather.locator('[data-forecast-hour]')).toHaveCount(5);

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
    await page.setViewportSize({ height: 768, width });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({ fullPage: true, path: join(output, `polish-graph-${width}.png`) });
  }
  await page.setViewportSize({ height: 768, width: 1024 });
  await page.getByRole('button', { exact: true, name: 'First floor, wybierz pulpit' }).click();
  await page.getByRole('button', { exact: true, name: 'Meter room' }).click();
  await expect(page.getByRole('heading', { exact: true, name: 'Room weather' })).toBeVisible();
  await expect(page.getByRole('heading', { exact: true, name: 'Outdoor weather' })).toBeVisible();
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
  await page.locator('#brightness').evaluate((input) => {
    for (const value of ['20', '40', '67']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
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
  await page.locator('#brightness').evaluate((input) => {
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
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
      await caches.open(cacheNames.find((name) => name.startsWith('my-home-')))
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
  await expect(light.getByTestId('device-status')).toHaveText('67%');
  const beforeReload = commands.length;
  const savedPreferences = await page.evaluate(() =>
    localStorage.getItem('my-home:preferences:v1'),
  );
  await page.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find((value) => value.startsWith('my-home-'));
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
    await page.setViewportSize({ height, width });
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
    await page.setViewportSize({ height, width });
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

  const pairingContext = await browser.newContext();
  await routeHaApi(pairingContext);
  let pairingRequests = 0;
  let pairingPolls = 0;
  await pairingContext.route('**/api/bootstrap', async (route) => {
    await route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED', mode: 'direct' } });
  });
  await pairingContext.route('**/api/pairings', async (route) => {
    pairingRequests++;
    await route.fulfill({
      json: {
        requestId: 'fixture-request',
        code: 'ABCD2345',
        pollSecret: 'fixture-poll-secret',
        expiresAt: Date.now() + 300_000,
      },
    });
  });
  await pairingContext.route('**/api/pairings/status', async (route) => {
    pairingPolls++;
    await route.fulfill({ json: { status: 'pending' } });
  });
  const pairingPage = await pairingContext.newPage();
  pairingPage.on('pageerror', (error) => errors.push(error.message));
  await pairingPage.goto(appUrl);
  await expect(
    pairingPage.getByRole('heading', { name: 'Give this tablet a new purpose.' }),
  ).toBeVisible();
  await expect(pairingPage.getByRole('button', { name: 'Start pairing' })).toBeVisible();
  assert.equal(pairingRequests, 0, 'opening an unpaired tablet must not create a pairing request');
  await pairingPage.getByRole('button', { name: 'Start pairing' }).click();
  await expect(pairingPage.getByLabel('Pairing code')).toHaveText('ABCD2345');
  await expect.poll(() => pairingPolls, { timeout: 5000 }).toBeGreaterThan(0);
  assert.equal(pairingRequests, 1, 'pairing starts only after an explicit button press');
  await pairingContext.close();

  const editorContext = await browser.newContext();
  await routeHaApi(editorContext);
  let editorRevision = 'editor-v1';
  let editorDocument = dashboardDocument;
  let publishedDocuments = 0;
  let conflictOnce = true;
  await editorContext.route('**/api/bootstrap', async (route) => {
    await route.fulfill({
      json: {
        mode: 'management',
        configured: true,
        revision: editorRevision,
        config: editorDocument,
      },
    });
  });
  await editorContext.route('**/api/manage/devices', async (route) => route.fulfill({ json: [] }));
  await editorContext.route('**/api/manage/config/validate', async (route) => {
    await route.fulfill({ json: { config: route.request().postDataJSON().config } });
  });
  await editorContext.route('**/api/manage/config/previous', async (route) => {
    await route.fulfill({ json: { config: dashboardDocument } });
  });
  await editorContext.route('**/api/manage/config', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: { revision: editorRevision, config: editorDocument, previousAvailable: true },
      });
      return;
    }
    const body = route.request().postDataJSON();
    assert.equal(body.baseRevision, editorRevision);
    if (conflictOnce) {
      conflictOnce = false;
      await route.fulfill({
        status: 409,
        json: { code: 'CONFIG_CONFLICT', message: 'The dashboard changed since it was loaded.' },
      });
      return;
    }
    editorDocument = body.config;
    editorRevision = 'editor-v2';
    publishedDocuments++;
    await route.fulfill({ json: { revision: editorRevision, config: editorDocument } });
  });
  const editorPage = await editorContext.newPage();
  editorPage.on('pageerror', (error) => errors.push(error.message));
  await editorPage.goto(appUrl);
  await openSettings(editorPage);
  const editor = editorPage.getByLabel('Dashboard JSON', { exact: true });
  await expect(editor).toBeVisible();
  await editorPage.getByRole('button', { name: 'Restore previous', exact: true }).click();
  await expect(
    editorPage.getByText('Previous dashboard loaded as a draft. Save to apply it.', {
      exact: true,
    }),
  ).toBeVisible();
  const imported = structuredClone(dashboardDocument);
  imported.views[0].title = 'Imported draft';
  await editorPage.locator('input[type="file"]').setInputFiles({
    name: 'dashboard.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(
    editorPage.getByText('Imported as a draft. Validate before saving.', { exact: true }),
  ).toBeVisible();
  const draft = structuredClone(dashboardDocument);
  draft.views[0].title = 'Published rooms';
  await editor.fill(JSON.stringify(draft, null, 2));
  await editorPage.getByRole('button', { name: 'Validate', exact: true }).click();
  await expect(editorPage.getByText('Dashboard JSON is valid.', { exact: true })).toBeVisible();
  assert.equal(publishedDocuments, 0, 'validation must never publish a draft');
  await editorPage.getByRole('button', { name: 'Save and apply', exact: true }).click();
  await expect(
    editorPage.getByText('Another editor saved a newer dashboard. Your draft is unchanged.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(await editor.inputValue()).toContain('Published rooms');
  assert.equal(publishedDocuments, 0, 'a stale save must preserve the draft without publishing');
  await editorPage.getByRole('button', { name: 'Save and apply', exact: true }).click();
  await expect(editorPage.getByText('Dashboard saved and applied.', { exact: true })).toBeVisible();
  assert.equal(publishedDocuments, 1);
  assert.equal(editorRevision, 'editor-v2');
  await editorContext.close();

  const liveContext = await browser.newContext();
  await routeHaApi(liveContext);
  let liveRevision = 'live-v1';
  let liveDocument = dashboardDocument;
  await liveContext.route('**/api/bootstrap', async (route) => {
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
  await livePage.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(livePage.getByRole('heading', { level: 1 })).toHaveText('Updated live');
  await liveContext.close();

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
          'explicit tablet pairing with no automatic request for an unpaired device',
          'JSON editor import, previous recovery, validation, stale-save preservation and publish',
          'open tablet dashboards refresh published configuration revisions',
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
          'no focus outlines or text selection',
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
