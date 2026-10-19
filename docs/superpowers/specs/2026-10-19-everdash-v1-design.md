# EverDash v1 design

## Goal and agreed product

EverDash gives older devices a new purpose as dedicated Home Assistant dashboards. The existing iOS 12 / Safari 12 Preact PWA remains the product foundation. A user installs a prebuilt Home Assistant OS app, edits runtime JSON through an HA-authenticated management screen, and pairs a tablet once. No compilation, embedded HA credentials, or daily HA login is required on the tablet.

The first release includes the existing card types, multiple views, a JSON editor, import/export, previous-version recovery, device approval/revocation, and persistent configuration. Visual entity selection and arrangement, standalone Docker onboarding, OAuth, token QR scanning, independent user/password accounts, and arbitrary new card types are deferred. The HA package is itself containerized; standalone distribution is a separate milestone.

## Architecture and boundaries

- Keep Preact 10, TypeScript, Vite, CSS Modules, existing polling stores, and XMLHttpRequest in browser code. Add a Node.js 24 LTS TypeScript backend using Fastify, with separate browser/server TypeScript configurations. Check and pin supported dependency versions at implementation time.
- Backend modules live under `server/`, divided into configuration, authentication/pairing, HA transport, and HTTP listeners. Shared JSON contracts and validation live under `src/shared/config/` and must have no feature, DOM, or server dependency. Split the current icon-name type away from UI implementation before using it in server validation.
- The backend serves prebuilt assets and a constrained same-origin API. Only it receives `SUPERVISOR_TOKEN`; HA requests go to the fixed `http://supervisor/core/api/` upstream. Do not expose arbitrary upstream URLs or a general-purpose proxy.
- Use two listeners: internal HTTP management on 8099, accepted only from Supervisor's actual peer IP `172.30.32.2`, and optional direct HTTPS dashboard on 8443. Never infer management access from forwarded headers on the direct listener. Use relative browser URLs under the changing Ingress prefix.
- Ingress management requires a nonempty Supervisor-supplied `X-Remote-User-Id`; unknown identities fail closed. In v1, an identified HA user permitted to open EverDash through Ingress is a manager. `panel_admin: true` hides the sidebar from ordinary users but is not an application authorization check; do not claim finer HA role enforcement.
- Direct-listener management routes always return 403, even with forged Ingress headers or a paired cookie. Paired devices can read published dashboard data and issue only supported commands to currently configured entities. They do not inherit an individual HA user's permissions: actions use the app's server-side credential.

## Configuration and editor

- Replace production import of `home.config.ts` with a versioned JSON document: `schemaVersion: 1` plus the existing `timeZone`, `sun`, `polling`, and `views` structure. Preserve explicit entity IDs, stable view IDs, defaults, and array order. Supply a JSON Schema and generic documentation examples; ship one empty view with no invented production readings.
- Validate unknown input completely: root/object shape, unknown keys, schema version, card discriminators, entity domains, names/icons, temperature units, unique nonempty view IDs, timezone, and finite polling limits. Preserve existing interval behavior. Report `{path, message}` issues; syntax errors need a readable message, without promising portable line/column parsing.
- Persist `/data/dashboard.json`, `/data/dashboard.previous.json`, and `/data/devices.json`; never serve `/data` as static files. Restrict filesystem permissions. No separate database service is required for this small, single-process app.
- Published revisions are SHA-256 digests of canonical validated JSON. Writes are serialized and use same-directory temporary files, fsync, and atomic rename. Retain the previous valid file before replacing the current file; publish the in-memory revision only after disk success. On startup, validate current configuration, recover from the previous valid copy if necessary, and report recovery. If neither is valid, show setup/recovery without starting device polling.
- The management feature provides a plain textarea with Validate, Save and apply, Import, Download, and Restore previous. No heavyweight code editor. Imported files replace the draft only. Downloads contain configuration only. Restore loads the previous version into the draft and requires Save and apply.
- Drafts do not affect tablets. Save includes the revision originally loaded; stale saves return 409 and preserve the draft. Show inline validation issues, unsaved-change warnings, and explicit success/failure feedback. Localize EN/PL strings.
- Devices check configuration revision every 30 seconds while visible and online and immediately on resume. A change disables writes, cancels old reads, and remounts polling stores with the new configuration. Unsent edits are discarded; already accepted HA commands cannot be undone. Removed entity commands are rejected server-side. Preserve the selected view if it exists, otherwise select the first view. No page rebuild/reload is needed.

## HTTP contracts

All paths below are relative to the current application base. JSON error responses use `{code, message, issues?}`. Configuration bodies have a 256 KiB limit. Authenticated responses and pairing responses use `Cache-Control: no-store`.

| Listener | Endpoint | Contract |
| --- | --- | --- |
| Both | `GET api/bootstrap` | Authorized callers receive `{mode, configured, revision, config}`; an unpaired direct caller receives 401 without configuration. |
| Management | `GET api/manage/config` | `{revision, config, previousAvailable}`. |
| Management | `POST api/manage/config/validate` | `{config: unknown}` to normalized config or 422 with field issues. |
| Management | `PUT api/manage/config` | `{baseRevision, config: unknown}` to published config/revision; 409 on conflict. |
| Management | `GET api/manage/config/previous` | Previous valid configuration, or 404; does not publish it. |
| Management | `GET api/manage/devices` | Paired device IDs, labels, pairing times, revocation state; no session secrets. |
| Management | `POST api/manage/pairings/approve` | `{code, label}` approves one live request. |
| Management | `DELETE api/manage/devices/:id` | Immediately revokes future access for that device. |
| Direct | `POST api/pairings` | Creates `{requestId, code, expiresAt, pollSecret}`. |
| Direct | `POST api/pairings/status` | `{requestId, pollSecret}` to pending/expired or one-time approved cookie issuance. |
| Both, authorized | `POST api/logout` | Revokes direct device session and expires its cookie; no effect on HA login. |
| Both, authorized | `GET api/ha/states` | Only published entities' metadata/states, including configured observations and sun. |
| Both, authorized | `GET api/ha/states/:entityId` | Configured entity state only. |
| Both, authorized | `POST api/ha/services/:domain/:service` | Existing light/switch/climate payloads and weather forecast response behavior only. |

Preserve HA status/error meaning, the 10-second browser timeout and cancellation, weather `return_response`, and per-entity optimistic command ordering. Validate allowed service fields, types, and targets server-side; reject extraneous entities, unsupported services, or mismatched domains. Preserve unavailable/404 entity behavior instead of substituting other entities. Do not automatically retry writes upstream.

## Pairing and access

- A tablet opens the direct HTTPS URL, requests pairing explicitly, and displays an 8-character unambiguous random code valid for five minutes. A manager enters it through Ingress, assigns a device label, and approves it. No camera or QR dependency.
- The request also has an independent 256-bit poll secret. Store only its digest in memory. Poll every three seconds. Codes alone never authorize cookie issuance. Expired requests are removed, pending requests do not survive restart, and approval can be redeemed only once.
- Rate-limit creation to 5/minute per peer IP, approval to 10/minute per Ingress user, and status polls to 30/minute per request; return 429 with Retry-After. Cap outstanding requests at 100 and return 503 when full. Use actual socket peer identity rather than untrusted forwarding headers.
- Issue a 256-bit random opaque session in `everdash_device`, an HttpOnly, Secure, SameSite=Strict cookie scoped to `/`. Store its digest and device metadata only. Persist expiry at 365 days; revocation or expiry requires pairing again. No tokens in URLs, exports, browser storage, logs, or static bundles.
- Cookies are origin-specific. Pair from the Home Screen app if iOS does not share Safari storage; support this without requiring HA to load on the tablet. Test actual iOS 12 behavior rather than assuming storage sharing.
- Browser mutations require an application request header plus an exact validated Origin. No permissive CORS. Ingress origin/path comes only from trusted Supervisor requests; direct origin is the configured public URL. Add bounded request bodies, explicit response schemas, credential-redacted logs, and traversal-safe static serving.

## Hosting and offline behavior

- Package in the existing repository as `repository.yaml` and `everdash/config.yaml`, with prebuilt aarch64 and amd64 images from a root multi-stage Dockerfile. No host networking, privileged mode, Docker socket, or broad Supervisor API access. Enable only `homeassistant_api: true` for the HA proxy.
- Use `/data` for persistent private files and a read-only `/ssl` mount for direct TLS. Options: `direct_enabled` default false, `public_url`, `certfile` default `fullchain.pem`, and `keyfile` default `privkey.pem`. Map direct port 8443 only when enabled by the installer; keep management port internal. Validate the public HTTPS URL, path-free except `/`, and certificate/key paths beneath `/ssl`.
- The management screen explains how to enable the direct port, set a local DNS name/public URL, and provide a certificate trusted by the target device, then displays the configured direct URL. Home Assistant's external URL alone does not expose EverDash's direct port. Do not promise automatic certificates or universal iOS 12 trust.
- Missing/broken direct TLS disables the direct listener with a clear management diagnostic while keeping Ingress recovery available. No fallback to insecure production HTTP. Service workers are disabled in the Ingress management screen; dashboard PWA scope is the direct origin.
- Keep the ES5 worker and cache only public immutable shell assets. Exclude runtime configuration, device sessions, pairing, management responses, HA API responses, and TLS material. Store a last validated dashboard config separately in browser storage for offline layout only, without readings or credentials. Never authorize controls from that snapshot; clear it on logout or an online 401. Physical offline revocation cannot erase an already cached layout.
- Add `everdash-` scoped caches while removing only this app's old `my-home-` scoped caches on upgrade. Keep `my-home:preferences:v1` as the existing preference key to avoid losing appearance, language, and view choices. Cross-origin deployment migration cannot transfer browser preferences automatically.

## Branding, migration, and publication

- Rename current product copy, document title, manifest, Apple title, package metadata, and contributor documentation to EverDash. Retain historical design documents and components. No new logo design is required for v1.
- Convert the current configuration into an ignored private migration export before replacing the public default. Provide a local conversion command for existing typed configs that outputs schema-versioned JSON without credentials. Users import that output through management. Remove VITE connection variables from production code, examples, tests, and error strings; retain server-only development fixtures.
- Audit tracked files and all Git history for secrets and personal configuration before making a repository public. Report findings without printing credential values. Rotation/history rewriting and publication are separate explicit actions; never automatically publish or rewrite existing history.
- Proposed license is MIT, subject to the owner's confirmation before public release. Inventory third-party assets/licenses. GitHub namespace/image coordinates follow the actual repository owner; never invent an organization or publish destination.
- Release versioned images, install/update/backup/recovery instructions, contribution guidance, vulnerability reporting guidance, and an iOS 12 acceptance checklist. Use cold app backups initially for consistent persistent files. Document that restored backups restore device authorizations; revocation may need repeating.

## Acceptance and delivery order

Deliver in dependency order: branding/runtime config, persisted configuration service, constrained HA transport, pairing, management editor, HA packaging/TLS, then release preparation. These are milestones within one release, not a reason to ship an unauthenticated intermediate server.

Automated tests use isolated fake HA/Supervisor servers and never actuate physical devices. Existing optimistic update, cancellation, polling, translation, unavailable-state, and preference fixtures remain meaningful. Add API authorization/validation, atomic save/recovery, concurrent edit, pairing expiry/replay/rate limits, immediate revocation, scoped offline cache, and nested Ingress-path coverage. Run the repository's full required checks and multi-architecture image smoke tests.

Before calling v1 ready, test installation/backup/restore on HA OS and trusted HTTPS, pairing in Safari and Home Screen, touch controls, expiry/revocation, and offline launch on the target iPad. If hardware is unavailable, report those checks as pending rather than claiming compatibility is proven.

## Primary references

- [HA app configuration](https://contributors.home-assistant.io/apps/reference/configuration/): ports, image architectures, persistent folders, and API permissions.
- [HA Ingress](https://contributors.home-assistant.io/apps/guides/ingress/): trusted peer, supplied user identity, relative paths, and separate direct access.
- [HA app communication](https://developers.home-assistant.io/docs/apps/communication/): fixed Core API proxy and Supervisor credential.
- [HA app repositories](https://contributors.home-assistant.io/apps/guides/repository/): user-installable repository packaging.
