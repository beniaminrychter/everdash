import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createTranslator,
  formatNumber,
  resolveLanguage,
  setLocale,
  translateMessage,
} from '@everdash/ui/i18n/index';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { buildApp } from '../apps/server/src/app';
import { ConfigRepository } from '../apps/server/src/config/repository';
import {
  extractHomeAssistantLanguage,
  readHomeAssistantLanguage,
} from '../apps/server/src/home-assistant/language';

test('Polish translates app text and interpolates configured names without translating them', () => {
  const t = createTranslator('pl');
  assert.equal(t('Energy'), 'Energia');
  assert.equal(t('Settings'), 'Ustawienia');
  assert.equal(t('Adjust {name}', { name: 'Living room' }), 'Dostosuj Living room');
  assert.equal(createTranslator('en')('Adjust {name}', { name: 'Salon' }), 'Adjust Salon');
});

test('localized numbers preserve fixed precision, including zero and negative prices', () => {
  assert.equal(formatNumber(21, 1, 'pl-PL'), '21,0');
  assert.equal(formatNumber(-0.1, 2, 'pl-PL'), '-0,10');
  assert.equal(formatNumber(0, 2, 'en-GB'), '0.00');
});

test('service failures translate at the UI boundary without changing entity names or HTTP codes', () => {
  const t = createTranslator('pl');
  assert.equal(
    translateMessage('Couldn’t update Living room.', t),
    'Nie udało się zaktualizować Living room.',
  );
  assert.equal(
    translateMessage('Home Assistant request failed (HTTP 503).', t),
    'Błąd zapytania do Home Assistant (HTTP 503).',
  );
});

test('Paraglide message functions translate admin, editor, and tablet strings in English and Polish', () => {
  try {
    setLocale('en', { reload: false });
    assert.equal(m.admin_route_editor(), 'Editor');
    assert.equal(m.admin_route_settings(), 'Dashboard settings');
    assert.equal(m.editor_move_earlier(), 'Move earlier');
    assert.equal(m.tablet_energy(), 'Energy');
    assert.equal(m.admin_view_delete_title({ title: 'Home' }), 'Delete “Home”?');

    setLocale('pl', { reload: false });
    assert.equal(m.admin_route_editor(), 'Edytor');
    assert.equal(m.admin_route_settings(), 'Ustawienia pulpitu');
    assert.equal(m.editor_move_earlier(), 'Przesuń wcześniej');
    assert.equal(m.tablet_energy(), 'Energia');
    assert.equal(m.admin_view_delete_title({ title: 'Dom' }), 'Usunąć „Dom”?');

    // Explicit locale override works regardless of active global locale.
    assert.equal(m.admin_route_editor({}, { locale: 'en' }), 'Editor');
    assert.equal(m.admin_route_editor({}, { locale: 'pl' }), 'Edytor');
  } finally {
    setLocale('en', { reload: false });
  }
});

test('resolveLanguage maps Polish locales to pl and falls back to en for unsupported values', () => {
  assert.equal(resolveLanguage('pl'), 'pl');
  assert.equal(resolveLanguage('pl-PL'), 'pl');
  assert.equal(resolveLanguage('PL_PL'), 'pl');
  assert.equal(resolveLanguage(' pl '), 'pl');
  assert.equal(resolveLanguage('en'), 'en');
  assert.equal(resolveLanguage('en-GB'), 'en');
  assert.equal(resolveLanguage('de'), 'en');
  assert.equal(resolveLanguage('fr-FR'), 'en');
  assert.equal(resolveLanguage(''), 'en');
  assert.equal(resolveLanguage(null), 'en');
  assert.equal(resolveLanguage(undefined), 'en');
});

test('extractHomeAssistantLanguage and readHomeAssistantLanguage handle valid, missing, and failing responses', async () => {
  assert.equal(extractHomeAssistantLanguage({ language: 'pl' }), 'pl');
  assert.equal(extractHomeAssistantLanguage({ language: ' pl-PL ' }), 'pl-PL');
  assert.equal(extractHomeAssistantLanguage({ language: '   ' }), undefined);
  assert.equal(extractHomeAssistantLanguage({}), undefined);
  assert.equal(extractHomeAssistantLanguage(null), undefined);
  assert.equal(extractHomeAssistantLanguage(['pl']), undefined);

  assert.equal(
    await readHomeAssistantLanguage({
      getState: async () => ({}),
      getStates: async () => [],
      getConfig: async () => ({ language: 'pl' }),
      callService: async () => null,
    }),
    'pl',
  );
  assert.equal(
    await readHomeAssistantLanguage({
      getState: async () => ({}),
      getStates: async () => [],
      getConfig: async () => {
        throw new Error('upstream unreachable');
      },
      callService: async () => null,
    }),
    undefined,
  );
  assert.equal(
    await readHomeAssistantLanguage({
      getState: async () => ({}),
      getStates: async () => [],
      callService: async () => null,
    }),
    undefined,
  );
});

test('/api/manage/auth/session and /api/bootstrap expose Home Assistant language when available', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'everdash-ha-lang-'));
  let haConfig: unknown = { language: 'pl' };
  const app = await buildApp({
    config: new ConfigRepository({ directory }),
    access: { isAdmin: () => true, isTablet: () => true },
    oauth: {
      status: () => ({ state: 'connected', origin: 'http://ha.local:8123' }),
      readSession: () => null,
      begin: () => {
        throw new Error('unused');
      },
      complete: async () => {
        throw new Error('unused');
      },
      checkReachable: async () => undefined,
      disconnect: async () => ({ clearAdminCookie: '' }),
      logout: () => ({ clearAdminCookie: '' }),
      discover: async () => [],
    } as never,
    homeAssistant: {
      getState: async () => ({}),
      getStates: async () => [],
      getConfig: async () => haConfig,
      callService: async () => null,
    },
  });

  try {
    const session = await app.inject('/api/manage/auth/session');
    assert.equal(session.statusCode, 200);
    assert.equal(session.json().language, 'pl');

    const bootstrap = await app.inject('/api/bootstrap');
    assert.equal(bootstrap.statusCode, 200);
    assert.equal(bootstrap.json().language, 'pl');

    // When HA config omits language, the field is omitted cleanly.
    haConfig = { location_name: 'Home' };
    const sessionWithoutLang = await app.inject('/api/manage/auth/session');
    assert.equal('language' in sessionWithoutLang.json(), false);

    const bootstrapWithoutLang = await app.inject('/api/bootstrap');
    assert.equal('language' in bootstrapWithoutLang.json(), false);
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
