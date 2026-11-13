import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname, resolve, sep } from 'node:path';

const adminRoot = resolve('dist-admin');
const config = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
};
let savedConfig = structuredClone(config);
let saveCount = 0;
let previewCount = 0;
let deviceCommandCount = 0;
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
    if (url.pathname === '/api/manage/auth/session') {
      sendJson(200, { authenticated: true, connection: 'connected' });
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
      sendJson(200, {
        config: JSON.parse(body).config,
        states: [
          {
            entity_id: 'climate.living_room',
            state: 'heat',
            attributes: {
              friendly_name: 'Living Room Climate',
              temperature: 20,
              current_temperature: 19,
              min_temp: 16,
              max_temp: 30,
              target_temp_step: 0.5,
              hvac_modes: ['off', 'heat'],
              fan_modes: ['low', 'high'],
              fan_mode: 'low',
              supported_features: 1,
            },
          },
          {
            entity_id: 'sensor.lounge_temperature',
            state: '19.6',
            attributes: { friendly_name: 'Lounge Temperature', unit_of_measurement: '°C' },
          },
        ],
        forecasts: {},
      });
      return;
    }
    if (url.pathname.startsWith('/api/ha/services')) {
      deviceCommandCount += 1;
      sendJson(200, {});
      return;
    }
    const root = adminRoot;
    const relative = url.pathname.slice(1);
    const path = resolve(root, relative || 'index.html');
    if (path !== root && !path.startsWith(`${root}${sep}`)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(path);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
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
  await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByText('Loading the tablet renderer…')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tablet access' }).click();
  await expect(page.getByRole('heading', { name: 'Tablet access' })).toBeVisible();
  await expect(page.getByLabel('New PIN (optional)')).toBeVisible();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();

  await page.getByRole('button', { name: 'Add view' }).click();
  await page.getByRole('button', { name: 'View actions' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Move view earlier' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'View actions' })).toBeFocused();
  await page.getByRole('button', { name: 'View actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Move view earlier' })).toBeEnabled();
  await expect(page.getByRole('menuitem', { name: 'Move view later' })).toBeDisabled();
  await page.getByRole('menuitem', { name: 'Move view earlier' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Dashboard view' }).locator('option:checked'),
  ).toHaveText('New view');
  await expect(page.getByRole('button', { name: 'View actions' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: 'View actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Move view earlier' })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Move view later' })).toBeEnabled();
  await page.getByRole('menuitem', { name: 'Move view later' }).click();
  await expect(page.getByRole('button', { name: 'View actions' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: 'Rename view' }).click();
  const viewName = page.getByLabel('View name');
  await viewName.fill('Guest room');
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Add card' }).click();
  const primary = page.getByRole('button', { name: 'Save' }).first();
  await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(primary).toHaveCSS('border-top-width', '1px');
  const primaryContrast = await primary.evaluate((button) => {
    const style = getComputedStyle(button);
    // The browser evaluation must contain this helper for serialization.
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    const luminance = (color) => {
      const channels = color
        .match(/\d+/g)
        .slice(0, 3)
        .map((value) => {
          const channel = Number(value) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  });
  assert.ok(primaryContrast >= 4.5, `primary contrast ${primaryContrast} must be at least 4.5`);
  const outline = page
    .getByRole('dialog', { name: 'Add a card' })
    .getByRole('button', { name: 'Cancel' });
  await expect(outline).toHaveCSS('color', 'rgb(39, 49, 59)');
  await expect(outline).toHaveCSS('border-top-width', '1px');
  await expect(outline).toHaveCSS('border-top-color', 'rgb(223, 227, 232)');
  await page.getByRole('button', { name: 'Climate' }).click();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Climate' })).toBeVisible();
  await page.getByRole('button', { name: 'Climate' }).click();
  const entityPicker = page.getByRole('combobox', { name: 'Home Assistant entity' });
  await entityPicker.fill('Living Room');
  await expect(page.getByRole('option', { name: /Living Room Climate/ })).toBeVisible();
  await page.getByRole('option', { name: /Living Room Climate/ }).click();
  await page.getByRole('combobox', { name: 'Temperature unit' }).selectOption('°F');
  await expect(page.getByRole('combobox', { name: 'Temperature unit' })).toHaveValue('°F');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const preview = page;
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Delete Living Room Climate' })).toBeVisible();
  await expect(preview.getByText(/card controls/)).toHaveCount(0);
  await expect(
    preview.getByRole('button', { name: 'Move Living Room Climate earlier' }),
  ).toBeDisabled();
  await expect(
    preview.getByRole('button', { name: 'Move Living Room Climate later' }),
  ).toBeDisabled();
  await preview.getByRole('button', { name: 'Increase Living Room Climate temperature' }).click();
  assert.equal(deviceCommandCount, 0, 'editor card content must not send device commands');
  await page.getByRole('button', { name: 'Temperature badge' }).click();
  const temperaturePicker = page.getByRole('combobox', { name: 'Temperature sensor' });
  await temperaturePicker.fill('Lounge');
  await page.getByRole('option', { name: /Lounge Temperature/ }).click();
  await page.getByLabel('Display name override').fill('Lounge temp');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Edit Lounge temp' })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Delete Lounge temp' })).toBeVisible();
  const badgeWrapper = preview.locator('[data-sensor="sensor.lounge_temperature"]').locator('..');
  const badgeBox = await preview.locator('[data-sensor="sensor.lounge_temperature"]').boundingBox();
  const badgeActionsBox = await badgeWrapper
    .getByRole('button', { name: 'Edit Lounge temp' })
    .boundingBox();
  assert.ok(badgeBox && badgeActionsBox && badgeActionsBox.y >= badgeBox.y + badgeBox.height);
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  const saveButton = page.getByRole('button', { name: 'Save' }).first();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(() => saveCount).toBe(1);
  await expect(page.getByText('Dashboard saved and applied to paired tablets.')).toHaveCount(0);
  assert.equal(savedConfig.views[1].id.startsWith('view-'), true);
  assert.deepEqual(savedConfig.views[1].cards[0], {
    type: 'climate',
    entity: 'climate.living_room',
    temperatureUnit: '°F',
  });
  assert.deepEqual(savedConfig.views[1].badges[0], {
    type: 'temperature',
    entity: 'sensor.lounge_temperature',
    name: 'Lounge temp',
  });

  await page.getByRole('combobox', { name: 'Dashboard view' }).selectOption({ label: 'Home' });
  await page.getByRole('button', { name: 'View actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete view' }).click();
  const viewDeleteDialog = page.getByRole('dialog', { name: /Delete “Home”/ });
  await expect(viewDeleteDialog).toBeVisible();
  const destructive = viewDeleteDialog.getByRole('button', { name: 'Delete view' });
  await expect(destructive).toHaveCSS('color', 'rgb(161, 44, 56)');
  await expect(destructive).toHaveCSS('border-top-width', '1px');
  await expect(destructive).toHaveCSS('border-top-color', 'rgb(240, 204, 208)');
  await viewDeleteDialog.getByRole('button', { name: 'Delete view' }).click();
  await expect(
    page.getByRole('combobox', { name: 'Dashboard view' }).locator('option:checked'),
  ).toHaveText('Guest room');
  await page.getByRole('button', { name: 'View actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Delete view' })).toBeDisabled();

  await page.getByRole('button', { name: 'More dashboard actions' }).click();
  await page.getByRole('menuitem', { name: 'Dashboard settings' }).click();
  const settingsDialog = page.getByRole('dialog', { name: 'View settings' });
  await settingsDialog.getByText('Dashboard settings').click();
  await settingsDialog.getByLabel('Home timezone').fill('Europe/Warsaw');
  await settingsDialog.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'More dashboard actions' }).click();
  await page.getByRole('menuitem', { name: 'JSON import / export' }).click();
  const dashboardJson = page.getByRole('textbox', { name: 'Dashboard JSON' });
  assert.equal(JSON.parse(await dashboardJson.inputValue()).timeZone, undefined);
  await page
    .getByRole('textbox', { name: 'Dashboard JSON' })
    .fill(JSON.stringify({ ...savedConfig, timeZone: 'Europe/Warsaw' }, null, 2));
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  const jsonDialog = page.getByRole('dialog', { name: 'Unapplied JSON changes' });
  await expect(jsonDialog).toBeVisible();
  await jsonDialog.getByRole('button', { name: 'Validate and apply' }).click();
  await expect(page.getByText('Validated JSON applied')).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Dashboard view' })
    .selectOption({ label: 'Guest room' });
  await expect(page.locator('iframe')).toHaveCount(0);

  await page.setViewportSize({ width: 1024, height: 768 });
  await preview.getByRole('button', { name: 'Edit Living Room Climate' }).click();
  const inspector = page.getByRole('dialog', { name: 'Edit card' });
  await expect(inspector).toBeVisible();
  await page.getByLabel('Display name override').fill('Cancelled rename');
  const editingEntity = inspector.getByRole('combobox', { name: 'Home Assistant entity' });
  await editingEntity.fill('Living Room');
  await expect(inspector.getByRole('option', { name: /Living Room Climate/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editingEntity).toHaveAttribute('aria-expanded', 'false');
  await expect(inspector).toBeVisible();
  await expect(page.getByLabel('Display name override')).toHaveValue('Cancelled rename');
  await page.keyboard.press('Escape');
  await expect(inspector).not.toBeVisible();
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeFocused();
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeVisible();

  await preview.getByRole('button', { name: 'Delete Living Room Climate' }).click();
  const deleteDialog = page.getByRole('dialog', { name: /Delete climate\.living_room/ });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(preview.getByRole('button', { name: 'Delete Living Room Climate' })).toBeVisible();
  await page.screenshot({ path: join(tmpdir(), 'everdash-admin.png'), fullPage: true });
  assert.ok(previewCount > 0, 'preview snapshot endpoint was not called');
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  process.stdout.write(
    JSON.stringify(
      {
        result: 'PASS',
        checks: [
          'optional PIN access settings replace device pairing',
          'view creation and rename through focused settings',
          'view ordering and boundary move states',
          'view deletion preserves the final view',
          'domain-filtered searchable entity selection',
          'climate unit editing and editor-only card footer controls',
          'temperature badge selection and editor-only badge actions',
          'single Save action publishes the schema-v1 draft',
          'dashboard settings are staged and discarded when cancelled',
          'JSON apply shows a toast and preserves its draft until save',
          'nested Escape preserves the inspector draft before dismissing and restoring focus',
          'primary contrast and outline/destructive button styles',
          'card deletion is confirmed and cancellable',
          'shared tablet renderer canvas is isolated from device commands',
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
