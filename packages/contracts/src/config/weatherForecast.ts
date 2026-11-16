/** Which forecast a weather card shows: one entry per hour or one per day. */
export const forecastTypes = ['hourly', 'daily'] as const;

export type ForecastType = (typeof forecastTypes)[number];

/** The forecast a weather card shows when its configuration does not set one. */
export const defaultForecastType: ForecastType = 'hourly';

export function isForecastType(value: unknown): value is ForecastType {
  return forecastTypes.includes(value as ForecastType);
}

/** Bits of a weather entity's `supported_features` that announce a forecast type. */
const featureBits: Readonly<Record<ForecastType, number>> = { daily: 1, hourly: 2 };

export interface ResolvedForecastType {
  /** The forecast type to request, or null when the entity offers neither hourly nor daily. */
  type: ForecastType | null;
  /** The entity cannot provide the type the card asked for, so the other one is used. */
  fellBack: boolean;
}

/**
 * Picks the forecast type an entity can provide, preferring the requested one.
 * An entity that does not report `supported_features` is assumed to support the request.
 */
export function resolveForecastType(
  requested: ForecastType,
  supportedFeatures: unknown,
): ResolvedForecastType {
  if (typeof supportedFeatures !== 'number') {
    return { type: requested, fellBack: false };
  }

  if ((supportedFeatures & featureBits[requested]) !== 0) {
    return { type: requested, fellBack: false };
  }

  const other: ForecastType = requested === 'hourly' ? 'daily' : 'hourly';

  if ((supportedFeatures & featureBits[other]) !== 0) {
    return { type: other, fellBack: true };
  }

  return { type: null, fellBack: false };
}

/** Key of a card's forecast in the dashboard snapshot; one entity can back cards of both types. */
export function forecastKey(entityId: string, requested: ForecastType): string {
  return `${entityId}#${requested}`;
}
