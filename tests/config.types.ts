import { defineConfig } from '../src/shared/config';

// Checked by tsc, never bundled or executed. Comments stay beside the rejected card.
function configTypeChecks() {
  defineConfig({
    views: [
      {
        badges: [
          // @ts-expect-error Temperature badges require sensor entities.
          { type: 'temperature', entity: 'light.wrong' },
        ],
        cards: [
          // @ts-expect-error A light card cannot operate a switch entity.
          { type: 'light', entity: 'switch.wrong' },
          // @ts-expect-error Outlets require switch entities.
          { type: 'outlet', entity: 'light.wrong' },
          // @ts-expect-error Weather requires a weather entity.
          { type: 'weather', entity: 'sensor.wrong' },
          // @ts-expect-error Climate cards require climate entities.
          { type: 'climate', entity: 'light.wrong' },
          // @ts-expect-error Icons come from our supported icon set.
          { type: 'light', entity: 'light.valid', icon: 'unknown-icon' },
          // @ts-expect-error Card options depend on the type.
          { type: 'light', entity: 'light.valid', sellPrice: 'sensor.wrong' },
        ],
        id: 'home',
        title: 'Home',
      },
    ],
  });
  // @ts-expect-error Unknown configuration keys catch typos.
  defineConfig({ pollng: {}, views: [{ id: 'home', title: 'Home' }] });
}
void configTypeChecks;
