# EverDash

[![Latest release](https://img.shields.io/github/v/release/beniaminrychter/everdash?display_name=tag&sort=semver)](https://github.com/beniaminrychter/everdash/releases/latest) ![Architectures: aarch64 and amd64](https://img.shields.io/badge/architectures-aarch64%20%7C%20amd64-blue) [![Checks](https://github.com/beniaminrychter/everdash/actions/workflows/checks.yml/badge.svg)](https://github.com/beniaminrychter/everdash/actions/workflows/checks.yml) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a-Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/beniaminryu)

EverDash gives legacy tablets new possibilities as Home Assistant dashboards. It pairs with Home Assistant, serves an iPad-friendly dashboard, and provides a visual builder for choosing entities and arranging views. The Home Assistant workspace and tablet use Preact; the tablet is built for iOS 12 and Safari 12.

- Explicitly configured lights, outlets, climate controls, sensors, energy prices, and weather.
- Multiple dashboard views, saved appearance and language preferences, and an offline app shell.
- No friendly-name entity guessing or fabricated readings; missing and unavailable sources remain visible.
- A visual Home Assistant builder, read-only tablet preview, and optional advanced JSON editing.

## Run with Docker

```sh
docker compose up -d --build
```

Compose starts both EverDash and the latest stable Home Assistant container. Home Assistant configuration is stored separately in the `homeassistant-config` volume; EverDash uses `everdash-data`. The Home Assistant image is pulled when starting the stack, and its timezone defaults to `Europe/Warsaw` (override with `TZ`).

First open `http://YOUR-SERVER:8123/` and complete Home Assistant onboarding. Then open `http://YOUR-SERVER:8095/admin/`, enter `http://YOUR-SERVER-LAN-IP:8123`, and sign in with a Home Assistant administrator account. Use the server's LAN address: `localhost` inside EverDash refers to its own container, and the Docker service name `homeassistant` is not normally resolvable by your browser. EverDash stores the refresh credential only on the server in its persistent `/data` volume.

This stack publishes ports 8123 and 8095 using bridge networking. Full LAN discovery and direct hardware integrations may require a Linux host-network deployment and explicit device mappings. Stop any separate Home Assistant container already publishing port 8123 before starting this stack.

Configure views and cards in the visual editor. Under Tablet access, optionally save a four-to-six digit PIN. Open `http://YOUR-SERVER:8095/` on the tablet. No pairing is required. A PIN unlock lasts for the browser session; use Lock to end it explicitly. Browser session restoration may retain the unlock.

Initialize on a trusted LAN before external exposure. For HTTPS, put a trusted reverse proxy in front of the service and configure explicit trusted proxy CIDRs. HTTP LAN access works, but offline service-worker installation requires trusted HTTPS.

The named Docker volume holds dashboard configuration, recovery files, connection credentials and access settings. Back it up before upgrading. Imported dashboards remain locked until an HA administrator saves an access choice. Existing device records are left untouched and unused.

## Local development (no container)

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` starts three processes with hot reload:

| URL                            | What                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `http://localhost:5174/admin/` | Admin editor (Vite)                                         |
| `http://localhost:5173/`       | Tablet dashboard (Vite)                                     |
| `http://127.0.0.1:8790`        | EverDash server from TypeScript source, restarted on change |

Both Vite servers proxy `/api` to the server. Data is kept in `.local/everdash` (git-ignored). The server runs on your machine, so sign in with `http://localhost:8123` when Home Assistant runs locally or in a container that publishes port 8123. Override `EVERDASH_PORT` or `EVERDASH_DATA_DIR` if needed.

For an iPad running iOS 12, keep `pnpm dev` running and start this in another terminal:

```sh
pnpm dev:ipad
```

Open `http://YOUR-COMPUTER-IP:5175/` on the iPad. Port 5173 serves Vite's modern development runtime, which Safari 12 cannot parse. The iPad preview serves the production build's ES5 legacy path and proxies `/api` to the running server. Source changes rebuild automatically; wait for the build to finish, then reload the iPad. Output stays in `.local/ipad-preview`, separate from production `dist/`. Override `EVERDASH_IPAD_PORT` or `EVERDASH_API_URL` if needed; `EVERDASH_PORT` also selects the backend port.

To run a production build without a container: `pnpm build`, then `pnpm start` (port 8095, data in `.local/everdash`; set `EVERDASH_PORT` if a container already uses 8095).

### Changing the Home Assistant instance

In the admin, open **Tablet access → Home Assistant → Disconnect…**, then sign in to another instance. If you cannot sign in at all (for example the address changed), reset the connection from the server's shell:

```sh
node dist-server/server.js --reset-connection                                      # local build
docker compose exec everdash node /app/dist-server/server.js --reset-connection    # Docker
```

## Home Assistant connection

The standalone server uses Home Assistant OAuth. Browser requests use same-origin EverDash endpoints. The server filters tablet reads and commands to explicit saved entity IDs. Admin logout leaves the household connection intact; Reconnect Home Assistant replaces its credential after successful login.

## App configuration

The dashboard is stored as a versioned JSON document. Use the visual builder to create views, choose entities, edit card settings, and arrange their order. The **Preview** tab renders the current draft with a read-only Home Assistant snapshot. **Advanced JSON** supports validation, import, and export. Each entity ID remains explicit; the dashboard never guesses controls by friendly name. See [the generic example](examples/dashboard.json) and [JSON Schema](packages/contracts/src/config/schema.ts).

To migrate a TypeScript dashboard configuration to the versioned JSON format, run:

```sh
pnpm config:export
```

Pass source and destination paths when needed: `pnpm config:export /path/to/home.config.ts /path/to/dashboard.json`. Keep personal dashboards and exports out of the public repository.

Dashboard configuration uses JSON Schema version 1. See the [generic dashboard example](examples/dashboard.json) and [schema](packages/contracts/src/config/schema.ts). A dashboard contains `views`; each view has a stable `id`, a `title`, and optionally ordered `badges` and `cards`, and optionally named `sections` (each with a stable `id` that is unique within the view, a `title` and its own `cards`). A view works with no sections at all; when there are some, the view's own `cards` are shown first and the sections follow in order, each as a titled block. Entity IDs are explicit and must match their Home Assistant domains. A `weather` card takes an optional `forecast` of `hourly` (the default, scrolls through the next 48 hours) or `daily` (up to 10 days); if the weather entity only offers the other type, the card shows that one and says so. It also takes an optional `rows` of `1` (a single row of tiles high) or `2` (the default), next to its `size` of `quarter`, `half` or `full`.

Supported cards are `light`, `outlet`, `pstryk`, `weather`, `climate`, `value` (a read-only `sensor` or `input_number` value with an optional `template` of `tile`, `compact` or `hero`, `unit` and `precision`), `toggle` (an `input_boolean` or `switch` control, or a read-only `binary_sensor`), and `scene` (a `scene` or `script` run with one tap). Temperature badges use `sensor.*`. Optional root fields are `timeZone`, `sun`, and polling intervals in milliseconds. The validator applies the existing polling and icon defaults, rejects unknown fields and invalid entity IDs, and returns field-level issues.

### Language

Settings includes **English / Polski**. The choice is saved with dashboard and appearance preferences and survives normal and hard reloads. Existing saved preferences default to English. App labels, accessible names, weather conditions, status messages and errors are translated; configured dashboard/card/badge names and Home Assistant entity names remain as written. Polish uses decimal commas, with one decimal for temperatures and two for energy prices and usage. Translation strings live in `packages/ui/src/i18n/messages.ts`; there is no translation runtime dependency.

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

1. Open **Tablet access** in EverDash and copy, open, or scan its LAN URL. The default uses local HTTP on port 8095.
2. On the iPad, open that URL in Safari and start pairing. Approve its short code and name in the Home Assistant workspace.
3. Tap **Share → Add to Home Screen → Add**.
4. Launch **EverDash** from the Home Screen. Configure the optional trusted HTTPS listener for offline app-shell support.

The manifest, Apple standalone metadata, safe-area padding, and PNG Apple touch icon are included. Plain HTTP supports online local dashboard use. Service workers require trusted HTTPS, so the offline app shell is available when optional HTTPS is configured. Safari can evict cached data.

The ES5 service worker caches the app shell, modern and legacy bundles, CSS, manifest, and icons. It normalizes navigation fragments and only handles the exact static URLs, never Home Assistant API requests. A new version waits until all app windows close before activating. After deployment, visit online and close/reopen all copies. Serve `sw.js` with revalidation (`Cache-Control: no-cache`), and hashed assets with a long cache lifetime.

**Settings → Hard reload app** checks that the app server is reachable, removes only this app’s scoped service worker and offline caches, then downloads a fresh document using a cache-busting URL. Saved dashboard and appearance preferences are preserved. If the download check fails, the existing offline copy is kept. The temporary URL marker is removed on startup so subsequent offline reloads keep working. Other applications’ workers and caches are not removed.

Text selection, touch callouts and visible focus outlines are disabled across the dashboard. Pinch-to-zoom is blocked using viewport limits and non-passive Safari gesture/multi-touch handlers; single-touch scrolling and controls remain enabled. Keyboard navigation and modal focus trapping/restoration remain functional.

## Compatibility and structure

- Preact is restricted to major version 10. TSX targets Preact directly; React compatibility aliases and production devtools are disabled.
- Vite's official legacy plugin emits an ES5 SystemJS fallback plus a modern bundle. IE11 is only a conservative syntax floor, not a supported product target.
- Native XMLHttpRequest provides timeouts, cancellation, and authenticated requests on iOS 12 without a Fetch/AbortController polyfill. Runtime code uses APIs available in Safari 12; SystemJS is retained without IE-only core-js polyfills.
- The tablet uses Preact, CSS Modules, and a Safari 12 CSS target. The admin workspace uses Preact, native primitives, and CSS Modules; its files build separately and stay out of the tablet bundle and offline cache.
- The admin canvas directly imports the shared Preact dashboard cards. It uses authenticated draft snapshots and never sends device-control commands.

| File | Responsibility |
| --- | --- |
| `examples/dashboard.json` | Generic starter dashboard using the runtime JSON schema |
| `packages/contracts/src/config/` | JSON contracts, schema, defaults and validation |
| `apps/admin/` | Preact Home Assistant workspace and visual builder |
| `packages/dashboard/src/components/` | Direct shared dashboard canvas |
| `packages/dashboard/src/features/dashboard/` | Dashboard composition, source resolution, observation polling and schedules |
| `packages/dashboard/src/features/accessories/` | Accessory UI, capability/state mapping, commands and polling |
| `packages/dashboard/src/features/climate/` | Climate UI, state/capabilities, optimistic command queue and polling |
| `packages/dashboard/src/features/energy/`, `weather/`, `sensors/` | Domain-specific readings, formatting and components |
| `packages/dashboard/src/features/settings/` | Settings UI, connected-source details and saved preferences |
| `packages/dashboard/src/features/legacy-home/` | Preserved demo-home components, data, and persistence helpers |
| `packages/dashboard/src/shared/home-assistant/` | REST client and browser-side transport helpers; contracts live in `packages/contracts/src/home-assistant/` |
| `packages/ui/src/ui/` | Reusable interface primitives with adjacent CSS Modules |
| `apps/tablet/src/app/App.tsx` | Configured live page and modal composition |
| `vite.config.ts`, `apps/admin/vite.config.ts`, `vite.server.config.ts` | Tablet, admin, and server builds |
| `apps/tablet/public/` | Manifest and Home Screen icons |

## Quality tools and checks

Ultracite runs Oxlint and Oxfmt with its core and React-compatible presets. React scope/property checks and React Compiler immutability analysis are disabled for Preact refs and native DOM/SVG attributes. The `toSorted()` suggestion is disabled for iOS 12. Accessible modal and inline SVG roles have targeted exceptions.

[`@stale-styles/eslint-plugin`](https://github.com/stalecheck/stale-styles/tree/main/packages/eslint-plugin) checks CSS Module references: missing/unused classes, raw class strings, empty selectors, unresolved dynamic access, and missing files. Oxlint's JavaScript plugin support is alpha. These rules complement the production Safari CSS audit.

Oxfmt formats TSX, TypeScript, CSS, HTML, JSON, and Markdown. Configurations are `oxlint.config.ts`, `oxfmt.config.ts`, and `.editorconfig`. Generated assets, dependencies, browser reports, and pnpm's lockfile are excluded. Import sorting stays off to preserve stylesheet order. Quality tools add nothing to the browser bundle.

```sh
pnpm dev              # Server + tablet + admin with hot reload
pnpm build            # Typecheck, then tablet, admin, and server production bundles
pnpm start            # Run the production build locally
pnpm lint             # Fail on warnings and errors
pnpm format           # Apply Ultracite safe fixes and format authored files
pnpm format:check     # Verify formatting
pnpm typecheck        # Tablet, admin, and server TypeScript projects
pnpm check            # Lint + formatting + typecheck + unit tests
pnpm test             # Unit tests
pnpm check:compat     # After build: ES5 syntax, Safari CSS, PWA/cache inventory
pnpm smoke:server     # After build: start the server bundle and probe it
pnpm test:browser     # Tablet and admin browser suites; isolated fixtures, no live devices
```

The browser test uses a stable configuration in `tests/fixtures/dashboard.ts`, independent of the generic runtime JSON example. It builds into an OS temporary directory using dummy environment credentials and an isolated cross-origin HTTP API fixture. No preview server is needed, and the normal `dist/` and `.env` remain untouched. It verifies explicit entity bindings and metadata refresh, saved dashboard/appearance preferences, multiple views with shared controls and badge-only views, ordered widgets, HA sunrise/sunset, compact Pstryk/weather/temperature widgets, real browser HTTP requests, service payloads, inline AC temperature/mode/fan controls and failure rollback, automatic polling, capability-dependent controls, dimming, authentication/error recovery, unavailable entities, modal keyboard behavior, offline disabled controls, reconnect, four responsive widths, and forced SystemJS startup. Screenshots go to the OS temporary directory; set `MY_HOME_SCREENSHOT_DIR` to choose another path. Set `MY_HOME_BROWSER_CHANNEL=chromium` to use a previously installed bundled Chromium.

Modern-engine tests and syntax audits cannot prove iOS 12 behavior. The physical iPad still needs final testing for touch controls, TLS, Home Screen installation, and offline launch. End-to-end operation against the real server requires `.env` and CORS access; automated verification never actuates physical devices.
