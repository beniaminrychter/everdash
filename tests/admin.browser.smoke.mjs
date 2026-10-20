import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const roots = { admin: resolve('dist-admin'), preview: resolve('dist-preview') };
const config = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
};
let savedConfig = structuredClone(config);
let saveCount = 0;
let previewCount = 0;
const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const sendJson = (status, value) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  try {
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204).end();
      return;
    }
    if (url.pathname === '/api/manage/config' && request.method === 'GET') {
      sendJson(200, {
        revision: 'revision-1',
        config: savedConfig,
        previousAvailable: false,
        configured: true,
      });
      return;
    }
    if (url.pathname === '/api/manage/config' && request.method === 'PUT') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      savedConfig = JSON.parse(body).config;
      saveCount += 1;
      sendJson(200, { revision: `revision-${saveCount + 1}`, config: savedConfig });
      return;
    }
    if (url.pathname === '/api/manage/entities') {
      const domain = url.searchParams.get('domain');
      const entities = [
        {
          entityId: 'climate.living_room',
          name: 'Living Room Climate',
          domain: 'climate',
          state: 'Available',
          available: true,
          unit: '°C',
          deviceClass: null,
          icon: null,
        },
        {
          entityId: 'light.kitchen',
          name: 'Kitchen Lights',
          domain: 'light',
          state: 'Available',
          available: true,
          unit: null,
          deviceClass: null,
          icon: null,
        },
        {
          entityId: 'sensor.lounge_temperature',
          name: 'Lounge Temperature',
          domain: 'sensor',
          state: 'Available',
          available: true,
          unit: '°C',
          deviceClass: 'temperature',
          icon: null,
        },
      ].filter((entity) => !domain || entity.domain === domain);
      sendJson(200, { entities, total: entities.length });
      return;
    }
    if (url.pathname === '/api/manage/access') {
      sendJson(200, {
        hostName: 'homeassistant',
        addresses: ['192.168.1.20'],
        httpPort: 8095,
        httpsPort: null,
        errors: [],
      });
      return;
    }
    if (url.pathname === '/api/manage/devices') {
      sendJson(200, []);
      return;
    }
    if (url.pathname === '/api/manage/preview' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) {
        body += chunk;
      }
      previewCount += 1;
      sendJson(200, { config: JSON.parse(body).config, states: [] });
      return;
    }
    const isPreview = url.pathname === '/preview' || url.pathname.startsWith('/preview/');
    const root = isPreview ? roots.preview : roots.admin;
    const relative = isPreview ? url.pathname.replace(/^\/preview\/?/, '') : url.pathname.slice(1);
    const path = resolve(root, relative || 'index.html');
    if (path !== root && !path.startsWith(`${root}${sep}`)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(path);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
      ...(isPreview ? { 'Access-Control-Allow-Origin': '*' } : {}),
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const browser = await chromium.launch({
  channel: process.env.MY_HOME_BROWSER_CHANNEL || 'chrome',
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window.crypto, 'randomUUID', { configurable: true, value: undefined });
  });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  assert.equal(await page.evaluate(() => typeof window.crypto.randomUUID), 'undefined');
  await expect(page.getByRole('heading', { name: 'Dashboard builder' })).toBeVisible();
  await expect(page.getByText('http://homeassistant.local:8095/').first()).toBeVisible();

  await page.getByRole('button', { name: 'Add view' }).click();
  const viewName = page.getByLabel('View name');
  await viewName.fill('Guest room');
  await expect(page.getByRole('heading', { name: 'Guest room' })).toBeVisible();
  await page.getByLabel('New card type').selectOption('climate');
  await page.getByRole('button', { name: 'Add card' }).click();
  const entityPicker = page.getByRole('combobox', { name: 'Home Assistant entity' });
  await entityPicker.fill('Living Room');
  await expect(page.getByRole('option', { name: /Living Room Climate/ })).toBeVisible();
  await page.getByRole('option', { name: /Living Room Climate/ }).click();
  await page.getByLabel('Temperature unit').selectOption('°F');
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  const saveButton = page.getByRole('button', { name: 'Save and apply' }).first();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(() => saveCount).toBe(1);
  assert.equal(savedConfig.views[1].id.startsWith('view-'), true);
  assert.deepEqual(savedConfig.views[1].cards[0], {
    type: 'climate',
    entity: 'climate.living_room',
    temperatureUnit: '°F',
  });

  await page.getByRole('tab', { name: 'Advanced JSON' }).click();
  await page
    .getByRole('textbox', { name: 'Dashboard JSON' })
    .fill(JSON.stringify({ ...savedConfig, timeZone: 'Europe/Warsaw' }, null, 2));
  await page.getByRole('tab', { name: 'Builder' }).click();
  const jsonDialog = page.getByRole('dialog', { name: 'Unapplied JSON changes' });
  await expect(jsonDialog).toBeVisible();
  await jsonDialog.getByRole('button', { name: 'Discard JSON' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Builder' })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole('button', { name: 'Edit climate: climate.living_room' }).click();
  const inspector = page.getByRole('dialog', { name: 'Inspector' });
  await expect(inspector).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(inspector).not.toBeVisible();

  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(page.locator('iframe')).toBeVisible();
  const preview = page.frameLocator('iframe');
  await expect(preview.getByText('Preview · read only')).toBeVisible();
  assert.ok(previewCount > 0, 'preview snapshot endpoint was not called');
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  process.stdout.write(
    JSON.stringify(
      {
        result: 'PASS',
        checks: [
          'HA LAN URL discovery display',
          'visual view/card creation and rename',
          'domain-filtered searchable entity selection',
          'climate unit editing',
          'save and apply publishes the schema-v1 draft',
          'unapplied JSON requires an explicit discard before leaving its tab',
          'responsive inspector Sheet opens only for narrow admin layouts and supports Escape',
          'isolated read-only tablet renderer preview',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
