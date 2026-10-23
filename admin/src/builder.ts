import type { CardConfig, DashboardDocument, ViewConfig } from '../../src/shared/config/types';

export type CardKind = CardConfig['type'];

export interface CardEditorMessage {
  type: `everdash.editor.card.${'edit' | 'delete' | 'move'}`;
  nonce: string;
  generation: number;
  viewId: string;
  index: number;
  offset?: -1 | 1;
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
    (message.type !== 'everdash.editor.card.move' || message.offset === -1 || message.offset === 1)
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
    case 'pstryk': {
      return { type, entity: 'sensor.select_entity' };
    }
    default: {
      throw new Error(`Unsupported card type: ${String(type)}`);
    }
  }
}

export function createConfiguredCard(type: CardKind, entity: string): CardConfig {
  const domain = type === 'outlet' ? 'switch' : type === 'pstryk' ? 'sensor' : type;
  if (!new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(entity)) {
    throw new Error(`Choose a valid ${domain} entity before adding the card.`);
  }
  return { ...createCard(type), entity } as CardConfig;
}

export function toDocument(value: DashboardDocument): DashboardDocument {
  return structuredClone(value);
}
