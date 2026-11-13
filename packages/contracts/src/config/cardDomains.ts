import type { CardConfig } from './types';

/**
 * Home Assistant entity domains a card type may be bound to. The first domain
 * is the primary one used for validation and entity pickers; extra domains can
 * be listed here later without touching callers.
 */
const cardEntityDomainsByType: Readonly<Record<CardConfig['type'], readonly string[]>> = {
  light: ['light'],
  outlet: ['switch'],
  climate: ['climate'],
  weather: ['weather'],
  pstryk: ['sensor'],
};

export function cardEntityDomains(type: CardConfig['type']): readonly string[] {
  return cardEntityDomainsByType[type];
}

/** Primary entity domain for a card type. */
export function cardEntityDomain(type: CardConfig['type']): string {
  return cardEntityDomainsByType[type][0]!;
}
