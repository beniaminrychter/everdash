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
// The first save is rejected as a revision conflict, so the draft must survive it.
let conflictsLeft = 1;
// Serves a stored dashboard whose card has no entity, as a recovery load would.
let serveInvalidConfig = false;
const invalidConfig = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [{ type: 'light' }], badges: [] }],
};
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
        config: serveInvalidConfig ? invalidConfig : savedConfig,
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
      if (conflictsLeft > 0) {
        conflictsLeft -= 1;
        sendJson(409, {
          code: 'CONFIG_CONFLICT',
          message: 'The dashboard changed on the server.',
        });
        return;
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
      ].filter((entity) => !domain || domain.split(',').includes(entity.domain));
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
const baseUrl = `http://127.0.0.1:${address.port}/`;
const browser = await chromium.launch({
  channel: process.env.MY_HOME_BROWSER_CHANNEL || 'chrome',
  headless: true,
});
const pageErrors = [];
const consoleErrors = [];

function cardTotal(document) {
  return document.views.reduce((total, view) => total + (view.cards ?? []).length, 0);
}

async function openPage(viewport) {
  const opened = await browser.newPage({ viewport });
  opened.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  opened.on('pageerror', (error) => pageErrors.push(error.message));
  await opened.addInitScript(() => {
    Object.defineProperty(window.crypto, 'randomUUID', { configurable: true, value: undefined });
  });
  await opened.goto(baseUrl);

  return opened;
}

// Browsers report modern CSS colors (oklch) unchanged, so a canvas converts them to sRGB.
async function contrastOf(locator) {
  return locator.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    // The browser evaluation must contain these helpers for serialization.
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    const toRgb = (color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);

      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    const luminance = (color) => {
      const [red, green, blue] = toRgb(color).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const style = getComputedStyle(element);
    const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);

    return (values[0] + 0.05) / (values[1] + 0.05);
  });
}

try {
  const page = await openPage({ width: 1440, height: 1000 });
  const sidebar = (name) => page.getByRole('button', { name, exact: true });
  const saveButton = page.getByRole('button', { name: 'Save', exact: true });
  const viewTab = (name) => page.getByRole('tab', { name, exact: true });

  await expect(page.getByRole('heading', { name: 'Editor' })).toBeAttached();
  await expect(sidebar('Editor')).toBeVisible();
  await expect(page.getByText('Loading the tablet renderer…')).toHaveCount(0);
  await expect(page.getByRole('status', { name: 'Loading preview' })).toHaveCount(0);

  await sidebar('Tablets & PIN').click();
  await expect(page.getByRole('heading', { name: 'Tablets & PIN' })).toBeVisible();
  await expect(page.getByText('Tablet access', { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'PIN protection' }).click();
  await expect(page.getByLabel('PIN', { exact: true })).toBeVisible();
  await sidebar('Editor').click();

  await page.getByRole('button', { name: '+ View' }).click();
  await expect(viewTab('New view')).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'View options' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'View options' })).toBeFocused();
  await page.getByRole('button', { name: 'View options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Move earlier' })).toBeEnabled();
  await expect(page.getByRole('menuitem', { name: 'Move later' })).toBeDisabled();
  await page.getByRole('menuitem', { name: 'Move earlier' }).click();
  await expect(viewTab('New view')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab').first()).toHaveText('New view');
  await expect(page.getByRole('button', { name: 'View options' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: 'View options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Move earlier' })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Move later' })).toBeEnabled();
  await page.getByRole('menuitem', { name: 'Move later' }).click();
  await expect(page.getByRole('button', { name: 'View options' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: 'View options' }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  await expect(page.getByLabel('View name')).toBeFocused();
  await page.getByLabel('View name').fill('Guest room');
  await expect(viewTab('Guest room')).toBeVisible();

  await expect(saveButton).toBeEnabled();
  const primaryContrast = await contrastOf(saveButton);
  assert.ok(primaryContrast >= 4.5, `primary contrast ${primaryContrast} must be at least 4.5`);
  await expect(page.getByRole('button', { name: 'Discard', exact: true })).toHaveCSS(
    'border-top-width',
    '1px',
  );
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('button', { name: /^Climate/ }).click();
  const entityPicker = page.getByLabel('Home Assistant entity');
  await entityPicker.click();
  await page.getByPlaceholder('Search climate by name or ID').fill('Living Room');
  await expect(page.getByRole('option', { name: /Living Room Climate/ })).toBeVisible();
  await page.getByRole('option', { name: /Living Room Climate/ }).click();
  await page.getByRole('combobox', { name: 'Temperature unit' }).click();
  await page.getByRole('option', { name: /°F/ }).click();
  await expect(page.getByRole('combobox', { name: 'Temperature unit' })).toContainText('°F');
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
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
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('button', { name: /^Value/ }).click();
  await page.getByLabel('Home Assistant entity').click();
  await page.getByPlaceholder('Search sensor or input_number by name or ID').fill('Lounge');
  await page.getByRole('option', { name: /Lounge Temperature/ }).click();
  await expect(page.getByRole('button', { name: 'Tile', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Hero', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hero', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Display name').fill('Power meter');
  await page.getByLabel('Unit', { exact: true }).fill('deg');
  await page.getByRole('combobox', { name: 'Decimal places' }).click();
  await page.getByRole('option', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Edit Power meter' })).toBeVisible();
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('button', { name: /^Switch/ }).click();
  await expect(page.getByLabel('Home Assistant entity')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('button', { name: /^Scene/ }).click();
  await expect(page.getByLabel('Home Assistant entity')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '+ Badge' }).click();
  await page.getByLabel('Temperature sensor').click();
  await page.getByPlaceholder('Search sensor by name or ID').fill('Lounge');
  await page.getByRole('option', { name: /Lounge Temperature/ }).click();
  await page.getByLabel('Display name').fill('Lounge temp');
  await page.getByRole('button', { name: 'Add badge', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Edit Lounge temp' })).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Delete Lounge temp' })).toBeVisible();
  const badgeWrapper = preview.locator('[data-sensor="sensor.lounge_temperature"]').locator('..');
  const badgeBox = await preview.locator('[data-sensor="sensor.lounge_temperature"]').boundingBox();
  const badgeActionsBox = await badgeWrapper
    .getByRole('button', { name: 'Edit Lounge temp' })
    .boundingBox();
  assert.ok(badgeBox && badgeActionsBox && badgeActionsBox.y >= badgeBox.y + badgeBox.height);

  // A rejected save keeps the draft, shows the error, and a second save succeeds.
  await expect(page.getByText(/unsaved change/)).toBeVisible();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByRole('alert').filter({ hasText: /newer dashboard/ })).toBeVisible();
  assert.equal(saveCount, 0, 'a conflicting save must not be recorded');
  await expect(page.getByText(/unsaved change/)).toBeVisible();
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeVisible();
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect.poll(() => saveCount).toBe(1);
  await expect(page.getByText('All changes saved')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: /newer dashboard/ })).toHaveCount(0);
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

  await viewTab('Home').click();
  await page.getByRole('button', { name: 'View options' }).click();
  await page.getByRole('menuitem', { name: 'Delete view' }).click();
  const viewDeleteDialog = page.getByRole('alertdialog', { name: /Delete “Home”/ });
  await expect(viewDeleteDialog).toBeVisible();
  const destructive = viewDeleteDialog.getByRole('button', { name: 'Delete view' });
  const destructiveContrast = await contrastOf(destructive);
  assert.ok(destructiveContrast >= 4.5, `destructive contrast ${destructiveContrast} too low`);
  await destructive.click();
  await expect(viewTab('Guest room')).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'View options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Delete view' })).toBeDisabled();
  await page.keyboard.press('Escape');

  // Dashboard settings join the draft immediately and show up in the JSON page.
  await sidebar('Dashboard settings').click();
  await expect(page.getByRole('heading', { name: 'Dashboard settings' })).toBeVisible();
  await page.getByLabel('Home timezone').fill('Europe/Warsaw');
  await sidebar('JSON import / export').click();
  const dashboardJson = page.getByRole('textbox', { name: 'Dashboard JSON' });
  assert.equal(JSON.parse(await dashboardJson.inputValue()).timeZone, 'Europe/Warsaw');
  await dashboardJson.fill(JSON.stringify({ ...savedConfig, timeZone: 'Europe/London' }, null, 2));
  await sidebar('Editor').click();
  const jsonDialog = page.getByRole('alertdialog', { name: 'Unapplied JSON changes' });
  await expect(jsonDialog).toBeVisible();
  await jsonDialog.getByRole('button', { name: 'Validate and apply' }).click();
  await expect(page.getByText('Validated JSON applied')).toBeVisible();
  await viewTab('Guest room').click();
  await expect(page.locator('iframe')).toHaveCount(0);

  // Below lg the inspector is a sheet.
  await page.setViewportSize({ width: 900, height: 768 });
  await preview.getByRole('button', { name: 'Edit Living Room Climate' }).click();
  const inspector = page.getByRole('dialog', { name: 'Inspector' });
  await expect(inspector).toBeVisible();
  const displayName = inspector.getByLabel('Display name');
  const originalName = await displayName.inputValue();
  await displayName.fill('Cancelled rename');
  const editingEntity = inspector.getByLabel('Home Assistant entity');
  await editingEntity.click();
  await page.getByPlaceholder('Search climate by name or ID').fill('Living Room');
  await expect(page.getByRole('option', { name: /Living Room Climate/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editingEntity).toHaveAttribute('aria-expanded', 'false');
  // The popover keeps its dismiss layer until its exit animation ends.
  await expect(page.getByPlaceholder('Search climate by name or ID')).toHaveCount(0);
  await expect(inspector).toBeVisible();
  // Escaping the picker must not reset or remount the inspector's other fields.
  await expect(displayName).toHaveValue('Cancelled rename');
  await displayName.fill(originalName);
  await page.keyboard.press('Escape');
  await expect(inspector).not.toBeVisible();
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeFocused();
  await expect(preview.getByRole('button', { name: 'Edit Living Room Climate' })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });

  await preview.getByRole('button', { name: 'Delete Living Room Climate' }).click();
  const deleteDialog = page.getByRole('alertdialog', { name: 'Delete this card?' });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(preview.getByRole('button', { name: 'Delete Living Room Climate' })).toBeVisible();
  await page.screenshot({ path: join(tmpdir(), 'everdash-admin.png'), fullPage: true });
  assert.ok(previewCount > 0, 'preview snapshot endpoint was not called');
  await page.close();

  // Saving with a pending (entity-less) card open must not put that card in the saved document.
  const cardsBefore = cardTotal(savedConfig);
  const savesBefore = saveCount;
  const pendingPage = await openPage({ width: 1440, height: 1000 });
  await expect(pendingPage.getByRole('tab', { name: 'Guest room' })).toBeVisible();
  await pendingPage.getByRole('button', { name: '+ View' }).click();
  await pendingPage.getByRole('button', { name: '+ Add card' }).click();
  await pendingPage.getByRole('button', { name: /^Climate/ }).click();
  await expect(pendingPage.getByRole('button', { name: 'Add card', exact: true })).toBeDisabled();
  await pendingPage.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => saveCount).toBe(savesBefore + 1);
  assert.equal(cardTotal(savedConfig), cardsBefore, 'a pending card must not be saved');
  assert.equal(
    savedConfig.views.some((view) => (view.cards ?? []).some((card) => !card.entity)),
    false,
  );
  await pendingPage.close();

  // An invalid stored dashboard lists its problems in the canvas area.
  serveInvalidConfig = true;
  const invalidPage = await openPage({ width: 1440, height: 1000 });
  const canvasAlert = invalidPage
    .getByRole('alert')
    .filter({ hasText: 'This dashboard has problems' });
  await expect(canvasAlert).toBeVisible();
  await expect(canvasAlert.getByRole('listitem').first()).toBeVisible();
  await expect(invalidPage.getByText('Open the dashboard builder')).toHaveCount(0);
  await invalidPage.close();
  serveInvalidConfig = false;

  assert.deepEqual(pageErrors, []);
  // The browser logs the deliberate 409 as a failed resource load.
  assert.deepEqual(
    consoleErrors.filter((message) => !message.includes('409')),
    [],
  );
  process.stdout.write(
    JSON.stringify(
      {
        result: 'PASS',
        checks: [
          'PIN protection switch on the Tablets & PIN page',
          'view creation and rename through the inspector',
          'view ordering and boundary move states',
          'view deletion preserves the final view',
          'domain-filtered searchable entity selection',
          'climate unit editing and editor-only card footer controls',
          'temperature badge selection and editor-only badge actions',
          'a rejected save keeps the draft and shows an Alert, then a second save succeeds',
          'Save publishes the schema-v1 draft',
          'a pending card is never saved',
          'an invalid dashboard lists its problems in the canvas area',
          'dashboard settings join the draft and appear in the JSON page',
          'JSON apply shows a toast and preserves its draft until save',
          'nested Escape closes the entity picker first, then the inspector sheet, and restores focus',
          'primary and destructive contrast',
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
