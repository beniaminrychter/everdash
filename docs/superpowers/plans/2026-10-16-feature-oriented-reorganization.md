# Feature-Oriented Source Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the source into focused app, feature, and shared modules while preserving behavior and every existing component.

**Architecture:** Keep `src/app` as the composition and browser-wiring layer, move feature UI and feature-specific data under `src/features/<feature>`, and place reusable infrastructure and primitives under `src/shared`. Update all application and test imports as ownership moves, then enforce Ultracite/Oxlint/Oxfmt formatting and conditional braces.

**Tech Stack:** TypeScript 5.9, Preact 10, Vite, Ultracite, Oxlint, Oxfmt.

**Spec:** `docs/superpowers/specs/2026-10-16-feature-oriented-reorganization-design.md`

## Global Constraints

- Preserve rendered output, accessible names, callback behavior, polling behavior, data contracts, and browser compatibility.
- Preserve all existing components, including currently unused components; do not remove tests or fixtures.
- Do not add runtime dependencies or change configuration semantics.
- Keep the iOS 12 and Safari 12 compatibility target.
- Keep import sorting off and preserve CSS-module checks.
- Re-enable Oxlint's `curly` rule and use braces for every conditional body.
- Use Ultracite for linting and formatting; Oxfmt remains authoritative for formatting.
- Do not split a cohesive store class solely to reduce its line count.

## Review Focus

- Missing or invalid Home Assistant values retain their existing unavailable states and labels; verify through existing type contracts and preserve mapping inputs/outputs while moving adapters.
- Device/climate command behavior and polling ownership stay unchanged; preserve the existing store interfaces and verify with TypeScript and lint checks.
- Existing stored preferences, dashboard selection, and translations keep their keys and defaults; move implementations without changing serialization or message text.
- iOS 12/Safari 12 support stays intact; preserve browser-specific code and run the existing compatibility check.
- Unused components remain importable with their styles and support data; inventory them before moving and verify all source/test imports resolve.

---

## Target File Ownership

| Destination | Responsibility |
| --- | --- |
| `src/app/App.tsx`, `App.module.css`, `main.tsx`, `registerWorker.ts`, `hooks/` | Composition, bootstrapping, and app-wide environment/toast/zoom wiring |
| `src/features/dashboard/{components,data}/` | Dashboard picker/cards, entity discovery, observations, schedules, and dashboard types |
| `src/features/accessories/{components,data}/` | Accessory controls and device model/store/hook |
| `src/features/climate/{components,data}/` | Climate card and climate model/store/hook |
| `src/features/energy/{components,data}/` | Energy card, extracted `PriceChart`, and price mapping/formatting |
| `src/features/weather/{components,data}/` | Weather card and forecast mapping |
| `src/features/sensors/{components,data}/` | Sensor badges and sensor value mapping |
| `src/features/settings/{components,data,hooks}/` | Settings/About/connected-source details and preferences |
| `src/features/legacy-home/{components,data}/` | Existing HomeSummary and legacy room/scene types plus state/storage support |
| `src/shared/ui/` | Icon, IconButton, Modal, Toast, and Widget primitives with styles |
| `src/shared/home-assistant/` | Shared REST client and transport-level API contracts |
| `src/shared/dashboard/` | Entity-state and temperature helpers genuinely shared by features |
| `src/shared/i18n/` | Locale messages, translator, provider/hook, and number formatting |
| `src/shared/config/`, `src/shared/types/` | Configuration validation and cross-feature types |

## Tasks

### Task 1: Establish shared and app foundations

**Files:**

- Move `src/config/index.ts` to `src/shared/config/index.ts`.
- Move shared entity-state and temperature helpers out of `src/dashboard/readings.ts` to `src/shared/dashboard/readings.ts` (retain `hasState` and `formatTemperature`).
- Move `src/home-assistant/client.ts` to `src/shared/home-assistant/client.ts`; define transport-only contracts in `src/shared/home-assistant/contracts.ts` where currently imported feature types would otherwise cross the shared boundary.
- Move `src/types.ts` shared declarations to `src/shared/types/` and leave Room/Scene/demo-only declarations with the legacy-home feature in Task 4.
- Move `src/App.tsx`, `src/App.module.css`, `src/main.tsx`, and `src/registerWorker.ts` under `src/app/`.
- Move `src/hardReload.ts`, `src/home/useEnvironment.ts`, `src/home/useToast.ts`, and `src/home/usePreventZoom.ts` under `src/app/` (`hardReload.ts` and `hooks/` respectively).
- Modify root `home.config.ts`, `index.html`, `README.md`, and all imports of moved modules.

**Interfaces:**

- Shared Home Assistant client exposes the same request functions and transport options as the current `src/home-assistant/client.ts`.
- Shared dashboard helper exports retain the existing `hasState` and `formatTemperature` signatures.

- [x] Move the config, API client, shared types, and genuinely shared dashboard helpers; replace client dependencies on feature models with transport contracts.
- [x] Move app entry/composition and app-wide hooks; update root and application imports without changing runtime behavior.
- [x] Run `npm run typecheck` and `npm run check:compat`; resolve import and compatibility errors before continuing.

### Task 2: Co-locate dashboard, accessory, and climate features

**Files:**

- Move `src/dashboard/{discovery,store,time,types,useDashboard}.ts` to `src/features/dashboard/data/`; split `src/dashboard/readings.ts` sensor, price, and forecast mappings into owning feature data in Tasks 3 and 4.
- Move `src/components/DashboardCards/` and `src/components/DashboardPicker/` to `src/features/dashboard/components/` with CSS modules.
- Move `src/home-assistant/{model,store,useHomeAssistant}.ts` to `src/features/accessories/data/` and `src/components/{AccessoryCard,LightControls,PowerToggle}/` to `src/features/accessories/components/` with styles.
- Move `src/climate/{model,store,useClimate}.ts` to `src/features/climate/data/` and `src/components/ClimateCard/` to `src/features/climate/components/` with styles.
- Modify `src/app/App.tsx` and existing dashboard, climate, Home Assistant, and fixture tests to import from new owners.

**Interfaces:**

- Dashboard keeps its existing discovery, polling, schedule, and hook exports, now owned by `features/dashboard/data`.
- Accessories and climate keep their current model/store/hook interfaces; shared transport types come from `shared/home-assistant/contracts.ts`.

- [x] Move dashboard UI and data modules; update App and tests to the new dashboard paths.
- [x] Move accessory and climate UI/data modules; preserve store APIs and update consumers/tests.
- [x] Run `npm run typecheck` and `npm run check:compat`; resolve import and compatibility errors before continuing.

### Task 3: Separate energy, weather, and sensor ownership

**Files:**

- Move `src/components/EnergyCard/` to `src/features/energy/components/` and extract `PriceChart` from `EnergyCard.tsx` into sibling `src/features/energy/components/PriceChart.tsx` and `PriceChart.module.css` files.
- Move the existing price-slot and energy-reading mapping from `src/dashboard/readings.ts` to `src/features/energy/data/`.
- Move `src/components/WeatherCard/` to `src/features/weather/components/` and forecast parsing/mapping from `src/dashboard/readings.ts` to `src/features/weather/data/`.
- Move `src/components/SensorBadges/` to `src/features/sensors/components/` and sensor value mapping from `src/dashboard/readings.ts` to `src/features/sensors/data/`.
- Modify dashboard adapters and existing dashboard/i18n tests that import the old readings module.

**Interfaces:**

- Energy, weather, and sensor adapters retain the existing input and output shapes; the dashboard feature composes them without owning their domain mappings.
- `PriceChart` receives the chart data and existing selection callback from `EnergyCard`; preserve keyboard and pointer interaction behavior.

- [x] Extract and move energy mapping and `PriceChart`; update the energy card's imports and props without changing interaction state or output.
- [x] Move weather and sensor components/mappings; update dashboard composition and all existing imports.
- [x] Run `npm run typecheck` and `npm run check:compat`; resolve import and compatibility errors before continuing.

### Task 4: Move settings, legacy-home, and reusable UI; split i18n

**Files:**

- Move `src/components/{Settings,About}/` to `src/features/settings/components/`; move App-owned connected-data-source details into a new `src/features/settings/components/ConnectedDataSources/` component with a CSS module.
- Move `src/home/preferences.ts` and `src/home/usePreferences.ts` to `src/features/settings/data/` and `src/features/settings/hooks/`.
- Move `src/components/HomeSummary/` to `src/features/legacy-home/components/`; move `src/{data,state,storage}.ts` and legacy-only Room/RoomFilter/Scene types under `src/features/legacy-home/data/`.
- Move `src/components/{Icon,IconButton,Modal,Toast,Widget}/` to `src/shared/ui/`, retaining all existing implementations and CSS modules.
- Split `src/i18n.tsx` into `src/shared/i18n/messages.ts`, `translator.ts`, `I18nProvider.tsx`, and `number-format.ts`; preserve existing translation keys, defaults, and exports while updating consumers/tests.
- Modify app, feature, and test imports; update README source references if any point to moved paths.

**Interfaces:**

- `ConnectedDataSources` receives the selected view's existing source/config data and owns only its rendering.
- i18n exports preserve existing `Language`, `TranslationKey`, `Translator`, translator functions, provider/hook, and `formatNumber` behavior.
- Legacy-home state, scenes, persistence, and existing component props remain unchanged.

- [x] Move Settings/About and extract connected-source rendering from App; move preferences and their hook with Settings.
- [x] Move HomeSummary and legacy-home state/data/persistence while preserving all existing components and declarations (the current tree contains HomeSummary, not RoomFilters or ScenePicker).
- [x] Move reusable UI primitives and split locale messages, translator, provider, and formatting; update imports and README paths.
- [x] Run `npm run typecheck` and `npm run check:compat`; resolve import and compatibility errors before continuing.

### Task 5: Enforce requested style and finish the reorganization

**Files:**

- Modify `oxlint.config.ts` to enable `curly`.
- Modify all affected TypeScript, TSX, and JavaScript source files, including tests and scripts, to brace each conditional body flagged by Oxlint.
- Format moved and edited files with the configured Ultracite/Oxfmt commands.

**Interfaces:**

- No runtime interfaces change in this task.

- [x] Enable Oxlint's `curly` rule and fix each resulting finding with block bodies; retain the user's requested multiline `return` style, including generated JavaScript templates.
- [x] Run `npm run format`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, and `npm run check:compat`; all passed against a fresh production build.
- [x] Review the final source tree and references: all original components and test/fixture files remain, and moved modules have no stale imports. Recorded one pre-existing stale import in `tests/home-reducer.test.ts`, which refers to a reducer module absent from the initial source tree.

## Plan Self-Review

- Spec coverage: the five tasks cover app composition, feature ownership, shared infrastructure, unused component preservation, Settings extraction, i18n separation, brace style, and requested lint/format/type/compatibility checks.
- Step scan: each step is a bounded move, import update, extraction, or verification with a checkable result.
- Type consistency: moved store and translator exports retain existing signatures; shared contracts remove feature imports from shared transport.
- Review focus: invalid HA values, device/climate polling and command flow, persisted settings/translations, old-browser compatibility, and unused components are explicitly called out.
- Proportion: tasks sequence ownership moves before final global formatting and validation without prescribing implementation bodies or adding tests.
