import { hasCardEntity, isCardEntity } from './cardDomains';
import type { AppConfig, BadgeConfig, CardConfig, ConfiguredCard, HomeConfig } from './types';
import type { IconName } from '../iconNames';

const icons: Record<
  Exclude<CardConfig['type'], 'value' | 'toggle'> | BadgeConfig['type'],
  IconName
> = {
  climate: 'thermometer',
  clock: 'sunrise',
  light: 'bulb',
  outlet: 'outlet',
  pstryk: 'plug',
  scene: 'sparkle',
  temperature: 'thermometer',
  weather: 'sun',
};

function validateEntity(entity: string, domain: string) {
  if (typeof entity !== 'string' || !new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(entity)) {
    throw new Error(`Invalid ${domain} entity: ${String(entity)}`);
  }
}

/** Checks a card's entities and fills in its default icon. */
function configureCard(card: CardConfig): ConfiguredCard {
  if (hasCardEntity(card) && !isCardEntity(card.type, card.entity)) {
    throw new Error(`Invalid ${card.type} entity: ${String(card.entity)}`);
  }

  if (card.type === 'pstryk') {
    for (const entity of [card.sellPrice, card.nextPrice, card.usage, card.schedule]) {
      if (entity !== undefined) {
        validateEntity(entity, 'sensor');
      }
    }
  }
  // Value and toggle cards keep an unset icon so the tablet can pick one from the device class.
  if (card.type === 'value' || card.type === 'toggle') {
    return { ...card };
  }

  return {
    ...card,
    icon:
      (card.type === 'light' || card.type === 'outlet' || card.type === 'scene') && card.icon
        ? card.icon
        : icons[card.type],
  };
}

/** Define the complete dashboard with typed cards and shared defaults. */
export function defineConfig(config: HomeConfig): AppConfig {
  if (!config.views.length) {
    throw new Error('Configure at least one view.');
  }
  const ids = new Set<string>();
  const polling = {
    controlsMs: 5000,
    metadataMs: 300000,
    observationsMs: 30000,
    ...config.polling,
  };
  for (const interval of Object.values(polling)) {
    if (!Number.isFinite(interval) || interval < 1000 || interval > 2_147_483_647) {
      throw new Error('Polling intervals must be finite milliseconds between 1000 and 2147483647.');
    }
  }
  if (config.timeZone) {
    new Intl.DateTimeFormat('en', { timeZone: config.timeZone }).format(0);
  }
  if (config.sun) {
    validateEntity(config.sun, 'sun');
  }
  const views = config.views.map((view) => {
    if (!view.id.trim()) {
      throw new Error('Each view needs a stable non-empty id.');
    }
    if (ids.has(view.id)) {
      throw new Error(`Duplicate view id: ${view.id}`);
    }
    ids.add(view.id);
    if (!view.title.trim()) {
      throw new Error(`View ${view.id} needs a title.`);
    }
    const badges = (view.badges || []).map((badge) => {
      validateEntity(badge.entity, 'sensor');
      return { ...badge, icon: badge.icon || icons.temperature };
    });
    const cards = (view.cards || []).map(configureCard);
    const sectionIds = new Set<string>();
    const sections = (view.sections || []).map((section) => {
      if (!section.id.trim()) {
        throw new Error(`View ${view.id} has a section without a stable non-empty id.`);
      }
      if (sectionIds.has(section.id)) {
        throw new Error(`Duplicate section id in view ${view.id}: ${section.id}`);
      }
      sectionIds.add(section.id);
      if (!section.title.trim()) {
        throw new Error(`Section ${section.id} needs a title.`);
      }
      return { ...section, cards: (section.cards || []).map(configureCard) };
    });
    return { ...view, badges, cards, sections };
  });
  return { ...config, polling, views };
}
