import { defineConfig } from '@everdash/contracts/config';

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
          // @ts-expect-error Weather sizes are a quarter, a half or full.
          { type: 'weather', entity: 'weather.valid', size: 'wide' },
          // @ts-expect-error Weather forecasts are hourly or daily.
          { type: 'weather', entity: 'weather.valid', forecast: 'weekly' },
          // @ts-expect-error Clock cards have no Home Assistant entity.
          { type: 'clock', entity: 'sensor.time' },
          // @ts-expect-error Clock displays are time, date or datetime.
          { type: 'clock', display: 'seconds' },
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
  // The forecast type of a weather card is optional.
  defineConfig({
    views: [
      {
        cards: [
          { type: 'weather', entity: 'weather.valid' },
          { type: 'weather', entity: 'weather.valid', forecast: 'daily', size: 'half' },
        ],
        id: 'weather',
        title: 'Weather',
      },
    ],
  });
  // A clock needs no entity, and the sizes are optional.
  defineConfig({
    views: [
      {
        cards: [{ type: 'clock' }, { type: 'clock', display: 'date', size: 'half' }],
        id: 'time',
        title: 'Time',
      },
    ],
  });
  // Sections are optional, take the same cards as a view, and need an id and a title.
  defineConfig({
    views: [
      {
        id: 'home',
        title: 'Home',
        sections: [
          { id: 'kitchen', title: 'Kitchen', cards: [{ type: 'light', entity: 'light.x' }] },
        ],
      },
    ],
  });
  defineConfig({
    views: [
      {
        id: 'home',
        title: 'Home',
        sections: [
          // @ts-expect-error A section needs a title.
          { id: 'kitchen' },
          // @ts-expect-error A section needs an id.
          { title: 'Kitchen' },
          {
            id: 'bad',
            title: 'Bad',
            cards: [
              // @ts-expect-error Section cards are typed like view cards.
              { type: 'light', entity: 'switch.wrong' },
            ],
          },
        ],
      },
    ],
  });
  // @ts-expect-error Unknown configuration keys catch typos.
  defineConfig({ pollng: {}, views: [{ id: 'home', title: 'Home' }] });
}
void configTypeChecks;
