import type { IconName } from '../ui/iconNames';

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

export interface DashboardDocument extends HomeConfig {
  schemaVersion: 1;
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
