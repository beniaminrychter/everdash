import type { CardConfig, EntityCardConfig } from './types';

/**
 * Home Assistant entity domains a card type may be bound to. The first domain
 * is the primary one used for validation and entity pickers; extra domains can
 * be listed here later without touching callers. A card type with no domains,
 * such as the clock, is not bound to an entity.
 */
const cardEntityDomainsByType: Readonly<Record<CardConfig['type'], readonly string[]>> = {
  light: ['light'],
  outlet: ['switch'],
  climate: ['climate'],
  weather: ['weather'],
  clock: [],
  pstryk: ['sensor'],
  value: ['sensor', 'input_number'],
  toggle: ['input_boolean', 'switch', 'binary_sensor'],
  scene: ['scene', 'script'],
};

export function cardEntityDomains(type: CardConfig['type']): readonly string[] {
  return cardEntityDomainsByType[type];
}

/** Primary entity domain for a card type, or undefined when the type has no entity. */
export function cardEntityDomain(type: CardConfig['type']): string | undefined {
  return cardEntityDomainsByType[type][0];
}

/** Whether a card is bound to a Home Assistant entity, and so has an `entity` field. */
export function hasCardEntity(card: CardConfig): card is EntityCardConfig {
  return cardEntityDomainsByType[card.type].length > 0;
}

/** Whether an entity ID belongs to one of the domains allowed for a card type. */
export function isCardEntity(type: CardConfig['type'], entity: unknown): entity is string {
  const domains = cardEntityDomains(type);

  return (
    domains.length > 0 &&
    typeof entity === 'string' &&
    new RegExp(`^(?:${domains.join('|')})\\.[a-z0-9_]+$`).test(entity)
  );
}
