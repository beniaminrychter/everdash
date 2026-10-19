# EverDash

EverDash gives older screens a new purpose as Home Assistant dashboards. It is built with Preact, TypeScript, Vite, and CSS Modules, with a Safari 12 / iOS 12 compatibility target.

- Explicitly configured lights, outlets, climate controls, sensors, energy prices, and weather.
- Multiple dashboard views, saved appearance and language preferences, and an offline app shell.
- No friendly-name entity guessing or fabricated readings; missing and unavailable sources remain visible.

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

The dashboard is described by a versioned JSON document. See [the generic example](examples/dashboard.json) and [JSON Schema](src/shared/config/schema.ts). Each entity ID is explicit; the dashboard never discovers controls or matches devices by friendly name. Local development currently loads the generic example; the HA OS release will load saved JSON through EverDash's management screen.

If you are migrating the current TypeScript dashboard, its private source has been moved into the ignored `.local/home.config.ts` file. Export it to versioned JSON with:

```sh
npm run config:export
```

The output is written to `.local/dashboard.json`, which is excluded from Git. You can also provide source and destination paths: `npm run config:export -- /path/to/home.config.ts /path/to/dashboard.json`.

Dashboard configuration uses JSON Schema version 1. See the [generic dashboard example](examples/dashboard.json) and [schema](src/shared/config/schema.ts). A dashboard contains `views`; each view has a stable `id`, a `title`, and optionally ordered `badges` and `cards`. Entity IDs are explicit and must match their Home Assistant domains.

Supported cards are `light`, `outlet`, `pstryk`, `weather`, and `climate`. Temperature badges use `sensor.*`. Optional root fields are `timeZone`, `sun`, and polling intervals in milliseconds. The validator applies the existing polling and icon defaults, rejects unknown fields and invalid entity IDs, and returns field-level issues.

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
4. Launch **EverDash** from the Home Screen.

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
| `examples/dashboard.json` | Generic starter dashboard using the runtime JSON schema |
| `src/shared/config/` | JSON contracts, schema, defaults and validation |
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

The browser test uses a stable configuration in `tests/fixtures/dashboard.ts`, independent of the generic runtime JSON example. It builds into an OS temporary directory using dummy environment credentials and an isolated cross-origin HTTP API fixture. No preview server is needed, and the normal `dist/` and `.env` remain untouched. It verifies explicit entity bindings and metadata refresh, saved dashboard/appearance preferences, multiple views with shared controls and badge-only views, ordered widgets, HA sunrise/sunset, compact Pstryk/weather/temperature widgets, real browser HTTP requests, service payloads, inline AC temperature/mode/fan controls and failure rollback, automatic polling, capability-dependent controls, dimming, authentication/error recovery, unavailable entities, modal keyboard behavior, offline disabled controls, reconnect, four responsive widths, and forced SystemJS startup. Screenshots go to the OS temporary directory; set `MY_HOME_SCREENSHOT_DIR` to choose another path. Set `MY_HOME_BROWSER_CHANNEL=chromium` to use a previously installed bundled Chromium.

Modern-engine tests and syntax audits cannot prove iOS 12 behavior. The physical iPad still needs final testing for touch controls, TLS, Home Screen installation, and offline launch. End-to-end operation against the real server requires `.env` and CORS access; automated verification never actuates physical devices.

The original [design brief](docs/design.md), [scaffold plan](docs/implementation-plan.md), and [visual concept](docs/design/dashboard-concept.png) describe the earlier mock foundation.
