# Feature-Oriented Source Reorganization

## Purpose

Reorganize the application so that a feature's UI, types, and feature-specific data mapping live together. Keep files focused on one responsibility and make the app entry point mostly composition. Preserve behavior, all existing components (including currently unused ones), and existing test coverage.

## Current shape

Source is split partly by technical layer: UI lives under `src/components`, while its data adapters and state live in `src/dashboard`, `src/climate`, and `src/home-assistant`. This separates related code. For example, `src/dashboard/readings.ts` handles sensor, energy, and weather mappings; `EnergyCard.tsx` contains both the card and price chart; and `App.tsx` owns the connected-data list rendered inside Settings.

## Proposed structure

```text
src/
  app/
    App.tsx
    main.tsx
    App.module.css
    hooks/
    registerWorker.ts
  features/
    dashboard/
      components/            # DashboardPicker, DashboardCards
      data/                  # discovery, polling, schedule/time, dashboard types
    accessories/
      components/            # AccessoryCard, LightControls, PowerToggle
      data/                  # device model, command state/store, device types
    climate/
      components/            # ClimateCard
      data/                  # climate model, commands, polling/store
    energy/
      components/            # EnergyCard, extracted PriceChart
      data/                  # price mapping, slots, energy-specific formatting
    weather/
      components/            # WeatherCard
      data/                  # forecast parsing and weather mapping
    sensors/
      components/            # SensorBadges
      data/                  # sensor value mapping
    settings/
      components/            # Settings, About, connected data source details
      data/                  # saved preferences and appearance
    legacy-home/
      components/            # HomeSummary and any existing legacy-home components
      data/                  # demo home state, scenes, and persistence helpers
  shared/
    ui/                      # Icon, IconButton, Modal, Toast, Widget
    home-assistant/          # shared HTTP client and API contracts
    dashboard/               # entity state and temperature helpers shared by features
    i18n/                    # messages, translator, provider, formatting
    config/                  # configuration validation and shared config types
    types/                   # types shared across features
```

The final names may follow the existing naming convention where that makes imports clearer, but the ownership boundaries above are the design target.

## Responsibilities and moves

- Keep `App` as the app composition root. Move app-only environment, toast, zoom, and reload wiring under `app`; move the connected-data details currently constructed in `App.tsx` into a Settings-owned component.
- Move each component family next to its feature data. Split sensor, energy, and weather adapters from `dashboard/readings.ts` into their feature data modules. Keep only genuinely shared entity-state and temperature-format helpers in a shared dashboard utility.
- Extract the price chart from `EnergyCard.tsx` into a sibling `PriceChart` component. Keep card presentation and chart interaction state in the energy feature.
- Keep the dashboard feature responsible for entity discovery, view resolution, observation polling, and dashboard composition. It may depend on feature adapters, but feature adapters must not depend on dashboard UI.
- Keep the Home Assistant HTTP client in shared infrastructure. Put device and climate-specific models and stores with their owning features. Keep only transport-level service command contracts in shared API types so the shared client does not import feature modules.
- Move generic UI primitives to `shared/ui`. Keep feature-specific controls, styles, and helpers in their feature directories.
- Keep all existing component implementations. `HomeSummary` and its support code move with the legacy-home feature; the current source tree contains no `RoomFilters` or `ScenePicker` components to move. No components are deleted as part of this work.
- Move locale messages away from the i18n provider so translations, provider state, and formatting each have a clear home.

## Style and behavior constraints

- This is an organization-only change. Preserve rendered output, accessible names, callback behavior, polling behavior, data contracts, and browser compatibility.
- Preserve public behavior and test coverage while changing internal imports. Update test imports to the new feature-owned modules; do not remove tests or fixtures.
- Re-enable Oxlint's `curly` rule and use braces for every conditional body, including single `return` and `throw` statements.
- Add blank lines between distinct declarations and logical steps where they make the flow easier to scan. Oxfmt remains authoritative for formatting.
- Keep Ultracite/Oxlint/Oxfmt, CSS-module checks, import sorting off, and the current iOS 12/Safari 12 compatibility target.
- Do not add runtime dependencies or change configuration semantics.

## Acceptance criteria

1. Feature UI and its feature-specific data/types/styles are discoverable together from the feature directory.
2. App-level orchestration no longer contains Settings-specific connected source rendering or feature data mapping.
3. No source module combines unrelated sensor, energy, and weather mapping.
4. Every existing component and test remains present, with imports updated to the new module ownership.
5. Oxlint passes with the curly-brace rule enabled; Oxfmt and TypeScript checking pass.
6. No UI, API, storage, polling, or compatibility behavior changes.

## Out of scope

- Deleting unused components or redesigning their UI.
- Changing Home Assistant APIs, device behavior, preferences, or translation text.
- Splitting a cohesive store class solely to reduce its line count. Store internals should only be extracted where the move establishes a real feature boundary or a separately understandable responsibility.
- Adding tests or dependencies.
