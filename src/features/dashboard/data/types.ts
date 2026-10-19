import type { ConfiguredBadge, ConfiguredCard, ConfiguredView } from '../../../shared/config';
import type { ClimateBinding } from '../../climate/data/model';
import type { CardConfig } from '../../accessories/data/model';

export interface ResolvedSource {
  status: 'resolved' | 'missing';
  entityId: string;
}
export type ResolvedCard = ConfiguredCard & {
  name: string;
  defaultTitle?: boolean;
  resolution: ResolvedSource;
};
export type ResolvedAccessory = Extract<ResolvedCard, { type: 'light' | 'outlet' }>;
export type ResolvedWidget = Exclude<ResolvedCard, ResolvedAccessory>;
export interface ResolvedView extends Omit<ConfiguredView, 'cards' | 'badges'> {
  cards: readonly ResolvedCard[];
  badges: readonly (ConfiguredBadge & { name: string })[];
}
export interface ResolvedDashboard {
  views: readonly ResolvedView[];
  cards: readonly CardConfig[];
  climates: readonly ClimateBinding[];
  sun?: ResolvedSource;
  observationIds: readonly string[];
}
export type { Entity, EntityReadings } from '../../../shared/home-assistant/entities';
