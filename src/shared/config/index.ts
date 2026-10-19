import type { IconName } from '../ui/Icon/Icon';

type EntityId<Domain extends string> = `${Domain}.${string}`;
interface DisplayOptions {
  name?: string;
  icon?: IconName;
}
export type AccessoryConfig = DisplayOptions &
  ({ type: 'light'; entity: EntityId<'light'> } | { type: 'outlet'; entity: EntityId<'switch'> });
export interface PstrykConfig extends Pick<DisplayOptions, 'name'> {
  type: 'pstryk';
  entity: EntityId<'sensor'>;
  sellPrice?: EntityId<'sensor'>;
  nextPrice?: EntityId<'sensor'>;
  usage?: EntityId<'sensor'>;
  schedule?: EntityId<'sensor'>;
}
export interface WeatherConfig extends Pick<DisplayOptions, 'name'> {
  type: 'weather';
  entity: EntityId<'weather'>;
}
export interface ClimateConfig extends Pick<DisplayOptions, 'name'> {
  type: 'climate';
  entity: EntityId<'climate'>;
  temperatureUnit?: '°C' | '°F';
}
export type CardConfig = AccessoryConfig | PstrykConfig | WeatherConfig | ClimateConfig;
export interface BadgeConfig extends DisplayOptions {
  type: 'temperature';
  entity: EntityId<'sensor'>;
}
export interface ViewConfig {
  id: string;
  title: string;
  badges?: readonly BadgeConfig[];
  cards?: readonly CardConfig[];
}
export interface PollingConfig {
  controlsMs: number;
  observationsMs: number;
  metadataMs: number;
}
export interface HomeConfig {
  timeZone?: string;
  sun?: EntityId<'sun'>;
  polling?: Partial<PollingConfig>;
  views: readonly ViewConfig[];
}
export type ConfiguredCard = CardConfig & { icon: IconName };
export type ConfiguredBadge = BadgeConfig & { icon: IconName };
export interface ConfiguredView extends Omit<ViewConfig, 'badges' | 'cards'> {
  badges: readonly ConfiguredBadge[];
  cards: readonly ConfiguredCard[];
}
export interface AppConfig extends Omit<HomeConfig, 'polling' | 'views'> {
  polling: PollingConfig;
  views: readonly ConfiguredView[];
}
const icons: Record<CardConfig['type'] | BadgeConfig['type'], IconName> = {
  climate: 'thermometer',
  light: 'bulb',
  outlet: 'outlet',
  pstryk: 'plug',
  temperature: 'thermometer',
  weather: 'sun',
};
function validateEntity(entity: string, domain: string) {
  if (typeof entity !== 'string' || !new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(entity)) {
    throw new Error(`Invalid ${domain} entity: ${String(entity)}`);
  }
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
    const cards = (view.cards || []).map((card) => {
      const domain =
        card.type === 'outlet' ? 'switch' : card.type === 'pstryk' ? 'sensor' : card.type;
      validateEntity(card.entity, domain);
      if (card.type === 'pstryk') {
        for (const entity of [card.sellPrice, card.nextPrice, card.usage, card.schedule]) {
          if (entity !== undefined) {
            validateEntity(entity, 'sensor');
          }
        }
      }
      return {
        ...card,
        icon:
          (card.type === 'light' || card.type === 'outlet') && card.icon
            ? card.icon
            : icons[card.type],
      };
    });
    return { ...view, badges, cards };
  });
  return { ...config, polling, views };
}
