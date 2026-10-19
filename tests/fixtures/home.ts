import type { PageConfig } from '../../src/features/accessories/data/model';

export const homePage = {
  cards: [
    {
      type: 'light',
      entityId: 'light.salon_dodatkowe',
      name: 'Salon Dodatkowe',
      room: 'Salon',
      icon: 'bulb',
    },
    {
      type: 'outlet',
      entityId: 'switch.ogrod_taras_kinkiety',
      name: 'Kinkiety Taras',
      room: 'Ogród',
      icon: 'outlet',
    },
  ],
  pollIntervalMs: 5000,
} as const satisfies PageConfig;
