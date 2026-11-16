import { iconNames } from '../iconNames';

const entity = (domain: string) => ({
  type: 'string',
  pattern: `^${domain}\\.[a-z0-9_]+$`,
});
const displayName = { type: 'string', minLength: 1, pattern: '\\S' };
const icon = {
  type: 'string',
  enum: [...iconNames],
};
const cardSize = { enum: ['third', 'half', 'full'] };
const sensor = entity('sensor');
const entityIn = (...domains: string[]) => entity(`(?:${domains.join('|')})`);

const cards = {
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
          size: cardSize,
          forecast: { enum: ['hourly', 'daily'] },
        },
      },
      {
        type: 'object',
        additionalProperties: false,
        required: ['type'],
        properties: {
          type: { const: 'clock' },
          name: displayName,
          display: { enum: ['time', 'date', 'datetime'] },
          size: cardSize,
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
      {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'entity'],
        properties: {
          type: { const: 'value' },
          entity: entityIn('sensor', 'input_number'),
          name: displayName,
          icon,
          template: { enum: ['tile', 'compact', 'hero'] },
          unit: {
            type: 'string',
            maxLength: 12,
            pattern: '^$|^(?=.*\\S)[^\\x00-\\x1f\\x7f]*$',
          },
          precision: { type: 'integer', minimum: 0, maximum: 3 },
        },
      },
      {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'entity'],
        properties: {
          type: { const: 'toggle' },
          entity: entityIn('input_boolean', 'switch', 'binary_sensor'),
          name: displayName,
          icon,
        },
      },
      {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'entity'],
        properties: {
          type: { const: 'scene' },
          entity: entityIn('scene', 'script'),
          name: displayName,
          icon,
        },
      },
    ],
  },
};

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
          cards,
          sections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'title'],
              properties: {
                id: { type: 'string', minLength: 1, pattern: '\\S' },
                title: { type: 'string', minLength: 1, pattern: '\\S' },
                cards,
              },
            },
          },
        },
      },
    },
  },
} as const;

export default dashboardSchema;
