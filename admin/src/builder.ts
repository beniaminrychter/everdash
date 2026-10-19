import type { CardConfig, DashboardDocument, ViewConfig } from '../../src/shared/config/types';

export type CardKind = CardConfig['type'];

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

export function toDocument(value: DashboardDocument): DashboardDocument {
  return structuredClone(value);
}
