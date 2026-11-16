import type { IconName } from '../iconNames';
import type { CardSize } from './cardSize';
import type { ForecastType } from './weatherForecast';

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
  /** Defaults to 'full'. */
  size?: CardSize;
  /** Defaults to 'hourly'. */
  forecast?: ForecastType;
}

export type ClockDisplay = 'time' | 'date' | 'datetime';

/** Shows the device's own time and date, so it has no Home Assistant entity. */
export interface ClockConfig extends Pick<DisplayOptions, 'name'> {
  type: 'clock';
  /** Defaults to 'datetime'. */
  display?: ClockDisplay;
  /** Defaults to 'quarter'. */
  size?: CardSize;
}

export interface ClimateConfig extends Pick<DisplayOptions, 'name'> {
  type: 'climate';
  entity: EntityId<'climate'>;
  temperatureUnit?: '°C' | '°F';
}

export type ValueTemplate = 'tile' | 'hero' | 'compact';

export interface ValueConfig extends DisplayOptions {
  type: 'value';
  entity: EntityId<'sensor'> | EntityId<'input_number'>;
  /** Defaults to 'tile'. */
  template?: ValueTemplate;
  /** Overrides the entity's unit_of_measurement, at most 12 characters. */
  unit?: string;
  /** Decimal places from 0 to 3. Defaults to the standard sensor formatting. */
  precision?: number;
}

export interface ToggleConfig extends DisplayOptions {
  type: 'toggle';
  entity: EntityId<'input_boolean'> | EntityId<'switch'> | EntityId<'binary_sensor'>;
}

export interface SceneConfig extends DisplayOptions {
  type: 'scene';
  entity: EntityId<'scene'> | EntityId<'script'>;
}

export type CardConfig =
  | AccessoryConfig
  | PstrykConfig
  | WeatherConfig
  | ClockConfig
  | ClimateConfig
  | ValueConfig
  | ToggleConfig
  | SceneConfig;

/** Cards bound to a Home Assistant entity; the clock is the only card without one. */
export type EntityCardConfig = Exclude<CardConfig, ClockConfig>;

export interface BadgeConfig extends DisplayOptions {
  type: 'temperature';
  entity: EntityId<'sensor'>;
}

/** A titled group of cards inside a view. Sections follow the view's own cards, in order. */
export interface SectionConfig {
  /** Stable and unique within its view. */
  id: string;
  title: string;
  cards?: readonly CardConfig[];
}

export interface ViewConfig {
  id: string;
  title: string;
  badges?: readonly BadgeConfig[];
  /** Cards outside any section, shown first. */
  cards?: readonly CardConfig[];
  sections?: readonly SectionConfig[];
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

/** Value and toggle cards may leave the icon unset, meaning it is chosen from the entity's device class. */
type WithIcon<Card> = Card extends { type: 'value' | 'toggle' } ? Card : Card & { icon: IconName };
export type ConfiguredCard = WithIcon<CardConfig>;
export type ConfiguredBadge = BadgeConfig & { icon: IconName };

export interface ConfiguredSection extends Omit<SectionConfig, 'cards'> {
  cards: readonly ConfiguredCard[];
}

export interface ConfiguredView extends Omit<ViewConfig, 'badges' | 'cards' | 'sections'> {
  badges: readonly ConfiguredBadge[];
  cards: readonly ConfiguredCard[];
  sections: readonly ConfiguredSection[];
}

export interface AppConfig extends Omit<HomeConfig, 'polling' | 'views'> {
  polling: PollingConfig;
  views: readonly ConfiguredView[];
}
