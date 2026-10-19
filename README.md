# My Home

An Apple Home inspired dashboard for an iPad running iOS 12, built with **Vite, TypeScript, Preact 10, and CSS Modules**.

- One combined **First floor** dashboard, with a dropdown ready for additional configured dashboards. The selection is saved on this device.
- Kitchen lights: Kuchnia, Jadalnia, Szafki and Skrytka. Living room: Salon Dodatkowe, Salon Główne and TV.
- Actual outlet controls and a rounded kitchen-temperature badge at the top.
- Energy card with Pstryk current price and usage side by side, today’s price range, two-decimal rates, and a header graph button. The graph opens above the figures; tap a bar or use Tab and Enter/Space to see its date, time and rate.
- A compact current-weather strip with the next five hourly forecasts. All temperatures use one decimal place.
- Inline Air Conditioner control: target temperature, +/− buttons, Off/Cool/Heat/Dry and Auto/Low/Mid/High fan settings.
- Saved **Auto / Light / Dark** appearance. Auto follows Home Assistant sunrise/sunset through `sun.sun`.
- The original `light.salon_dodatkowe` and `switch.ogrod_taras_kinkiety` bindings are retained.

No production readings or entity IDs are fabricated. Sources that are missing, unavailable or offline show their actual status.

## Configure and run

Requires Node.js 22.12+ and npm.

```sh
npm ci
cp .env.example .env  # Only if .env does not already exist
```

Fill in the local `.env` file:

```dotenv
VITE_HOME_ASSISTANT_URL=https://your-home-assistant-address
VITE_HOME_ASSISTANT_TOKEN=your-long-lived-access-token
```

Use the server address the iPad can reach, without `/api` at the end. Create a long-lived access token in your Home Assistant user profile's Security section. Never commit it. `.env` and `.env.*` are ignored, with `.env.example` kept as the empty template.

**This is a temporary client-side credential setup:** Vite embeds both `VITE_` values in the JavaScript bundle. Anyone who can access the built app can extract its token, including from the offline cache. Keep this deployment private. Changing `.env` requires restarting the dev server or rebuilding and redeploying the production app; it does not change an existing build. No token is additionally written to browser storage or logs.

```sh
npm run dev
```

Development runs at `http://localhost:5173`. Use the **production build on the old iPad**:

```sh
npm run build
npm run preview -- --port 4173
```

Open the printed LAN address on the iPad. `localhost` on the iPad refers to the iPad itself. Missing or invalid environment values show a configuration message and disable controls; there is no fallback to pretend device state.

## Home Assistant connection

The app connects directly to Home Assistant's [REST API](https://developers.home-assistant.io/docs/api/rest/). It loads entity metadata with `GET /api/states` for display names and source diagnostics, polls only configured entities with `GET /api/states/<entity_id>` and controls hardware through `POST /api/services/light/turn_on`, `light/turn_off`, `switch/turn_on`, and `switch/turn_off`. It does not write to the state API.

When the dashboard and Home Assistant have different origins, add the dashboard's exact origin (scheme, host, port; no path) to Home Assistant's CORS allowed origins. For example, a local preview could require `http://192.168.1.20:4173`. See the [Home Assistant HTTP settings](https://www.home-assistant.io/integrations/http/); older installations configure `http.cors_allowed_origins` in YAML. Do not use a wildcard. An HTTPS dashboard also needs an HTTPS Home Assistant address with a certificate trusted by the iPad; browsers block HTTPS-to-HTTP requests.

The current desktop preview at `http://localhost:4174` needs that exact origin allowed. The iPad also needs the origin of the LAN address you open there, with the actual preview port. A successful authenticated request outside the browser does not confirm CORS: a rejected preflight prevents the browser from sending its authenticated request.

Alternatively, serve `dist/` under Home Assistant's `/config/www/my-home/` directory and open `/local/my-home/` on its origin. Those static files are publicly accessible to anyone who can reach that URL; the embedded token makes private access especially important.

The Codex Home Assistant connector is useful for inspecting devices during development. The deployed PWA uses the configured REST connection independently of Codex.

## App configuration

Edit **`home.config.ts`** at the project root. This is the only user configuration file. `defineConfig()` supplies autocomplete, checks entity domains and supported card options, and supplies icons and polling defaults. The app does not discover extra controls or match entities by friendly name.

```ts
import { defineConfig } from './src/shared/config';

export default defineConfig({
  timeZone: 'Europe/Warsaw',
  sun: 'sun.sun',
  views: [
    {
      id: 'first-floor',
      title: 'First floor',
      badges: [
        { type: 'temperature', entity: 'sensor.czujnik_jadalnia_temperatura', name: 'Kitchen' },
      ],
      cards: [
        { type: 'light', entity: 'light.kuchnia', name: 'Kuchnia' },
        { type: 'light', entity: 'light.salon_dodatkowe', icon: 'floor-lamp' },
        { type: 'outlet', entity: 'switch.ogrod_taras_kinkiety', name: 'Kinkiety Taras' },
        {
          type: 'pstryk',
          entity: 'sensor.pstryk_current_buy_price',
          sellPrice: 'sensor.pstryk_current_sell_price',
          usage: 'sensor.pstryk_multisensor_activepower_0',
        },
        { type: 'weather', entity: 'weather.dom' },
        { type: 'climate', entity: 'climate.ac', name: 'Air Conditioner' },
      ],
    },
  ],
});
```

The shipped config includes all eight existing accessories and the verified `climate.ac` air conditioner. `views` must contain at least one view, each with a unique stable `id` and a `title`. Adding a view adds a dashboard-picker option. The existing `first-floor` ID preserves saved selection. `badges` and `cards` can be omitted, including for a badge-only view. Cards render in array order; adjacent accessories or widgets share the existing responsive grids. The same device can appear in several views with different names/icons while sharing live state and one command queue.

| Type | Required entity | Optional fields | Default display |
| --- | --- | --- | --- |
| `light` | `light.*` | `name`, `icon` | HA friendly name, bulb icon |
| `outlet` | `switch.*` | `name`, `icon` | HA friendly name, outlet icon |
| `temperature` badge | `sensor.*` | `name`, `icon` | HA friendly name, thermometer icon |
| `pstryk` | buying-price `sensor.*` | `name`, `sellPrice`, `nextPrice`, `usage`, `schedule` | Energy |
| `weather` | `weather.*` | `name` | Current weather, condition-dependent icon |
| `climate` | `climate.*` | `name`, `temperatureUnit` | HA friendly name; °C by default |

`entity` always contains the exact HA entity ID. `name` changes only the label in this app. An omitted accessory/badge name uses HA's `friendly_name`, falling back to the entity ID until metadata arrives. Brightness and colour capabilities come from HA. Invalid/missing entities stay configured and show an unavailable state; a similarly named entity is never substituted. **Settings → Connected data sources** lists the selected view's explicit sources.

Optional root `polling` overrides are milliseconds: `{ controlsMs: 5000, observationsMs: 30000, metadataMs: 300000 }`. Omit it to use these defaults. Accessory and observation polling have minimum intervals of 1 and 5 seconds respectively. Metadata refresh is checked during each observation cycle. `sun` is optional: omit it to use the device appearance in Auto mode. `timeZone` supplies the home's IANA timezone for price schedule parsing and labels.

The Pstryk card shows current usage in kW with two decimals. The installed config uses the verified total active-power sensor `sensor.pstryk_multisensor_activepower_0`; channels 1–3 are individual phases and are not added again. W and kW readings are supported, including zero. Negative readings are labelled **Grid export**. Offline, missing, invalid or unavailable readings show a dash; cumulative kWh meters are not treated as current power.

Configuration is bundled at build time. Development reloads after edits; production requires **build → redeploy → Settings → Hard reload app**. Connection credentials remain in the local `.env`.

The climate card is fully inline. Its +/− buttons use the entity's `target_temp_step`, `min_temp` and `max_temp`; missing setpoints stay unavailable. Mode buttons expose Off/Cool/Heat/Dry. While Off is selected, the target temperature is gray and temperature/fan buttons are disabled; mode buttons remain available to turn the AC on. Fan buttons expose Auto/Low/Mid/High, with Mid mapped to the entity's advertised `medium` (or `mid`/`middle`) value. Unsupported options are disabled. The verified AC uses Celsius, 16–32°C in 1°C steps; set `temperatureUnit: '°F'` for an installation using Fahrenheit. Selecting a mode sends `climate.set_hvac_mode`, temperature uses `climate.set_temperature`, and fan uses `climate.set_fan_mode`. The AC polls with accessory controls every five seconds, updates optimistically, coalesces temperature taps for 250 ms, and serializes commands per entity. Failed writes roll back only the affected setting with a small error toast. No commands are queued while offline.

The original two-entity regression fixture now lives under `tests/fixtures/`, outside production configuration. Earlier mock fixtures and state helpers remain for regression coverage; the live dashboard does not use their saved state or sample measurements.

The weather strip requests hourly forecasts through `weather.get_forecasts` with `return_response`. Forecasts refresh every 15 minutes and on manual refresh; current weather retains the normal observation polling interval. Only supplied future entries within the next five hours appear. Missing or unsupported hourly forecasts show an unavailable note while current weather remains usable.

### Language

Settings includes **English / Polski**. The choice is saved with dashboard and appearance preferences and survives normal and hard reloads. Existing saved preferences default to English. App labels, accessible names, weather conditions, status messages and errors are translated; configured dashboard/card/badge names and Home Assistant entity names remain as written. Polish uses decimal commas, with one decimal for temperatures and two for energy prices and usage. Translation strings live in `src/shared/i18n/messages.ts`; there is no translation runtime dependency.

The Energy card’s graph button toggles a chart above current price and usage. Its bars are native buttons: select one by touch or keyboard to read the reported price and timestamp in the configured home timezone. Dense schedules scroll inside the chart. A refreshed schedule, closing the chart or going offline clears the selection.

### Pstryk schedule support

Price sensors can publish `prices`, `prices_today` and `prices_tomorrow` arrays containing `{ time, price }` records. Prefer ISO timestamps with `Z` or an explicit UTC offset. Optional `end` timestamps support non-hourly slots; otherwise the next interval is used, with an hour as the fallback. Invalid or old slots are excluded. A separate schedule sensor can be selected with the Pstryk card’s `schedule` if it supplies the same metadata and units.

Older `ha_Pstryk` versions are also supported: `All prices` arrays contain `{ start, price }`, `Next hour` supplies the upcoming rate, and `Is cheap` indicates a cheaper period. Offset-free times require root `timeZone`; this installation uses `Europe/Warsaw`, verified against Home Assistant's `/api/config`. Parsing and chart labels use that timezone even when the iPad has a different timezone. DST gaps and ambiguous repeated hours without offsets are omitted rather than assigned a guessed time. Change the setting if Home Assistant's timezone changes.

Prices support `PLN/kWh`, `zł/kWh`, `EUR/kWh` and corresponding MWh units. MWh prices are normalized to kWh; currencies are never combined. Zero and negative prices are valid. If an integration publishes only the current price, that value still works and the chart explains that no schedule is available. Rates are shown as reported by the integration, without inventing taxes, distribution charges or future estimates.

Sources used for these adapters: [Pstryk price and schedule attributes](https://github.com/Bankilo/pstryk-home-assistant), [alternative Pstryk JSON schedule sensors](https://github.com/balgerion/ha_Pstryk), [Home Assistant weather](https://www.home-assistant.io/integrations/weather/).

## Behavior

- Tap an accessory’s circular icon to toggle power. Tap the rest of a light tile to open its brightness and color controls. There is no separate switch on tiles.
- **Settings** (top right) contains connection status, the configured server URL, Refresh, Hard reload app, appearance, language and installation details. The token is never displayed. Connection errors show a small notice on the dashboard; normal connection details stay in Settings.
- The dashboard and appearance are saved under `my-home:preferences:v1`. Blocked/corrupt storage does not prevent use; Settings explains when preferences cannot be saved.
- **Auto** is light while `sun.sun` reports `above_horizon` and dark while `below_horizon`, refreshed with observations. If the sun state is unavailable or offline, Auto falls back to the device appearance (light on Safari versions without system dark-mode support). Manual Light/Dark always overrides Auto.
- Pstryk compares the current rate with today’s published schedule in the configured home timezone. The daily minimum and prices within the bottom 10% of today’s range are green; the top 25% is red. Integration flags are a fallback when today’s schedule is missing. Unknown prices stay neutral; colour is accompanied by a text label.

- Reads configured accessory entities immediately, then every five seconds after a polling cycle completes. Read-only observations refresh every 30 seconds; entity metadata refresh every five minutes or on **Refresh**. Polls do not overlap. Polling pauses while the document is hidden or the browser is offline, and resumes immediately when active again.
- Explicit on/off services control light and switch entities. Brightness uses `brightness_pct`, with zero calling `turn_off`. Power-on without a brightness override lets Home Assistant restore its light setting.
- The light sheet shows dimming and RGB color controls only when the entity's reported capabilities support them. Older `supported_features` flags are supported when color-mode metadata is absent.
- All controls update immediately. Buttons remain interactive during requests; sliders and colors update continuously without sending/connected labels. Changes are coalesced for 250 ms and commands serialize per entity. A service acknowledgement preserves the optimistic value until the normal polling cycle reconciles hardware state, allowing device transitions to finish without an immediate stale read snapping the UI back. Older responses cannot overwrite newer input.
- Loading, missing, unavailable, and disconnected entities have disabled controls. A failed action restores the preceding accepted state and shows a small five-second error toast; transient action failures do not disconnect the control or prevent retrying. An older failure cannot discard newer queued input. Authentication failures suspend automatic retries until **Refresh** or a reload. Connection diagnostics stay in Settings.
- The offline shell opens the saved dashboard, but real devices cannot be operated offline. Commands are not queued for a future reconnect. Previously displayed state is never represented as freshly confirmed after an offline reload. Missing weather/prices stay unavailable rather than falling back to sample data.
- Modal focus trapping, Escape/backdrop dismissal, focus restoration, reduced motion, and responsive tablet/phone layouts are retained.

## Install on the iPad

1. Serve `dist/` from a private **HTTPS** host trusted by the iPad. Subfolders work; keep the trailing slash.
2. Open that address in Safari and wait for the first complete online load.
3. Tap **Share → Add to Home Screen → Add**.
4. Launch **My Home** from the Home Screen.

The manifest, Apple standalone metadata, safe-area padding, and PNG Apple touch icon are included. Service workers require HTTPS over the network; plain HTTP LAN preview is only for initial testing. Safari can evict cached data.

The ES5 service worker caches the app shell, modern and legacy bundles, CSS, manifest, and icons. It normalizes navigation fragments and only handles the exact static URLs, never Home Assistant API requests. A new version waits until all app windows close before activating. After deployment, visit online and close/reopen all copies. Serve `sw.js` with revalidation (`Cache-Control: no-cache`), and hashed assets with a long cache lifetime.

**Settings → Hard reload app** checks that the app server is reachable, removes only this app’s scoped service worker and offline caches, then downloads a fresh document using a cache-busting URL. Saved dashboard and appearance preferences are preserved. If the download check fails, the existing offline copy is kept. The temporary URL marker is removed on startup so subsequent offline reloads keep working. Other applications’ workers and caches are not removed.

Text selection, touch callouts and visible focus outlines are disabled across the dashboard. Pinch-to-zoom is blocked using viewport limits and non-passive Safari gesture/multi-touch handlers; single-touch scrolling and controls remain enabled. Keyboard navigation and modal focus trapping/restoration remain functional.

## Compatibility and structure

- Preact is restricted to major version 10. TSX targets Preact directly; React compatibility aliases and production devtools are disabled.
- Vite's official legacy plugin emits an ES5 SystemJS fallback plus a modern bundle. IE11 is only a conservative syntax floor, not a supported product target.
- Native XMLHttpRequest provides timeouts, cancellation, and authenticated requests on iOS 12 without a Fetch/AbortController polyfill. Runtime code uses APIs available in Safari 12; SystemJS is retained without IE-only core-js polyfills.
- All authored styles use colocated CSS Modules, with shared tokens and explicit document defaults in `src/app/App.module.css`. PostCSS and Autoprefixer target Safari 12. No Tailwind, flex gap, native dialog, external fonts, or component kit.

| File | Responsibility |
| --- | --- |
| `home.config.ts` | Complete user configuration: views, badges, cards and explicit entity IDs |
| `src/shared/config/` | Configuration types, defaults and validation |
| `src/features/dashboard/` | Dashboard composition, source resolution, observation polling and schedules |
| `src/features/accessories/` | Accessory UI, capability/state mapping, commands and polling |
| `src/features/climate/` | Climate UI, state/capabilities, optimistic command queue and polling |
| `src/features/energy/`, `weather/`, `sensors/` | Domain-specific readings, formatting and components |
| `src/features/settings/` | Settings UI, connected-source details and saved preferences |
| `src/features/legacy-home/` | Preserved demo-home components, data, and persistence helpers |
| `src/shared/home-assistant/` | REST client and transport contracts |
| `src/shared/ui/` | Reusable interface primitives with adjacent CSS Modules |
| `src/app/App.tsx` | Configured live page and modal composition |
| `vite.config.ts` | Legacy build and versioned offline shell |
| `public/` | Manifest and Home Screen icons |

## Quality tools and checks

Ultracite runs Oxlint and Oxfmt with its core and React-compatible presets. React scope/property checks and React Compiler immutability analysis are disabled for Preact refs and native DOM/SVG attributes. The `toSorted()` suggestion is disabled for iOS 12. Accessible modal and inline SVG roles have targeted exceptions.

[`@stale-styles/eslint-plugin`](https://github.com/stalecheck/stale-styles/tree/main/packages/eslint-plugin) checks CSS Module references: missing/unused classes, raw class strings, empty selectors, unresolved dynamic access, and missing files. Oxlint's JavaScript plugin support is alpha. These rules complement the production Safari CSS audit.

Oxfmt formats TSX, TypeScript, CSS, HTML, JSON, and Markdown. Configurations are `oxlint.config.ts`, `oxfmt.config.ts`, and `.editorconfig`. Generated assets, dependencies, browser reports, and npm's lockfile are excluded. Import sorting stays off to preserve stylesheet order. Quality tools add nothing to the browser bundle.

```sh
npm run lint             # Fail on warnings and errors
npm run lint:fix         # Apply safe lint fixes
npm run format           # Apply Ultracite safe fixes and format authored files
npm run format:check     # Verify formatting
npm run check            # Lint + formatting + TypeScript + all unit tests
npm run build            # TypeScript + production bundles
npm run check:compat     # After build: ES5 syntax, Safari CSS, PWA/cache inventory
npm run test:browser     # Self-contained build/server + installed Chrome; no live devices
```

The browser test uses a stable configuration in `tests/fixtures/dashboard.ts`, so edits to `home.config.ts` do not change its fixtures. It builds into an OS temporary directory using dummy environment credentials and an isolated cross-origin HTTP API fixture. No preview server is needed, and the normal `dist/` and `.env` remain untouched. It verifies explicit entity bindings and metadata refresh, saved dashboard/appearance preferences, multiple views with shared controls and badge-only views, ordered widgets, HA sunrise/sunset, compact Pstryk/weather/temperature widgets, real browser HTTP requests, service payloads, inline AC temperature/mode/fan controls and failure rollback, automatic polling, capability-dependent controls, dimming, authentication/error recovery, unavailable entities, modal keyboard behavior, offline disabled controls, reconnect, four responsive widths, and forced SystemJS startup. Screenshots go to the OS temporary directory; set `MY_HOME_SCREENSHOT_DIR` to choose another path. Set `MY_HOME_BROWSER_CHANNEL=chromium` to use a previously installed bundled Chromium.

Modern-engine tests and syntax audits cannot prove iOS 12 behavior. The physical iPad still needs final testing for touch controls, TLS, Home Screen installation, and offline launch. End-to-end operation against the real server requires `.env` and CORS access; automated verification never actuates physical devices.

The original [design brief](docs/design.md), [scaffold plan](docs/implementation-plan.md), and [visual concept](docs/design/dashboard-concept.png) describe the earlier mock foundation.
