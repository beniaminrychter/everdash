import type { Entity } from '../home-assistant/entities';

export const hasState = (entity: Entity | undefined): entity is Entity =>
  Boolean(
    entity && !['unknown', 'unavailable', 'none', ''].includes(entity.state.toLowerCase().trim()),
  );

export const formatTemperature = (value: number | null, locale = 'en-GB') =>
  value === null
    ? '—'
    : value.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
