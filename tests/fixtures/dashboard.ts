import { defineConfig } from '../../src/shared/config';

// Stable browser-test input, independent of each user's runtime dashboard JSON.
export const dashboardDocument = {
  schemaVersion: 1 as const,
  sun: 'sun.sun',
  timeZone: 'Europe/Warsaw',
  views: [
    {
      id: 'first-floor',
      title: 'First floor',
      badges: [
        { type: 'temperature', entity: 'sensor.czujnik_jadalnia_temperatura', name: 'Kitchen' },
      ],
      cards: [
        { type: 'light', entity: 'light.kuchnia', name: 'Kuchnia' },
        { type: 'light', entity: 'light.jadalnia', name: 'Jadalnia', icon: 'pendant' },
        { type: 'light', entity: 'light.szafki', name: 'Szafki' },
        { type: 'light', entity: 'light.skrytka', name: 'Skrytka' },
        {
          type: 'light',
          entity: 'light.salon_dodatkowe',
          name: 'Salon Dodatkowe',
          icon: 'floor-lamp',
        },
        { type: 'light', entity: 'light.salon_glowne', name: 'Salon Główne', icon: 'pendant' },
        { type: 'light', entity: 'light.tv', name: 'TV' },
        {
          type: 'outlet',
          entity: 'switch.ogrod_taras_kinkiety',
          name: 'Kinkiety Taras',
          icon: 'bulb',
        },
        {
          type: 'pstryk',
          entity: 'sensor.pstryk_current_buy_price',
          sellPrice: 'sensor.pstryk_current_sell_price',
          usage: 'sensor.pstryk_multisensor_activepower_0',
        },
        { type: 'climate', entity: 'climate.ac', name: 'Air Conditioner' },
        { type: 'weather', entity: 'weather.dom' },
      ],
    },
  ],
};

export default defineConfig(dashboardDocument);
