export interface Entity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated?: string;
}

export type EntityReadings = Readonly<Record<string, Entity | undefined>>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isEntity(value: unknown): value is Entity {
  return (
    isRecord(value) &&
    typeof value.entity_id === 'string' &&
    /^[a-z_]+\.[a-z0-9_]+$/.test(value.entity_id) &&
    typeof value.state === 'string' &&
    isRecord(value.attributes)
  );
}
