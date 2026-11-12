const entity = (domain: string) => ({
  type: 'string',
  pattern: `^${domain}\\.[a-z0-9_]+$`,
});
const displayName = { type: 'string', minLength: 1, pattern: '\\S' };
const icon = {
  type: 'string',
  enum: [
    'away',
    'bed',
    'bulb',
    'check',
    'close',
    'cloud',
    'coffee',
    'desk-lamp',
    'floor-lamp',
    'home',
    'laptop',
    'moon',
    'more',
    'movie',
    'outlet',
    'pendant',
    'plug',
    'rain',
    'share',
    'sliders',
    'sofa',
    'sun',
    'sunrise',
    'thermometer',
  ],
};
const sensor = entity('sensor');

export const dashboardSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'EverDash dashboard configuration',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'views'],
  properties: {
    schemaVersion: { const: 1 },
    timeZone: { type: 'string', minLength: 1 },
    sun: entity('sun'),
    polling: {
      type: 'object',
      additionalProperties: false,
      properties: {
        controlsMs: { type: 'number', minimum: 1000, maximum: 2147483647 },
        observationsMs: { type: 'number', minimum: 1000, maximum: 2147483647 },
        metadataMs: { type: 'number', minimum: 1000, maximum: 2147483647 },
      },
    },
    views: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title'],
        properties: {
          id: { type: 'string', minLength: 1, pattern: '\\S' },
          title: { type: 'string', minLength: 1, pattern: '\\S' },
          badges: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'entity'],
              properties: {
                type: { const: 'temperature' },
                entity: sensor,
                name: displayName,
                icon,
              },
            },
          },
          cards: {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'entity'],
                  properties: {
                    type: { const: 'light' },
                    entity: entity('light'),
                    name: displayName,
                    icon,
                  },
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'entity'],
                  properties: {
                    type: { const: 'outlet' },
                    entity: entity('switch'),
                    name: displayName,
                    icon,
                  },
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'entity'],
                  properties: {
                    type: { const: 'pstryk' },
                    entity: sensor,
                    name: displayName,
                    sellPrice: sensor,
                    nextPrice: sensor,
                    usage: sensor,
                    schedule: sensor,
                  },
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'entity'],
                  properties: {
                    type: { const: 'weather' },
                    entity: entity('weather'),
                    name: displayName,
                  },
                },
                {
                  type: 'object',
                  additionalProperties: false,
                  required: ['type', 'entity'],
                  properties: {
                    type: { const: 'climate' },
                    entity: entity('climate'),
                    name: displayName,
                    temperatureUnit: { enum: ['°C', '°F'] },
                  },
                },
              ],
            },
          },
        },
      },
    },
  },
} as const;

export default dashboardSchema;
