# EverDash

[![Latest release](https://img.shields.io/github/v/release/beniaminrychter/everdash?display_name=tag&sort=semver)](https://github.com/beniaminrychter/everdash/releases/latest) ![Architectures: aarch64 and amd64](https://img.shields.io/badge/architectures-aarch64%20%7C%20amd64-blue) [![Checks](https://github.com/beniaminrychter/everdash/actions/workflows/checks.yml/badge.svg)](https://github.com/beniaminrychter/everdash/actions/workflows/checks.yml) [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a-Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/beniaminryu)

EverDash gives legacy tablets new possibilities as Home Assistant dashboards. It pairs with Home Assistant, serves an iPad-friendly dashboard, and provides a visual builder for choosing entities and arranging views. The Home Assistant workspace uses React and shadcn/ui; the tablet remains a separate Preact app built for iOS 12 and Safari 12.

- Explicitly configured lights, outlets, climate controls, sensors, energy prices, and weather.
- Multiple dashboard views, saved appearance and language preferences, and an offline app shell.
- No friendly-name entity guessing or fabricated readings; missing and unavailable sources remain visible.
- A visual Home Assistant builder, read-only tablet preview, and optional advanced JSON editing.

## Install in Home Assistant

EverDash is designed to run as a Home Assistant app. Installation does not require npm or a separate server:

[![Add EverDash repository to Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fbeniaminrychter%2Feverdash)

The button opens Home Assistant's add-repository dialog with EverDash prefilled. After adding it, refresh the app store and look under **Settings → Apps → Install app**. EverDash becomes installable after its versioned multi-architecture image is published to GHCR and the package is public.

1. In Home Assistant, open **Settings → Apps** and choose **Install app from another repository** (or open the App Store menu and choose **Repositories**).
2. Add the public Git repository URL for EverDash, then refresh the app store and open **EverDash**.
3. Install and start EverDash, then open it from the Home Assistant sidebar. This opens the authenticated configuration workspace.
4. In **Builder**, add views and cards, choose entities by name or ID, then select **Save and apply**. JSON editing is available under **Advanced JSON**.
5. Use the **Tablet access** pane on the same page. It shows the local URL, a QR code, detected Home Assistant addresses, pairing approval, and registered tablets.
6. Open the displayed URL on the iPad, start pairing, and approve the code and device name in Home Assistant. Then add the dashboard to the Home Screen from Safari.

By default the dashboard is available on the Home Assistant LAN at `http://homeassistant.local:8095/`, with the actual mapped port and IP addresses shown in the Tablet access pane. The Home Assistant panel opens configuration; the direct URL opens the tablet dashboard. Optional trusted HTTPS is available for installations that need offline service-worker support.

EverDash is licensed under the [MIT License](LICENSE). You may use, modify, and redistribute it, including publishing modified versions, if you retain the copyright and license notice.

Third-party dependency and asset information is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Run from source

Requires Node.js 22.12+ and npm.

```sh
npm ci
```

The browser app never receives a Home Assistant token. In production, Home Assistant supplies a server-only `SUPERVISOR_TOKEN` and persistent `/data` directory. Local development uses the example dashboard and does not connect to a real Home Assistant instance by default. Never put HA credentials in frontend build variables.

```sh
npm run dev
```

Development runs at `http://localhost:5173`. Use the **production build on the old iPad**:

```sh
npm run build
npm run preview -- --port 4173
```

Open the printed LAN address on the iPad. `localhost` on the iPad refers to the iPad itself. For the packaged app, use the Home Assistant installation steps above.

## Home Assistant connection

The server uses Home Assistant's fixed Supervisor API route. Browser requests go to same-origin EverDash endpoints, and server policy filters tablet reads and commands to entities in the saved dashboard configuration. The admin entity picker searches Home Assistant entities, while the tablet only receives configured data. Home Assistant credentials remain on the server.

The Codex Home Assistant connector is useful for inspecting devices during development. The deployed PWA uses the configured REST connection independently of Codex.

## App configuration

The dashboard is stored as a versioned JSON document. Use the visual builder to create views, choose entities, edit card settings, and arrange their order. The **Preview** tab renders the current draft with a read-only Home Assistant snapshot. **Advanced JSON** supports validation, import, and export. Each entity ID remains explicit; the dashboard never guesses controls by friendly name. See [the generic example](examples/dashboard.json) and [JSON Schema](src/shared/config/schema.ts).

To migrate a TypeScript dashboard configuration to the versioned JSON format, run:

```sh
npm run config:export
```

Pass source and destination paths when needed: `npm run config:export -- /path/to/home.config.ts /path/to/dashboard.json`. Keep personal dashboards and exports out of the public repository.

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
- The tablet uses Preact, CSS Modules, and a Safari 12 CSS target. The admin workspace uses React, shadcn/ui Base UI primitives, and Tailwind; its files build separately and stay out of the tablet bundle and offline cache.
- The Ingress preview is a separate Preact entry that renders the tablet components in read-only mode and receives a validated draft plus configured entity snapshot through same-origin messaging.

| File | Responsibility |
| --- | --- |
| `examples/dashboard.json` | Generic starter dashboard using the runtime JSON schema |
| `src/shared/config/` | JSON contracts, schema, defaults and validation |
| `admin/` | React/shadcn Home Assistant workspace and visual builder |
| `preview/` | Same-origin read-only Preact tablet preview entry |
| `src/features/dashboard/` | Dashboard composition, source resolution, observation polling and schedules |
| `src/features/accessories/` | Accessory UI, capability/state mapping, commands and polling |
| `src/features/climate/` | Climate UI, state/capabilities, optimistic command queue and polling |
| `src/features/energy/`, `weather/`, `sensors/` | Domain-specific readings, formatting and components |
| `src/features/settings/` | Settings UI, connected-source details and saved preferences |
| `src/features/legacy-home/` | Preserved demo-home components, data, and persistence helpers |
| `src/shared/home-assistant/` | REST client and transport contracts |
| `src/shared/ui/` | Reusable interface primitives with adjacent CSS Modules |
| `src/app/App.tsx` | Configured live page and modal composition |
| `vite.config.ts`, `admin/vite.config.ts`, `vite.preview.config.ts` | Separate tablet, admin, and preview builds |
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
npm run check            # Lint + formatting + both TypeScript projects + unit tests
npm run build            # Tablet, admin, and preview production bundles
npm run check:compat     # After build: ES5 syntax, Safari CSS, PWA/cache inventory
npm run test:browser     # Self-contained build/server + installed Chrome; no live devices
```

The browser test uses a stable configuration in `tests/fixtures/dashboard.ts`, independent of the generic runtime JSON example. It builds into an OS temporary directory using dummy environment credentials and an isolated cross-origin HTTP API fixture. No preview server is needed, and the normal `dist/` and `.env` remain untouched. It verifies explicit entity bindings and metadata refresh, saved dashboard/appearance preferences, multiple views with shared controls and badge-only views, ordered widgets, HA sunrise/sunset, compact Pstryk/weather/temperature widgets, real browser HTTP requests, service payloads, inline AC temperature/mode/fan controls and failure rollback, automatic polling, capability-dependent controls, dimming, authentication/error recovery, unavailable entities, modal keyboard behavior, offline disabled controls, reconnect, four responsive widths, and forced SystemJS startup. Screenshots go to the OS temporary directory; set `MY_HOME_SCREENSHOT_DIR` to choose another path. Set `MY_HOME_BROWSER_CHANNEL=chromium` to use a previously installed bundled Chromium.

Modern-engine tests and syntax audits cannot prove iOS 12 behavior. The physical iPad still needs final testing for touch controls, TLS, Home Screen installation, and offline launch. End-to-end operation against the real server requires `.env` and CORS access; automated verification never actuates physical devices.
