import type { ClimateBinding } from '../../climate/data/model';
import type { AppConfig } from '@everdash/contracts/config';
import type { CardConfig } from '../../accessories/data/model';
import { isEntity } from '../../../shared/home-assistant/entities';
import type {
  Entity,
  ResolvedAccessory,
  ResolvedCard,
  ResolvedDashboard,
  ResolvedSource,
  ResolvedWidget,
} from './types';

export { isEntity, isRecord } from '../../../shared/home-assistant/entities';
export function parseEntities(value: unknown): Entity[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid Home Assistant entity catalog.');
  }
  return value.filter(isEntity);
}
export function resolveSource(entityId: string, entities: readonly Entity[]): ResolvedSource {
  return {
    entityId,
    status: entities.some((entity) => entity.entity_id === entityId) ? 'resolved' : 'missing',
  };
}
/** Whether a card is drawn as a full-width widget rather than in the accessory grid. */
export function isWidget(card: ResolvedCard): card is ResolvedWidget {
  return (
    card.type === 'pstryk' ||
    card.type === 'weather' ||
    card.type === 'climate' ||
    (card.type === 'value' && card.template === 'hero')
  );
}

/** Toggle cards on switch or input_boolean entities are controls; binary sensors are read-only. */
export function isControlToggle(entityId: string): boolean {
  return entityId.startsWith('input_boolean.') || entityId.startsWith('switch.');
}
export type CardGroup =
  | { type: 'accessories'; cards: ResolvedAccessory[] }
  | { type: 'widgets'; cards: ResolvedWidget[] };
export function groupCards(cards: readonly ResolvedCard[]): CardGroup[] {
  const groups: CardGroup[] = [];
  for (const card of cards) {
    const last = groups[groups.length - 1];
    if (isWidget(card)) {
      if (last?.type === 'widgets') {
        last.cards.push(card);
      } else {
        groups.push({ type: 'widgets', cards: [card] });
      }
    } else {
      // Everything that is not a widget is an accessory-grid card (including tile and compact values).
      const accessory = card as ResolvedAccessory;
      if (last?.type === 'accessories') {
        last.cards.push(accessory);
      } else {
        groups.push({ type: 'accessories', cards: [accessory] });
      }
    }
  }
  return groups;
}
export function resolveDashboard(
  config: AppConfig,
  entities: readonly Entity[],
): ResolvedDashboard {
  const catalog = new Map(entities.map((entity) => [entity.entity_id, entity]));
  const displayName = (entity: string, name?: string) => {
    const friendly = catalog.get(entity)?.attributes.friendly_name;
    return name || (typeof friendly === 'string' && friendly.trim() ? friendly : entity);
  };
  const observations = new Set<string>();
  const controls = new Map<string, CardConfig>();
  const climates = new Map<string, ClimateBinding>();
  const views = config.views.map((view) => ({
    ...view,
    badges: view.badges.map((badge) => {
      observations.add(badge.entity);
      return { ...badge, name: displayName(badge.entity, badge.name) };
    }),
    cards: view.cards.map((card) => {
      const name =
        card.name ||
        (card.type === 'pstryk'
          ? 'Energy'
          : card.type === 'weather'
            ? 'Current weather'
            : displayName(card.entity));
      if (card.type === 'light' || card.type === 'outlet') {
        if (!controls.has(card.entity)) {
          controls.set(card.entity, {
            type: card.type,
            entityId: card.entity,
            name: card.name || card.entity,
            icon: card.icon,
            room: view.title,
          } as CardConfig);
        }
      } else if (card.type === 'toggle' && isControlToggle(card.entity)) {
        if (!controls.has(card.entity)) {
          controls.set(card.entity, {
            type: 'toggle',
            entityId: card.entity,
            name: card.name || card.entity,
            icon: card.icon,
            room: view.title,
          } as CardConfig);
        }
      } else if (card.type === 'climate') {
        if (!climates.has(card.entity)) {
          climates.set(card.entity, {
            entityId: card.entity,
            name: card.name || card.entity,
            temperatureUnit: card.temperatureUnit || '°C',
          });
        }
      } else {
        observations.add(card.entity);
        if (card.type === 'pstryk') {
          for (const id of [card.sellPrice, card.nextPrice, card.usage, card.schedule]) {
            if (id) {
              observations.add(id);
            }
          }
        }
      }
      return {
        ...card,
        defaultTitle: !card.name && (card.type === 'pstryk' || card.type === 'weather'),
        name,
        resolution: resolveSource(card.entity, entities),
      };
    }),
  }));
  if (config.sun) {
    observations.add(config.sun);
  }
  return {
    cards: Array.from(controls.values()),
    climates: Array.from(climates.values()),
    observationIds: Array.from(observations),
    sun: config.sun ? resolveSource(config.sun, entities) : undefined,
    views,
  };
}
