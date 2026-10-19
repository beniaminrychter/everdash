import assert from 'node:assert/strict';
import test from 'node:test';
import { createTranslator, translateMessage, formatNumber } from '../src/shared/i18n/index';

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
