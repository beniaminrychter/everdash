import {
  cardEntityDomains,
  hasCardEntity,
  isCardEntity,
} from '@everdash/contracts/config/cardDomains';
import type {
  CardConfig,
  DashboardDocument,
  SectionConfig,
  ViewConfig,
} from '@everdash/contracts/config/types';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';

export type CardKind = CardConfig['type'];

export interface CardEditorMessage {
  type: `everdash.editor.card.${'edit' | 'delete' | 'move'}`;
  nonce: string;
  generation: number;
  viewId: string;
  /** The section the card is in; null or omitted for the cards outside any section. */
  section?: string | null;
  index: number;
  /** A move names its destination as an offset from the card or as a target index. */
  offset?: number;
  to?: number;
  /** The section a move to `to` ends in; the card's own section when omitted. */
  toSection?: string | null;
}

export function isCardEditorMessage(
  value: unknown,
  nonce: string,
  generation: number,
  viewId: string,
  cardCount: number,
): value is CardEditorMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const message = value as Partial<CardEditorMessage>;
  return (
    typeof message.type === 'string' &&
    /^everdash\.editor\.card\.(edit|delete|move)$/.test(message.type) &&
    message.nonce === nonce &&
    message.generation === generation &&
    message.viewId === viewId &&
    Number.isInteger(message.index) &&
    message.index! >= 0 &&
    message.index! < cardCount &&
    (message.type !== 'everdash.editor.card.move' ||
      Number.isInteger(message.offset) ||
      (Number.isInteger(message.to) && message.to! >= 0 && message.to! < cardCount))
  );
}

export function moveItem<T>(items: readonly T[], index: number, offset: -1 | 1): T[] {
  const destination = index + offset;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) {
    return [...items];
  }
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function createView(id: string, title: string): ViewConfig {
  return { id, title, cards: [], badges: [] };
}

/** A new empty section for the view, with an id no other section of the view uses. */
export function createSection(view: ViewConfig): SectionConfig {
  const taken = new Set((view.sections ?? []).map((section) => section.id));
  let id = `section-${Date.now().toString(36)}`;

  while (taken.has(id)) {
    id = `${id}-1`;
  }

  return { id, title: m.admin_default_new_section(), cards: [] };
}

export function createCard(type: CardKind): CardConfig {
  switch (type) {
    case 'light': {
      return { type, entity: 'light.select_entity' };
    }
    case 'outlet': {
      return { type, entity: 'switch.select_entity' };
    }
    case 'climate': {
      return { type, entity: 'climate.select_entity' };
    }
    case 'weather': {
      return { type, entity: 'weather.select_entity' };
    }
    case 'clock': {
      return { type };
    }
    case 'pstryk': {
      return { type, entity: 'sensor.select_entity' };
    }
    case 'value': {
      return { type, entity: 'sensor.select_entity' };
    }
    case 'toggle': {
      return { type, entity: 'input_boolean.select_entity' };
    }
    case 'scene': {
      return { type, entity: 'scene.select_entity' };
    }
    default: {
      throw new Error(`Unsupported card type: ${String(type)}`);
    }
  }
}

/** A card the user is still adding: an entity card starts with no entity chosen. */
export function createPendingCard(type: CardKind): CardConfig {
  const card = createCard(type);

  // The empty entity is deliberately invalid until one is picked.
  return hasCardEntity(card) ? ({ ...card, entity: '' } as unknown as CardConfig) : card;
}

/** The entity a card of this type shows in the preview until a real one is chosen. */
export function placeholderEntity(type: CardKind): string {
  const card = createCard(type);

  return hasCardEntity(card) ? card.entity : '';
}

export function createConfiguredCard(type: CardKind, entity: string): CardConfig {
  if (cardEntityDomains(type).length === 0) {
    return createCard(type);
  }

  if (!isCardEntity(type, entity)) {
    throw new Error(
      `Choose a valid ${cardEntityDomains(type).join(' or ')} entity before adding the card.`,
    );
  }
  return { ...createCard(type), entity } as CardConfig;
}

/** Turns a card into another type, keeping its name and its entity when the new type accepts it. */
export function convertCard(card: CardConfig, type: CardKind): CardConfig {
  if (card.type === type) {
    return card;
  }

  const name = card.name ? { name: card.name } : {};

  if (cardEntityDomains(type).length === 0) {
    return { ...createCard(type), ...name } as CardConfig;
  }

  const entity = hasCardEntity(card) && isCardEntity(type, card.entity) ? card.entity : '';

  return { ...createCard(type), entity, ...name } as CardConfig;
}

/** Card types that accept an entity, so an existing card can switch type without becoming invalid. */
export function compatibleCardKinds(entity: string, kinds: readonly CardKind[]): CardKind[] {
  return kinds.filter((kind) => isCardEntity(kind, entity));
}

export function toDocument(value: DashboardDocument): DashboardDocument {
  return structuredClone(value);
}
