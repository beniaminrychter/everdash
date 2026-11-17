import { cardEntityDomains, isCardEntity } from './cardDomains';
import { isCardRows } from './cardRows';
import { isCardSize } from './cardSize';
import { isForecastType } from './weatherForecast';
import { defineConfig } from './normalize';
import type { AppConfig, CardConfig, DashboardDocument, HomeConfig } from './types';
import { iconNames } from '../iconNames';

export interface ConfigIssue {
  path: string;
  message: string;
}

export type DashboardValidation =
  | { ok: true; document: DashboardDocument; config: AppConfig }
  | { ok: false; issues: ConfigIssue[] };

const rootKeys = ['schemaVersion', 'timeZone', 'sun', 'polling', 'views'];
const pollingKeys = ['controlsMs', 'observationsMs', 'metadataMs'];
const viewKeys = ['id', 'title', 'badges', 'cards', 'sections'];
const sectionKeys = ['id', 'title', 'cards'];
const cardKeys: Record<string, string[]> = {
  clock: ['type', 'name', 'display', 'size'],
  climate: ['type', 'entity', 'name', 'temperatureUnit'],
  light: ['type', 'entity', 'name', 'icon'],
  outlet: ['type', 'entity', 'name', 'icon'],
  pstryk: ['type', 'entity', 'name', 'sellPrice', 'nextPrice', 'usage', 'schedule'],
  scene: ['type', 'entity', 'name', 'icon'],
  toggle: ['type', 'entity', 'name', 'icon'],
  value: ['type', 'entity', 'name', 'icon', 'template', 'unit', 'precision'],
  weather: ['type', 'entity', 'name', 'size', 'rows', 'forecast'],
};
const iconCardTypes = new Set(['light', 'outlet', 'value', 'toggle', 'scene']);
const valueTemplates = new Set(['tile', 'hero', 'compact']);
const clockDisplays = new Set(['time', 'date', 'datetime']);
const iconSet = new Set<string>(iconNames);

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.codePointAt(index) ?? 0;
    if (code < 32 || code === 127) {
      return true;
    }
  }

  return false;
}

/** A unit may be empty (hide it) but never only whitespace, nor contain control characters. */
function isValidUnit(unit: unknown): boolean {
  return (
    typeof unit === 'string' &&
    unit.length <= 12 &&
    (unit === '' || unit.trim() !== '') &&
    !hasControlCharacter(unit)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: ConfigIssue[],
) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({ path: path ? `${path}.${key}` : key, message: 'Unknown field.' });
    }
  }
}

function validateEntity(
  value: unknown,
  domain: string,
  path: string,
  issues: ConfigIssue[],
): value is string {
  if (typeof value !== 'string' || !new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(value)) {
    issues.push({ path, message: `Expected an entity ID in the ${domain} domain.` });
    return false;
  }
  return true;
}

function validateOptionalText(
  value: unknown,
  path: string,
  issues: ConfigIssue[],
): value is string | undefined {
  if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
    issues.push({ path, message: 'Expected a non-empty string.' });
    return false;
  }
  return true;
}

function validateCards(cards: unknown, path: string, issues: ConfigIssue[]) {
  if (cards === undefined) {
    return;
  }
  if (!Array.isArray(cards)) {
    issues.push({ path, message: 'Expected an array.' });
    return;
  }
  cards.forEach((card, cardIndex) => {
    const cardPath = `${path}[${cardIndex}]`;
    if (!isRecord(card)) {
      issues.push({ path: cardPath, message: 'Expected an object.' });
      return;
    }
    if (typeof card.type !== 'string' || !cardKeys[card.type]) {
      issues.push({ path: `${cardPath}.type`, message: 'Unknown card type.' });
      return;
    }
    addUnknownKeys(card, cardKeys[card.type], cardPath, issues);
    if (
      cardEntityDomains(card.type as CardConfig['type']).length > 0 &&
      !isCardEntity(card.type as CardConfig['type'], card.entity)
    ) {
      issues.push({
        path: `${cardPath}.entity`,
        message: `Expected an entity ID in the ${cardEntityDomains(card.type as CardConfig['type']).join(' or ')} domain.`,
      });
    }
    validateOptionalText(card.name, `${cardPath}.name`, issues);
    if (cardKeys[card.type].includes('size') && card.size !== undefined && !isCardSize(card.size)) {
      issues.push({
        path: `${cardPath}.size`,
        message: 'Expected quarter, half or full.',
      });
    }
    if (cardKeys[card.type].includes('rows') && card.rows !== undefined && !isCardRows(card.rows)) {
      issues.push({
        path: `${cardPath}.rows`,
        message: 'Expected 1 or 2.',
      });
    }
    if (card.type === 'weather' && card.forecast !== undefined && !isForecastType(card.forecast)) {
      issues.push({
        path: `${cardPath}.forecast`,
        message: 'Expected hourly or daily.',
      });
    }
    if (
      card.type === 'clock' &&
      card.display !== undefined &&
      !clockDisplays.has(String(card.display))
    ) {
      issues.push({
        path: `${cardPath}.display`,
        message: 'Expected time, date or datetime.',
      });
    }
    if (iconCardTypes.has(card.type)) {
      validateOptionalText(card.icon, `${cardPath}.icon`, issues);
      if (card.icon !== undefined && !iconSet.has(String(card.icon))) {
        issues.push({ path: `${cardPath}.icon`, message: 'Unknown icon.' });
      }
    }
    if (
      card.type === 'climate' &&
      card.temperatureUnit !== undefined &&
      card.temperatureUnit !== '°C' &&
      card.temperatureUnit !== '°F'
    ) {
      issues.push({
        path: `${cardPath}.temperatureUnit`,
        message: 'Expected °C or °F.',
      });
    }
    if (card.type === 'value') {
      if (card.template !== undefined && !valueTemplates.has(String(card.template))) {
        issues.push({
          path: `${cardPath}.template`,
          message: 'Expected tile, compact or hero.',
        });
      }
      if (card.unit !== undefined && !isValidUnit(card.unit)) {
        issues.push({
          path: `${cardPath}.unit`,
          message:
            'Expected a unit of at most 12 printable characters, or an empty string to hide it.',
        });
      }
      if (
        card.precision !== undefined &&
        (typeof card.precision !== 'number' ||
          !Number.isInteger(card.precision) ||
          card.precision < 0 ||
          card.precision > 3)
      ) {
        issues.push({
          path: `${cardPath}.precision`,
          message: 'Expected a whole number from 0 to 3.',
        });
      }
    }
    if (card.type === 'pstryk') {
      for (const field of ['sellPrice', 'nextPrice', 'usage', 'schedule']) {
        if (card[field] !== undefined) {
          validateEntity(card[field], 'sensor', `${cardPath}.${field}`, issues);
        }
      }
    }
  });
}

function validateSections(sections: unknown, path: string, issues: ConfigIssue[]) {
  if (sections === undefined) {
    return;
  }
  if (!Array.isArray(sections)) {
    issues.push({ path, message: 'Expected an array.' });
    return;
  }
  const ids = new Set<string>();
  sections.forEach((section, sectionIndex) => {
    const sectionPath = `${path}[${sectionIndex}]`;
    if (!isRecord(section)) {
      issues.push({ path: sectionPath, message: 'Expected an object.' });
      return;
    }
    addUnknownKeys(section, sectionKeys, sectionPath, issues);
    for (const field of ['id', 'title']) {
      if (typeof section[field] !== 'string' || !section[field].trim()) {
        issues.push({ path: `${sectionPath}.${field}`, message: 'Expected a non-empty string.' });
      }
    }
    if (typeof section.id === 'string' && section.id.trim()) {
      if (ids.has(section.id)) {
        issues.push({
          path: `${sectionPath}.id`,
          message: 'Section IDs must be unique within a view.',
        });
      }
      ids.add(section.id);
    }
    validateCards(section.cards, `${sectionPath}.cards`, issues);
  });
}

export function validateDashboard(input: unknown): DashboardValidation {
  const issues: ConfigIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: '', message: 'Expected a JSON object.' }] };
  }

  addUnknownKeys(input, rootKeys, '', issues);
  if (input.schemaVersion !== 1) {
    issues.push({ path: 'schemaVersion', message: 'Only schema version 1 is supported.' });
  }
  if (input.timeZone !== undefined && typeof input.timeZone !== 'string') {
    issues.push({ path: 'timeZone', message: 'Expected an IANA timezone string.' });
  } else if (typeof input.timeZone === 'string') {
    try {
      new Intl.DateTimeFormat('en', { timeZone: input.timeZone }).format(0);
    } catch {
      issues.push({ path: 'timeZone', message: 'Expected a valid IANA timezone.' });
    }
  }
  if (input.sun !== undefined) {
    validateEntity(input.sun, 'sun', 'sun', issues);
  }

  if (input.polling !== undefined) {
    if (!isRecord(input.polling)) {
      issues.push({ path: 'polling', message: 'Expected an object.' });
    } else {
      addUnknownKeys(input.polling, pollingKeys, 'polling', issues);
      for (const key of pollingKeys) {
        const interval = input.polling[key];
        if (
          interval !== undefined &&
          (typeof interval !== 'number' ||
            !Number.isFinite(interval) ||
            interval < 1000 ||
            interval > 2_147_483_647)
        ) {
          issues.push({
            path: `polling.${key}`,
            message: 'Expected milliseconds between 1000 and 2147483647.',
          });
        }
      }
    }
  }

  if (!Array.isArray(input.views) || input.views.length === 0) {
    issues.push({ path: 'views', message: 'Configure at least one view.' });
  } else {
    const viewIds = new Set<string>();
    input.views.forEach((view, viewIndex) => {
      const viewPath = `views[${viewIndex}]`;
      if (!isRecord(view)) {
        issues.push({ path: viewPath, message: 'Expected an object.' });
        return;
      }
      addUnknownKeys(view, viewKeys, viewPath, issues);
      for (const field of ['id', 'title']) {
        if (typeof view[field] !== 'string' || !view[field].trim()) {
          issues.push({ path: `${viewPath}.${field}`, message: 'Expected a non-empty string.' });
        }
      }
      if (typeof view.id === 'string' && view.id.trim()) {
        if (viewIds.has(view.id)) {
          issues.push({ path: `${viewPath}.id`, message: 'View IDs must be unique.' });
        }
        viewIds.add(view.id);
      }

      if (view.badges !== undefined) {
        if (!Array.isArray(view.badges)) {
          issues.push({ path: `${viewPath}.badges`, message: 'Expected an array.' });
        } else {
          view.badges.forEach((badge, badgeIndex) => {
            const badgePath = `${viewPath}.badges[${badgeIndex}]`;
            if (!isRecord(badge)) {
              issues.push({ path: badgePath, message: 'Expected an object.' });
              return;
            }
            addUnknownKeys(badge, ['type', 'entity', 'name', 'icon'], badgePath, issues);
            if (badge.type !== 'temperature') {
              issues.push({ path: `${badgePath}.type`, message: 'Expected temperature.' });
            }
            validateEntity(badge.entity, 'sensor', `${badgePath}.entity`, issues);
            validateOptionalText(badge.name, `${badgePath}.name`, issues);
            validateOptionalText(badge.icon, `${badgePath}.icon`, issues);
            if (badge.icon !== undefined && !iconSet.has(String(badge.icon))) {
              issues.push({ path: `${badgePath}.icon`, message: 'Unknown icon.' });
            }
          });
        }
      }

      validateCards(view.cards, `${viewPath}.cards`, issues);
      validateSections(view.sections, `${viewPath}.sections`, issues);
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  try {
    const source = { ...input } as unknown as DashboardDocument;
    const { schemaVersion: _schemaVersion, ...homeConfig } = source;
    const config = defineConfig(homeConfig as HomeConfig);
    return {
      ok: true,
      document: { ...source, polling: config.polling },
      config,
    };
  } catch (error) {
    return {
      ok: false,
      issues: [{ path: '', message: error instanceof Error ? error.message : 'Invalid config.' }],
    };
  }
}
