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
// A dashboard with sections, one of them empty, for the section and drag-and-drop checks.
const sectionConfig = {
  schemaVersion: 1,
  views: [
    {
      id: 'home',
      title: 'Home',
      cards: [
        { type: 'value', entity: 'sensor.lounge_temperature', name: 'Hall temp' },
        { type: 'climate', entity: 'climate.living_room' },
      ],
      sections: [
        {
          id: 'kitchen',
          title: 'Kitchen',
          cards: [{ type: 'value', entity: 'sensor.lounge_temperature', name: 'Lounge' }],
        },
        { id: 'garden', title: 'Garden', cards: [] },
      ],
      badges: [],
    },
  ],
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
        {
          entityId: 'weather.home',
          name: 'Home Weather',
          domain: 'weather',
          state: 'Available',
          available: true,
          unit: null,
          deviceClass: null,
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

/** The middle of a Playwright bounding box. */
const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** The card's cell in the canvas, found by its select layer ("Select <name>"). */
const cardCell = (target, name) =>
  target.locator('[data-editor-card]').filter({
    has: target.getByRole('button', { name: `Select ${name}`, exact: true }),
  });

/** Hovering a card shows its pencil and ⋮ buttons; they are found by aria-label. */
async function hoverCard(target, name) {
  await target.getByRole('button', { name: `Select ${name}`, exact: true }).hover();
}

async function openCardMenu(target, name) {
  await hoverCard(target, name);
  await target.getByRole('button', { name: `More actions for ${name}`, exact: true }).click();
}

/** Picks one entry of a card's or section's ⋮ menu. */
async function chooseMenuItem(target, name, item) {
  await openCardMenu(target, name);
  await target.getByRole('menuitem', { name: item, exact: true }).click();
}

/**
 * Drags with the mouse the way a person does: press, several small moves so the drag starts and
 * the pointer crosses the cards in between, then release.
 */
async function dragTo(target, from, to, { release = true } = {}) {
  await target.mouse.move(from.x, from.y);
  await target.mouse.down();
  await target.mouse.move(from.x + 8, from.y + 8, { steps: 3 });
  await target.mouse.move(to.x, to.y, { steps: 14 });
  // SortableJS animates the neighbours for 150ms; wait for the placeholder to settle.
  await target.waitForTimeout(260);

  if (release) {
    await target.mouse.up();
  }
}

/**
 * The same rule as the tablet (data/gridLayout.ts): a quarter is as wide as an accessory tile, so
 * four to a row from 800px, three from 620px, then a half and then the full row.
 */
const expectedQuarter = (row) => (row >= 800 ? 4 : row >= 620 ? 3 : row >= 576 ? 'half' : 'full');

/** The card names of one area, in the order the canvas draws them. */
const areaNames = (target, area) =>
  target
    .locator(`[data-editor-area="${area}"] [data-editor-card] [data-editor-select][aria-pressed]`)
    .evaluateAll((layers) =>
      layers.map((layer) => layer.getAttribute('aria-label').replace(/^Select /, '')),
    );

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
  await page.getByRole('combobox', { name: 'Card type' }).click();
  await page.getByRole('option', { name: /^Climate/ }).click();
  // The new card is in the preview before an entity is chosen.
  await expect(page.getByRole('button', { name: 'Edit New climate' })).toBeVisible();
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
  await expect(preview.getByText(/card controls/)).toHaveCount(0);
  // Nothing is drawn under the cards any more: the row of grip, arrows and trash is gone.
  await expect(preview.getByRole('button', { name: /^Drag .* to reorder$/ })).toHaveCount(0);
  await expect(preview.getByRole('button', { name: /^Delete Living Room Climate/ })).toHaveCount(0);
  await expect(preview.getByRole('button', { name: /^Move Living Room Climate/ })).toHaveCount(0);
  // The overlay shows on hover: a pencil and a ⋮ menu. With a single card, it cannot move.
  await hoverCard(preview, 'Living Room Climate');
  await expect(
    cardCell(preview, 'Living Room Climate').locator('[data-editor-nodrag]').first(),
  ).toHaveCSS('opacity', '1');
  await preview.getByRole('button', { name: 'More actions for Living Room Climate' }).click();
  await expect(preview.getByRole('menuitem')).toHaveText([
    'Edit',
    'Move earlier',
    'Move later',
    'Duplicate',
    'Delete',
  ]);
  await expect(preview.getByRole('menuitem', { name: 'Move earlier' })).toBeDisabled();
  await expect(preview.getByRole('menuitem', { name: 'Move later' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(preview.getByRole('menu')).toHaveCount(0);
  // The card's own controls are inert in the editor: a click where its + button is selects the card.
  const increase = await preview
    .locator('[data-editor-card] button[aria-label="Increase Living Room Climate temperature"]')
    .boundingBox();
  await page.mouse.click(center(increase).x, center(increase).y);
  assert.equal(deviceCommandCount, 0, 'editor card content must not send device commands');
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('combobox', { name: 'Card type' }).click();
  await page.getByRole('option', { name: /^Value/ }).click();
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
  await expect(page.getByRole('button', { name: 'Auto (from the entity type)' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Hide unit').check();
  await expect(page.getByLabel('Unit', { exact: true })).toBeDisabled();
  await page.getByLabel('Hide unit').uncheck();
  await page.getByLabel('Unit', { exact: true }).fill('deg');
  await page.getByRole('combobox', { name: 'Decimal places' }).click();
  await page.getByRole('option', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Edit Power meter' })).toBeVisible();
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('combobox', { name: 'Card type' }).click();
  await page.getByRole('option', { name: /^Switch/ }).click();
  await expect(page.getByLabel('Home Assistant entity')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '+ Add card' }).click();
  await page.getByRole('combobox', { name: 'Card type' }).click();
  await page.getByRole('option', { name: /^Scene/ }).click();
  await expect(page.getByLabel('Home Assistant entity')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '+ Badge' }).click();
  await page.getByLabel('Temperature sensor').click();
  await page.getByPlaceholder('Search sensor by name or ID').fill('Lounge');
  await page.getByRole('option', { name: /Lounge Temperature/ }).click();
  await page.getByLabel('Display name').fill('Lounge temp');
  await page.getByRole('button', { name: 'Add badge', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Edit Lounge temp' })).toBeVisible();
  // A badge has no delete button of its own: hovering it shows a ⋮ on its top right corner.
  await expect(preview.getByRole('button', { name: 'Delete Lounge temp' })).toHaveCount(0);
  const loungePill = preview.locator('[data-sensor="sensor.lounge_temperature"]');
  await preview.getByRole('button', { name: 'Edit Lounge temp', exact: true }).hover();
  const loungeMenu = preview.getByRole('button', { name: 'More actions for Lounge temp' });
  await expect(loungeMenu).toBeVisible();
  const loungeBox = await loungePill.boundingBox();
  const loungeMenuBox = await loungeMenu.boundingBox();
  assert.ok(
    loungeMenuBox.y + loungeMenuBox.height / 2 <= loungeBox.y + 4,
    'the menu button sits on the pill corner, not over its value',
  );
  await page.mouse.move(5, 5);

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
  await hoverCard(preview, 'Living Room Climate');
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

  await chooseMenuItem(preview, 'Living Room Climate', 'Delete');
  const deleteDialog = page.getByRole('alertdialog', { name: 'Delete this card?' });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(preview.getByRole('button', { name: 'Select Living Room Climate' })).toBeVisible();
  await page.screenshot({ path: join(tmpdir(), 'everdash-admin.png'), fullPage: true });
  assert.ok(previewCount > 0, 'preview snapshot endpoint was not called');
  await page.close();

  // A new card is a card of the draft from the moment it is added: it shows in the canvas with
  // a hint, and saving is blocked (with a message) until it is finished or removed.
  const savesBefore = saveCount;
  const pendingPage = await openPage({ width: 1440, height: 1000 });
  await expect(pendingPage.getByRole('tab', { name: 'Guest room' })).toBeVisible();
  await pendingPage.getByRole('button', { name: '+ View' }).click();
  await pendingPage.getByRole('button', { name: '+ Add card' }).click();
  await pendingPage.getByRole('combobox', { name: 'Card type' }).click();
  await pendingPage.getByRole('option', { name: /^Climate/ }).click();
  await expect(pendingPage.getByRole('button', { name: 'Add card', exact: true })).toBeDisabled();
  await expect(pendingPage.getByRole('button', { name: 'Select New climate' })).toBeVisible();
  await expect(
    pendingPage.locator('[data-canvas-island]').getByText('Choose an entity'),
  ).toBeVisible();
  const pendingSave = pendingPage.getByRole('button', { name: 'Save', exact: true });
  await expect(pendingSave).toBeDisabled();
  await expect(pendingPage.getByText('Finish or remove the new card before saving.')).toBeVisible();
  // The new card has the same hover chrome as any card; Duplicate is not offered for it.
  await openCardMenu(pendingPage, 'New climate');
  await expect(pendingPage.getByRole('menuitem', { name: 'Duplicate' })).toBeDisabled();
  await expect(pendingPage.getByRole('menuitem', { name: 'Delete' })).toBeEnabled();
  await pendingPage.getByRole('menuitem', { name: 'Delete' }).click();
  // A card that was only just added is removed at once, like Cancel; there is nothing to confirm.
  await expect(pendingPage.getByRole('alertdialog')).toHaveCount(0);
  await expect(pendingPage.getByRole('button', { name: 'Select New climate' })).toHaveCount(0);
  await expect(pendingPage.getByText('Finish or remove the new card')).toHaveCount(0);
  await expect(pendingSave).toBeEnabled();
  assert.equal(saveCount, savesBefore, 'nothing was saved');
  await pendingPage.close();

  // A weather card is one or two rows high; two is the default and is not written to the config.
  savedConfig = {
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [{ type: 'weather', entity: 'weather.home', name: 'Forecast' }],
        badges: [],
      },
    ],
  };
  const rowsPage = await openPage({ width: 1440, height: 900 });
  await rowsPage.getByRole('button', { name: 'Select Forecast', exact: true }).click();
  const rowsField = rowsPage.getByRole('group', { name: 'Rows', exact: true });
  await expect(rowsField.getByRole('button', { name: '2 rows' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await rowsField.getByRole('button', { name: '1 row', exact: true }).click();
  await rowsPage.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => savedConfig.views[0].cards[0].rows).toBe(1);
  await rowsField.getByRole('button', { name: '2 rows' }).click();
  await rowsPage.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => 'rows' in savedConfig.views[0].cards[0]).toBe(false);
  await rowsPage.close();

  // Badges are edited like cards: click to edit, a ⋮ menu, and drag and drop to reorder.
  savedConfig = {
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [],
        badges: ['Alpha', 'Bravo', 'Charlie'].map((name) => ({
          type: 'temperature',
          entity: 'sensor.lounge_temperature',
          name,
        })),
      },
    ],
  };
  const badgePage = await openPage({ width: 1440, height: 900 });
  const badgeNames = () =>
    badgePage
      .locator('[data-editor-badge] [data-editor-select]')
      .evaluateAll((layers) =>
        layers.map((layer) => layer.getAttribute('aria-label').replace('Edit ', '')),
      );
  const badgeLayer = (name) =>
    badgePage.getByRole('button', { exact: true, name: `Edit ${name}` }).first();
  const openBadgeMenu = async (name) => {
    await badgeLayer(name).hover();
    await badgePage
      .getByRole('button', { exact: true, name: `More actions for ${name}` })
      .first()
      .click();
  };
  const chooseBadgeItem = async (name, item) => {
    await openBadgeMenu(name);
    await badgePage.getByRole('menuitem', { exact: true, name: item }).click();
  };
  await expect.poll(badgeNames).toEqual(['Alpha', 'Bravo', 'Charlie']);
  await badgeLayer('Bravo').click();
  await expect(badgeLayer('Bravo')).toHaveAttribute('aria-pressed', 'true');
  await expect(badgePage.getByLabel('Display name')).toHaveValue('Bravo');

  await chooseBadgeItem('Alpha', 'Move later');
  await expect.poll(badgeNames).toEqual(['Bravo', 'Alpha', 'Charlie']);
  await openBadgeMenu('Bravo');
  await expect(badgePage.getByRole('menuitem', { name: 'Move earlier' })).toBeDisabled();
  await badgePage.keyboard.press('Escape');

  const charlie = center(await badgeLayer('Charlie').boundingBox());
  const first = await badgeLayer('Bravo').boundingBox();
  await dragTo(badgePage, charlie, { x: first.x + 6, y: first.y + first.height / 2 });
  await expect.poll(badgeNames).toEqual(['Charlie', 'Bravo', 'Alpha']);

  await chooseBadgeItem('Alpha', 'Duplicate');
  await expect.poll(badgeNames).toEqual(['Charlie', 'Bravo', 'Alpha', 'Alpha']);

  await chooseBadgeItem('Bravo', 'Delete');
  const badgeDialog = badgePage.getByRole('alertdialog', { name: 'Delete this badge?' });
  await expect(badgeDialog).toBeVisible();
  await badgeDialog.getByRole('button', { name: 'Delete badge' }).click();
  await expect.poll(badgeNames).toEqual(['Charlie', 'Alpha', 'Alpha']);

  await badgePage.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => savedConfig.views[0].badges.map((badge) => badge.name))
    .toEqual(['Charlie', 'Alpha', 'Alpha']);
  await badgePage.close();

  // Sections, hover chrome and SortableJS drag and drop.
  const shots = process.env.EVERDASH_SMOKE_SHOTS;
  const screenshot = async (target, name) => {
    if (shots) {
      await target.screenshot({ path: join(shots, name), fullPage: true });
    }
  };
  savedConfig = structuredClone(sectionConfig);
  const cardsSavedBefore = cardTotal(savedConfig);
  // Tall enough that every drop target is on screen, since the pointer cannot leave the viewport.
  const sectionPage = await openPage({ width: 1440, height: 1500 });
  const sectionArea = (id) => sectionPage.locator(`section[aria-labelledby="section-home-${id}"]`);
  const headings = () => sectionPage.locator('h2[id^="section-home-"]').allTextContents();
  const ghost = sectionPage.locator('[class*="_ghost_"]');
  const lifted = sectionPage.locator('[class*="_lifted_"]');
  const selectLayer = (name) =>
    sectionPage.getByRole('button', { name: `Select ${name}`, exact: true });
  const layerCenter = async (name) => center(await selectLayer(name).boundingBox());
  const saveSections = sectionPage.getByRole('button', { name: 'Save', exact: true });
  await expect(selectLayer('Hall temp')).toBeVisible();
  assert.deepEqual(await headings(), ['Kitchen', 'Garden']);
  await expect(sectionArea('garden').getByText(/No cards in this section yet/)).toBeVisible();
  // An empty area is a visible drop zone with a height of its own.
  const gardenList = sectionPage.locator('[data-editor-area="garden"]');
  assert.ok((await gardenList.boundingBox()).height >= 80, 'an empty area keeps a drop zone');
  await screenshot(sectionPage, 'admin-sections.png');
  // A section heading shows a drag handle, a pencil and a ⋮ menu on hover.
  await sectionPage.getByRole('button', { name: 'Select section Garden', exact: true }).hover();
  await expect(
    sectionPage.getByRole('button', { name: 'Drag section Garden', exact: true }),
  ).toBeVisible();
  await expect(
    sectionPage.getByRole('button', { name: 'Edit section Garden', exact: true }),
  ).toBeVisible();
  await screenshot(sectionPage, 'admin-section-hover.png');

  // Hover chrome: a pencil and ⋮ in the card's top right corner, found by aria-label. It is
  // hidden until the card is hovered, focused or selected.
  await sectionPage.mouse.move(700, 20);
  await expect(
    cardCell(sectionPage, 'Hall temp').locator('[data-editor-nodrag]').first(),
  ).toHaveCSS('opacity', '0');
  await hoverCard(sectionPage, 'Hall temp');
  await expect(
    cardCell(sectionPage, 'Hall temp').locator('[data-editor-nodrag]').first(),
  ).toHaveCSS('opacity', '1');
  await expect(
    sectionPage.getByRole('button', { name: 'Edit Hall temp', exact: true }),
  ).toBeVisible();
  const pencil = await sectionPage
    .getByRole('button', { name: 'Edit Hall temp', exact: true })
    .boundingBox();
  const hallBox = await selectLayer('Hall temp').boundingBox();
  assert.ok(pencil.x > hallBox.x + hallBox.width / 2, 'the pencil is on the right of the card');
  assert.ok(pencil.y < hallBox.y + hallBox.height / 3, 'the pencil is at the top of the card');
  await screenshot(sectionPage, 'admin-card-hover.png');

  // The ⋮ menu: keyboard accessible, with Move to section because the view has sections.
  await openCardMenu(sectionPage, 'Hall temp');
  const menuButton = sectionPage.getByRole('button', {
    name: 'More actions for Hall temp',
    exact: true,
  });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(sectionPage.getByRole('menuitem')).toHaveText([
    'Edit',
    'Move to section',
    'Move earlier',
    'Move later',
    'Duplicate',
    'Delete',
  ]);
  await expect(sectionPage.getByRole('menuitem', { name: 'Edit', exact: true })).toBeFocused();
  await sectionPage.keyboard.press('ArrowDown');
  await expect(sectionPage.getByRole('menuitem', { name: 'Move to section' })).toBeFocused();
  await sectionPage.keyboard.press('Enter');
  await expect(sectionPage.getByRole('menuitem')).toContainText([
    'Edit',
    'Move to section',
    'No section',
    'Kitchen',
    'Garden',
    'Move earlier',
    'Move later',
    'Duplicate',
    'Delete',
  ]);
  // The card's own section is marked and cannot be picked again.
  await expect(sectionPage.getByRole('menuitem', { name: 'No section' })).toBeDisabled();
  await screenshot(sectionPage, 'admin-card-menu.png');
  await sectionPage.keyboard.press('Escape');
  await expect(sectionPage.getByRole('menu')).toHaveCount(0);
  await expect(menuButton).toBeFocused();
  // A press anywhere outside closes the menu as well.
  await openCardMenu(sectionPage, 'Hall temp');
  await expect(sectionPage.getByRole('menu')).toBeVisible();
  await sectionPage.mouse.click(1000, 60);
  await expect(sectionPage.getByRole('menu')).toHaveCount(0);
  // The menu sits above the cards after it, and is not clipped by the card.
  await openCardMenu(sectionPage, 'Living Room Climate');
  const climateMenu = sectionPage.getByRole('menu');
  const menuBox = await climateMenu.boundingBox();
  const middle = center(menuBox);
  const topmost = await sectionPage.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('[role="menu"]') !== null,
    middle,
  );
  assert.ok(topmost, 'the open menu must be the topmost layer where it is drawn');
  await sectionPage.keyboard.press('Escape');

  // A click without movement selects the card and opens it in the inspector.
  await selectLayer('Hall temp').click();
  await expect(sectionPage.getByLabel('Display name')).toHaveValue('Hall temp');
  await expect(selectLayer('Hall temp')).toHaveAttribute('aria-pressed', 'true');
  await sectionPage.getByRole('button', { name: 'Select Lounge', exact: true }).click();
  await expect(sectionPage.getByLabel('Display name')).toHaveValue('Lounge');

  // Dragging the whole card: a placeholder shows where it will land, the card follows the pointer.
  await dragTo(
    sectionPage,
    await layerCenter('Hall temp'),
    {
      x: (await gardenList.boundingBox()).x + 120,
      y: (await gardenList.boundingBox()).y + 40,
    },
    { release: false },
  );
  await expect(lifted).toHaveCount(1);
  await expect(ghost).toHaveCount(1);
  await expect(sectionArea('garden').getByText('Drop here')).toBeVisible();
  const ghostBox = await ghost.boundingBox();
  const gardenBox = await gardenList.boundingBox();
  assert.ok(
    ghostBox.x >= gardenBox.x - 1 && ghostBox.y >= gardenBox.y - 1,
    'the placeholder is where the card will land',
  );
  assert.ok(ghostBox.width < gardenBox.width / 2, 'the placeholder is card sized');
  await screenshot(sectionPage, 'admin-drag.png');
  await sectionPage.mouse.up();
  await expect(
    sectionArea('garden').getByRole('button', { name: 'Select Hall temp' }),
  ).toBeVisible();
  assert.deepEqual(await areaNames(sectionPage, 'garden'), ['Hall temp']);
  assert.deepEqual(await areaNames(sectionPage, ''), ['Living Room Climate']);
  await expect(ghost).toHaveCount(0);
  await expect(lifted).toHaveCount(0);
  // The drop does not select the card that moved; Lounge stays the selected one.
  await expect(sectionPage.getByLabel('Display name')).toHaveValue('Lounge');

  // Dropping before a card in another section puts the card ahead of it.
  const lounge = await selectLayer('Lounge').boundingBox();
  await dragTo(sectionPage, await layerCenter('Hall temp'), {
    x: lounge.x + 24,
    y: lounge.y + lounge.height / 2,
  });
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['Hall temp', 'Lounge']);
  assert.deepEqual(await areaNames(sectionPage, 'garden'), []);
  await expect(sectionArea('garden').getByText(/No cards in this section yet/)).toBeVisible();
  // Lounge is still the selected card, and still has the right index after the card ahead of it.
  await expect(sectionPage.getByLabel('Display name')).toHaveValue('Lounge');

  // Reordering inside a list: onto the far side of the neighbour.
  const neighbour = await selectLayer('Lounge').boundingBox();
  await dragTo(sectionPage, await layerCenter('Hall temp'), {
    x: neighbour.x + neighbour.width - 24,
    y: neighbour.y + neighbour.height / 2,
  });
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['Lounge', 'Hall temp']);

  // The menu moves a card to a section, or out of every section, and earlier or later.
  await chooseMenuItem(sectionPage, 'Hall temp', 'Move to section');
  await sectionPage.getByRole('menuitem', { name: 'Garden', exact: true }).click();
  assert.deepEqual(await areaNames(sectionPage, 'garden'), ['Hall temp']);
  await openCardMenu(sectionPage, 'Hall temp');
  await sectionPage.getByRole('menuitem', { name: 'Move to section' }).click();
  await sectionPage.getByRole('menuitem', { name: 'No section' }).click();
  assert.deepEqual(await areaNames(sectionPage, ''), ['Living Room Climate', 'Hall temp']);
  await chooseMenuItem(sectionPage, 'Hall temp', 'Move earlier');
  assert.deepEqual(await areaNames(sectionPage, ''), ['Hall temp', 'Living Room Climate']);
  await chooseMenuItem(sectionPage, 'Hall temp', 'Move later');
  assert.deepEqual(await areaNames(sectionPage, ''), ['Living Room Climate', 'Hall temp']);

  // Duplicate puts a copy right after the card and selects it.
  await chooseMenuItem(sectionPage, 'Lounge', 'Duplicate');
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['Lounge', 'Lounge']);
  await expect(sectionPage.getByLabel('Display name')).toHaveValue('Lounge');
  const lounges = sectionPage.getByRole('button', { name: 'Select Lounge', exact: true });
  await expect(lounges.nth(1)).toHaveAttribute('aria-pressed', 'true');
  // Delete goes through the existing confirmation, which can be cancelled.
  await lounges.nth(1).hover();
  await sectionPage.getByRole('button', { name: 'More actions for Lounge' }).nth(1).click();
  await sectionPage.getByRole('menuitem', { name: 'Delete' }).click();
  const cardDialog = sectionPage.getByRole('alertdialog', { name: 'Delete this card?' });
  await expect(cardDialog).toBeVisible();
  await cardDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(lounges).toHaveCount(2);
  await lounges.nth(1).hover();
  await sectionPage.getByRole('button', { name: 'More actions for Lounge' }).nth(1).click();
  await sectionPage.getByRole('menuitem', { name: 'Delete' }).click();
  await sectionPage.getByRole('alertdialog').getByRole('button', { name: 'Delete card' }).click();
  await expect(lounges).toHaveCount(1);

  // A card started in a section is a card of that section, with the same chrome and drag.
  await sectionPage.getByRole('button', { name: 'Add card to Garden' }).click();
  await expect(
    sectionArea('garden').getByRole('button', { name: 'Select New light' }),
  ).toBeVisible();
  await expect(sectionPage.getByRole('combobox', { name: 'Section' })).toContainText('Garden');
  await expect(
    sectionPage.locator('[data-canvas-island]').getByText('Choose an entity'),
  ).toBeVisible();
  await expect(saveSections).toBeDisabled();
  await expect(sectionPage.getByText('Finish or remove the new card before saving.')).toBeVisible();
  await screenshot(sectionPage, 'admin-pending-card.png');
  // Drag it into Kitchen, ahead of Lounge: it stays selected, and still new.
  const loungeNow = await selectLayer('Lounge').boundingBox();
  await dragTo(sectionPage, await layerCenter('New light'), {
    x: loungeNow.x + 24,
    y: loungeNow.y + loungeNow.height / 2,
  });
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['New light', 'Lounge']);
  assert.deepEqual(await areaNames(sectionPage, 'garden'), []);
  await expect(sectionPage.getByRole('combobox', { name: 'Section' })).toContainText('Kitchen');
  await expect(sectionPage.getByRole('button', { name: 'Add card', exact: true })).toBeDisabled();
  await expect(saveSections).toBeDisabled();
  // Acting on other cards never makes it disappear.
  await chooseMenuItem(sectionPage, 'Hall temp', 'Move earlier');
  await chooseMenuItem(sectionPage, 'Lounge', 'Duplicate');
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['New light', 'Lounge', 'Lounge']);
  await sectionPage.getByRole('button', { name: 'Select Lounge', exact: true }).nth(1).hover();
  await sectionPage.getByRole('button', { name: 'More actions for Lounge' }).nth(1).click();
  await sectionPage.getByRole('menuitem', { name: 'Delete' }).click();
  await sectionPage.getByRole('alertdialog').getByRole('button', { name: 'Delete card' }).click();
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['New light', 'Lounge']);
  // Its ⋮ Delete removes it, as Cancel does, without a dialog.
  await chooseMenuItem(sectionPage, 'New light', 'Delete');
  await expect(sectionPage.getByRole('alertdialog')).toHaveCount(0);
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['Lounge']);
  await expect(saveSections).toBeDisabled();
  await expect(sectionPage.getByText('Finish or remove the new card')).toHaveCount(0);
  // The inspector's Cancel removes a new card too.
  await sectionPage.getByRole('button', { name: 'Add card to Garden' }).click();
  await expect(
    sectionArea('garden').getByRole('button', { name: 'Select New light' }),
  ).toBeVisible();
  await sectionPage.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(sectionPage.getByRole('button', { name: 'Select New light' })).toHaveCount(0);
  // And it can be finished: pick an entity, press Add card, and the gate lifts.
  await sectionPage.getByRole('button', { name: 'Add card to Garden' }).click();
  await sectionPage.getByLabel('Home Assistant entity').click();
  await sectionPage.getByPlaceholder('Search light by name or ID').fill('Kitchen');
  await sectionPage.getByRole('option', { name: /Kitchen Lights/ }).click();
  await sectionPage.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(
    sectionArea('garden').getByRole('button', { name: 'Select light.kitchen' }),
  ).toBeVisible();
  await expect(
    sectionPage.locator('[data-canvas-island]').getByText('Choose an entity'),
  ).toHaveCount(0);

  // Sections: add one, which is named in the inspector, which takes focus.
  await sectionPage.getByRole('button', { name: '+ Section' }).click();
  const sectionName = sectionPage.getByLabel('Section name');
  await expect(sectionName).toBeFocused();
  await expect(sectionName).toHaveValue('New section');
  await sectionName.fill('Evening');
  await expect(sectionPage.getByRole('button', { name: 'Edit section Evening' })).toBeVisible();
  assert.deepEqual(await headings(), ['Kitchen', 'Garden', 'Evening']);

  // A section heading has a pencil, a drag handle and a ⋮ menu on hover.
  const sectionMenu = async (name, item) => {
    await sectionPage.getByRole('button', { name: `Select section ${name}`, exact: true }).hover();
    await sectionPage
      .getByRole('button', { name: `More actions for section ${name}`, exact: true })
      .click();
    await sectionPage.getByRole('menuitem', { name: item, exact: true }).click();
  };
  await sectionPage.getByRole('button', { name: 'Select section Evening', exact: true }).hover();
  await sectionPage
    .getByRole('button', { name: 'More actions for section Evening', exact: true })
    .click();
  await expect(sectionPage.getByRole('menuitem')).toHaveText([
    'Rename',
    'Move up',
    'Move down',
    'Delete',
  ]);
  await expect(sectionPage.getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
  await screenshot(sectionPage, 'admin-section-menu.png');
  await sectionPage.getByRole('menuitem', { name: 'Move up' }).click();
  assert.deepEqual(await headings(), ['Kitchen', 'Evening', 'Garden']);
  await expect(
    sectionPage.getByRole('button', { name: 'Edit section Kitchen', exact: true }),
  ).toBeVisible();

  // Rename from the menu selects the section and puts the cursor in its name.
  await sectionMenu('Kitchen', 'Rename');
  await expect(sectionName).toBeFocused();
  await expect(sectionName).toHaveValue('Kitchen');

  // Sections are reordered by dragging the handle in the heading.
  await sectionPage.getByRole('button', { name: 'Select section Kitchen', exact: true }).hover();
  const handle = sectionPage.getByRole('button', { name: 'Drag section Kitchen', exact: true });
  const garden = await sectionArea('garden').boundingBox();
  await dragTo(sectionPage, center(await handle.boundingBox()), {
    x: garden.x + 200,
    y: garden.y + garden.height - 10,
  });
  assert.deepEqual(await headings(), ['Evening', 'Garden', 'Kitchen']);
  assert.deepEqual(await areaNames(sectionPage, 'kitchen'), ['Lounge']);

  // Deleting a section with cards asks what to do with them.
  await sectionMenu('Kitchen', 'Delete');
  const sectionDialog = sectionPage.getByRole('alertdialog', { name: 'Delete this section?' });
  await expect(sectionDialog).toBeVisible();
  await expect(
    sectionDialog.getByRole('button', { name: 'Delete section and cards' }),
  ).toBeVisible();
  await sectionDialog.getByRole('button', { name: 'Keep cards' }).click();
  await expect(sectionPage.getByRole('button', { name: 'Edit section Kitchen' })).toHaveCount(0);
  await expect(selectLayer('Lounge')).toBeVisible();
  assert.deepEqual(await headings(), ['Evening', 'Garden']);

  // Save, then check the saved JSON and its round trip through the JSON page.
  await expect(saveSections).toBeEnabled();
  await saveSections.click();
  await expect.poll(() => saveCount).toBeGreaterThan(savesBefore);
  assert.equal(
    savedConfig.views[0].cards.some((card) => card.incomplete),
    false,
  );
  assert.deepEqual(
    savedConfig.views[0].sections.map((section) => [
      section.id.startsWith('section-') ? 'new' : section.id,
      section.title,
      section.cards.map((card) => card.name ?? card.entity),
    ]),
    [
      ['new', 'Evening', []],
      ['garden', 'Garden', ['light.kitchen']],
    ],
  );
  assert.deepEqual(
    savedConfig.views[0].cards.map((card) => card.name ?? card.type),
    ['Hall temp', 'climate', 'Lounge'],
  );
  assert.equal(cardTotal(savedConfig), cardsSavedBefore + 1);
  await sectionPage.getByRole('button', { name: 'JSON import / export', exact: true }).click();
  const sectionJson = sectionPage.getByRole('textbox', { name: 'Dashboard JSON' });
  const exported = JSON.parse(await sectionJson.inputValue());
  assert.deepEqual(exported.views[0].sections, savedConfig.views[0].sections);
  exported.views[0].sections[1].title = 'Terrace';
  await sectionJson.fill(JSON.stringify(exported, null, 2));
  await sectionPage.getByRole('button', { name: 'Editor', exact: true }).click();
  await sectionPage
    .getByRole('alertdialog', { name: 'Unapplied JSON changes' })
    .getByRole('button', { name: 'Validate and apply' })
    .click();
  await expect(sectionPage.getByRole('button', { name: 'Edit section Terrace' })).toBeVisible();
  await sectionPage.close();
  savedConfig = structuredClone(config);

  // Sizes are honest in the preview too: it follows its own width, exactly as the tablet does.
  savedConfig = {
    schemaVersion: 1,
    views: [
      {
        id: 'home',
        title: 'Home',
        badges: [],
        cards: [
          { type: 'clock', name: 'Quarter one' },
          { type: 'clock', name: 'Quarter two' },
          { type: 'clock', name: 'Quarter three' },
          { type: 'clock', name: 'Half one', size: 'half' },
          { type: 'clock', name: 'Half two', size: 'half' },
          { type: 'clock', name: 'Full row', size: 'full' },
        ],
      },
    ],
  };
  const widthPage = await openPage({ width: 1440, height: 1000 });
  await expect(widthPage.getByRole('button', { name: 'Select Full row' })).toBeVisible();
  const clockBoxes = () =>
    widthPage.locator('[data-editor-area=""] [data-editor-card]').evaluateAll((cells) =>
      cells.map((cell) => ({
        y: Math.round(cell.getBoundingClientRect().y),
        w: cell.getBoundingClientRect().width,
      })),
    );
  const seen = new Set();
  for (const width of [1440, 1280, 1100]) {
    await widthPage.setViewportSize({ width, height: 1000 });
    await widthPage.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    const [one, two, three, halfOne, halfTwo, full] = await clockBoxes();
    const row = full.w;
    const rule = expectedQuarter(row);

    seen.add(rule);

    if (typeof rule === 'number') {
      assert.ok(one.y === two.y && two.y === three.y, `${width}: quarters share a row`);
      assert.ok(
        Math.abs(one.w * rule + 16 * (rule - 1) - row) <= 2,
        `${width}: a quarter is 1/${rule} of the row, as wide as a tile`,
      );
      assert.ok(one.w >= 185, `${width}: a quarter is at least 185px wide`);
      assert.ok(halfOne.y === halfTwo.y, `${width}: halves share a row`);
      assert.ok(Math.abs(halfOne.w * 2 + 16 - row) <= 2, `${width}: a half is a half`);
    } else if (rule === 'half') {
      // The quarters became halves, and the halves stay halves, so all five flow two to a row.
      for (const card of [one, two, three, halfOne, halfTwo]) {
        assert.ok(Math.abs(card.w * 2 + 16 - row) <= 2, `${width}: a collapsed quarter is a half`);
      }
    } else {
      assert.ok(Math.abs(one.w - row) <= 2, `${width}: a narrow preview gives each card the row`);
    }
  }
  assert.ok(seen.has(4) || seen.has(3), 'the wide preview shows true quarters');
  await widthPage.setViewportSize({ width: 1440, height: 1000 });
  await widthPage.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
  await screenshot(widthPage, 'admin-widths.png');
  await widthPage.close();
  savedConfig = structuredClone(config);

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
          'climate unit editing; the hover pencil and ⋮ menu replace the controls under cards',
          'temperature badge selection; a badge has a hover ⋮ menu and no delete button of its own',
          'weather card rows toggle',
          'badges: click to edit, menu move later, drag to reorder, duplicate and delete with confirmation',
          'a rejected save keeps the draft and shows an Alert, then a second save succeeds',
          'Save publishes the schema-v1 draft',
          'a new card is a draggable, deletable card of the canvas and blocks Save until finished',
          'sections: add, rename, reorder (menu and drag handle) and delete (keeping or deleting cards)',
          'SortableJS drag: lifted card, card-sized placeholder, Drop here zones, reorder within and across areas',
          'the card menu: edit, move to section, earlier, later, duplicate, delete; keyboard, Escape and outside click',
          'quarters stay as wide as a tile in the preview while tiles are three or four to a row',
          'sections round-trip through the saved dashboard and the JSON page',
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
