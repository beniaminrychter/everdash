import type {
  ConfiguredBadge,
  ConfiguredCard,
  ConfiguredSection,
  ConfiguredView,
} from '@everdash/contracts/config';
import type { ClimateBinding } from '../../climate/data/model';
import type { CardConfig } from '../../accessories/data/model';

export interface ResolvedSource {
  status: 'resolved' | 'missing';
  entityId: string;
}
type Resolved<Card> = Card & { name: string; defaultTitle?: boolean };
/** Cards bound to an entity record how it resolved; a clock has no entity to resolve. */
export type ResolvedCard = ConfiguredCard extends infer Card
  ? Card extends { type: 'clock' }
    ? Resolved<Card>
    : Resolved<Card> & { resolution: ResolvedSource }
  : never;
/** Cards drawn in the accessory grid. A hero value card is a widget instead. */
export type ResolvedAccessory = Extract<
  ResolvedCard,
  { type: 'light' | 'outlet' | 'toggle' | 'scene' | 'value' }
>;
export type ResolvedWidget = Extract<
  ResolvedCard,
  { type: 'pstryk' | 'weather' | 'clock' | 'climate' | 'value' }
>;
export interface ResolvedSection extends Omit<ConfiguredSection, 'cards'> {
  cards: readonly ResolvedCard[];
}
export interface ResolvedView extends Omit<ConfiguredView, 'cards' | 'badges' | 'sections'> {
  cards: readonly ResolvedCard[];
  sections: readonly ResolvedSection[];
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
