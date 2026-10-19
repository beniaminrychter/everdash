# Unified home configuration implementation plan

Goal: Replace the scattered room/page configuration with the approved `home.config.ts` / `defineConfig()` API.

Architecture: Typed view, badge and card unions describe explicit entities. The helper supplies icons and polling defaults; a resolver uses HA metadata for omitted names without discovering additional entities. Views render configured cards in order, grouping adjacent accessories/widgets using the existing grids. A shared command store deduplicates entities across views and retains optimistic behavior.

Spec: Approved configuration example and rules in this chat, 16 October 2026. Preserve the current eight controls, kitchen temperature badge, Pstryk prices/usage and weather. Keep credentials in the existing .env. No UI redesign, new dependencies, runtime config editor, YAML parser or device actuation.

Constraints: Preact 10, TypeScript, CSS Modules, Safari/iOS 12, existing preference key and appearance behavior. Work in the existing workspace (no Git repository available); no commits or worktree steps apply.

Review focus: missing entities remain explicit; omitted names update from metadata; repeated entities across views share state but retain display overrides; badge-only views poll their sensors; widget ordering and multiple widget IDs work; metadata refresh must not reset queued commands.

## 1. Typed config and resolver

- [x] Add failing tests for defaults/overrides, entity domain constraints, view validation, ordered cards, exact IDs, missing sources, deduplicated controls and badge-only observations.
- [x] Add src/config/index.ts types/defaults/validation and the single root home.config.ts.
- [x] Replace room/name-selector resolution with explicit view/card resolution.
- [x] Run config and dashboard unit tests.

## 2. Polling and rendering migration

- [x] Remove area/template discovery and its settings messages. Keep catalog metadata refresh and individual configured observation reads.
- [x] Render each selected view's badges and cards, preserving order and existing grid styling. Keep command store stable across view changes.
- [x] Move old two-entity regression bindings to test fixtures; delete all old src/config/page and dashboard configuration files.
- [x] Update store tests for explicit readings and metadata refresh stability.
- [x] Update browser fixtures to match actual configured IDs, and exercise a separate fixture configuration with multiple views, shared controls and optional widgets.

## 3. Verification and documentation

- [x] Document the single-file configuration, defaults, optional fields, polling and build-time updates.
- [x] Run lint/format/type checks, all unit tests, build, compatibility audit and isolated browser tests including forced legacy/offline behavior.
- [x] Review tablet/phone screenshots and verify the current IAB tab with a hard reload, without operating physical devices.
- [x] Conduct a focused independent review and resolve material findings.

## Verification record

- `npm run check`: lint, formatting, TypeScript (including negative config type assertions) and 70 unit tests pass.
- `npm run build` and `npm run check:compat`: production build and ES5/Safari CSS/PWA audit pass.
- `npm run test:browser`: passes at 1024, 768, 375 and 320 pixels, including multiple fixture views, persistent selection, shared controls, order/unique IDs, entirely sensor-only configuration, optimistic controls, failure recovery, legacy startup and offline reloads.
- Tablet and phone screenshots reviewed; production IAB hard reload verified all 14 explicit sources found, live readings present, and no console errors. No physical device controls operated.
- Independent review: one material finding, sensor-only apps remained in Connecting state. Browser regression reproduced the failure, then passed after treating an empty control set as ready once observation metadata loads. Full unit and browser suites green after the fix. No deferred findings.
- Legacy JavaScript + CSS gzip: 37.89 kB including SystemJS, compared with 38.52 kB immediately before this migration.
