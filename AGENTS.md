# Project guidance

## What this project is

EverDash is a Preact progressive web app and Node.js service for controlling explicitly configured Home Assistant devices on legacy screens, including an iPad running iOS 12. Browser requests use same-origin endpoints; only the server holds the Supervisor credential and talks to Home Assistant's REST API. The app includes accessory and climate controls, energy prices and usage, weather forecasts, sensor badges, saved dashboard and appearance preferences, and an offline app shell.

The production target is iOS 12 and Safari 12. Keep the app usable on that hardware when changing TypeScript, JavaScript, CSS, build configuration, or dependencies. The IE11 output is only a conservative JavaScript syntax floor; IE11 is not a supported product target.

## Source organization

- `src/app/` owns application startup, top-level composition, browser registration, and app-wide hooks. Keep `App.tsx` focused on composition and wiring; move feature rendering and behavior into the owning feature.
- `src/features/<feature>/components/` owns feature UI. Keep component logic and its CSS Module together, preferably in a component directory such as `components/AccessoryCard/AccessoryCard.tsx` and `AccessoryCard.module.css`.
- `src/features/<feature>/data/` owns feature-specific models, stores, API-to-view mappings, and domain logic. Put feature hooks in a nearby `hooks/` directory when they are not part of a component.
- `src/shared/` owns code used by multiple features: UI primitives, Home Assistant transport and transport contracts, cross-feature types, configuration, i18n, and shared low-level helpers. Shared modules must not import from `src/features/`.
- `server/` owns Node.js persistence, authentication boundaries, Home Assistant transport policy, and HTTP serving. It may import browser-safe contracts from `src/shared/`, but never feature modules or frontend credentials.

The runtime dashboard is versioned JSON validated by `src/shared/config/` and edited through Home Assistant management. Keep entity IDs explicit; do not silently substitute entities by friendly name or invent production readings. The visual selector may use Home Assistant's entity registry to help a person choose IDs, but the saved dashboard must retain each selected ID explicitly.

The Home Assistant app package lives in `everdash/`; repository and image owner placeholders must remain unreleased until replaced with real public coordinates. Never add a license file without the repository owner's explicit choice. Home Assistant credentials are server-only and must not enter frontend build variables, static files, or test fixtures outside isolated dummy values.

## Adding or changing a feature

1. Give the feature a focused directory under `src/features/`. Keep its UI, styles, data mapping, state, and behavior under that feature's ownership.
2. Put each component beside its CSS Module. Avoid files that combine several unrelated components or domain responsibilities. When a file grows to own distinct responsibilities, split those responsibilities into small neighboring modules.
3. Keep feature-specific parsing and mapping with the feature that owns the data. Put a helper in `src/shared/` only when multiple features use the same behavior and it has no dependency on a feature.
4. Keep `src/app/App.tsx` as the composition point: it may connect app-wide state and callbacks to features, but feature internals belong near their components and data modules.
5. Keep component props and store/API contracts narrow. Preserve existing Home Assistant polling, cancellation, command ordering, optimistic updates, unavailable states, saved preference keys, and translation behavior unless the task explicitly changes them.
6. Preserve existing components, including currently unused ones. Remove obsolete non-component code only when references and behavior confirm it is no longer needed; update its consumers and fixtures in the same change.
7. Update imports, documentation, and relevant existing fixtures when files move. Do not add runtime dependencies without a clear need.

Use braces for every conditional body, including early returns. Put the body and `return` on separate lines, for example:

```ts
if (condition) {
  return;
}
```

Use blank lines to separate distinct steps and make component logic easy to scan.

## iOS 12 and Safari 12 compatibility

- Keep the `browserslist` targets in `package.json`, Vite legacy targets, and Safari 12 CSS target aligned. Do not raise the minimum supported browser without an explicit product decision.
- Runtime code must use APIs available in Safari 12. Prefer the existing Home Assistant client and its native `XMLHttpRequest` behavior for authenticated requests, timeouts, and cancellation. Do not introduce `fetch`, `AbortController`, or newer platform APIs that require a polyfill without checking the compatibility impact.
- The legacy build must remain ES5 and the service worker must remain ES5. Keep the SystemJS fallback and avoid adding IE-only `core-js` polyfills.
- Keep authored styles in CSS Modules. Avoid unsupported CSS features and layout assumptions such as flex/grid `gap`, native `<dialog>`, and newer viewport units. The compatibility audit checks built CSS as well as JavaScript output.
- Preserve touch, keyboard, offline, and Home Screen behavior when changing interactive components or app-shell code. A successful modern browser build alone does not establish iOS 12 behavior.

## Linting, formatting, and verification

Use the repository scripts and the TypeScript configurations `oxlint.config.ts` and `oxfmt.config.ts`. Ultracite is the configured lint and safe-fix entry point; Oxfmt is the formatting checker. Import sorting is intentionally disabled.

```sh
npm run format          # Apply Ultracite safe fixes and formatting
npm run lint            # Check lint and formatting rules
npm run format:check    # Verify Oxfmt formatting
npm run typecheck       # Run TypeScript without emitting files
npm run typecheck:server # Typecheck Node.js server modules
npm run build           # Typecheck and create production bundles
npm run build:server    # Bundle the server entry separately
npm run check:compat    # Run after build; inspect fresh dist output for iOS/Safari compatibility
npm test                # Run the Node test suite
npm run test:browser    # Run the browser smoke suite with its isolated fixtures
```

After editing source, run `npm run format`, `npm run lint`, `npm run format:check`, and `npm run typecheck`. For production or browser-compatibility changes, also run `npm run build` followed by `npm run check:compat`; the compatibility script reads generated files from `dist/`, so run it against a fresh build. Run the relevant existing tests when the task calls for test verification. Do not add tests solely to satisfy a lint or formatting change.

Keep the compatibility check clean: it validates ES5 legacy bundles and service worker syntax, unsupported CSS, Apple web-app metadata, manifest values, and local precache entries. The browser smoke suite uses isolated test configuration and does not require physical devices. Changes that affect iOS-specific input, TLS, Home Screen installation, or offline launch still need validation on the target iPad when available.
