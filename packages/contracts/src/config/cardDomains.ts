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
  value: ['sensor', 'input_number'],
  toggle: ['input_boolean', 'switch', 'binary_sensor'],
  scene: ['scene', 'script'],
};

export function cardEntityDomains(type: CardConfig['type']): readonly string[] {
  return cardEntityDomainsByType[type];
}

/** Primary entity domain for a card type. */
export function cardEntityDomain(type: CardConfig['type']): string {
  return cardEntityDomainsByType[type][0]!;
}

/** Whether an entity ID belongs to one of the domains allowed for a card type. */
export function isCardEntity(type: CardConfig['type'], entity: unknown): entity is string {
  return (
    typeof entity === 'string' &&
    new RegExp(`^(?:${cardEntityDomains(type).join('|')})\\.[a-z0-9_]+$`).test(entity)
  );
}
