# Install and host EverDash

## Home Assistant app (recommended)

EverDash is packaged as a Home Assistant app with Ingress enabled. Ingress keeps management behind Home Assistant authentication, so the app does not create a separate username/password database. The server accepts management traffic only from Supervisor's trusted Ingress peer and uses Home Assistant's server-side Supervisor API token for HA reads and service calls.

Once the project has a public repository, add its repository URL in Home Assistant under **Settings → Apps → App Store menu → Repositories**. Refresh the store, choose EverDash, install, and start it. The app appears in the sidebar; open it there to pair devices and edit, validate, import, or export dashboard JSON. Visual entity selection and drag-to-arrange are planned follow-up work; the current release uses the JSON editor. The browser never receives `SUPERVISOR_TOKEN`.

The app image is built for `amd64` and `aarch64`. The release publishes a multi-architecture image. A release is not installable from the app store until the Git repository and image references in `everdash/config.yaml` point at the actual public owner and the tagged image exists.

## Direct HTTPS access (optional)

Use this only when the tablet cannot open the Home Assistant sidebar or Ingress URL. In the app options, enable **Direct HTTPS**, set the `public_url` to the origin the tablet will use, and provide certificate and private-key paths under `/ssl`. The mapped `/ssl` directory is read-only. EverDash validates that the paths stay inside `/ssl` and that the certificate and key can be loaded before listening on port `8443`. Install a certificate whose subject names match `public_url` and whose issuing CA is trusted by the tablet. Do not expose the plain HTTP management port to a LAN or the internet.

The direct listener has a separate device-pairing gate. Open the configured HTTPS URL, complete pairing through the authenticated Home Assistant Ingress screen, and revoke devices you no longer trust. Home Assistant Ingress remains the management path for settings and pairing approvals.

## Persistence, upgrades, and access

Home Assistant stores EverDash's configuration and device sessions under `/data` and includes app data in Home Assistant backups. Create a backup before an upgrade. The JSON dashboard is the explicit allowlist for visible entities and controllable services; household members who can use the dashboard can see those configured readings and operate configured controls. Protect the Home Assistant account and tablet itself accordingly.

EverDash has no independent password database: Home Assistant protects the management surface, while pairing grants a revocable dashboard session. App logs should not contain the Supervisor token. Do not share backups publicly; they can contain dashboard entity IDs and device sessions.

## Development server

For contributors, use Node.js 22.12 or newer and npm. `npm ci`, `npm run dev`, and `npm run build` work from a checkout. The browser app expects same-origin backend routes; local Home Assistant credentials are server-side only. Use isolated fixtures for automated tests. Do not point tests at a real Home Assistant instance because service calls may actuate physical devices.

## Legacy tablet support

The production target is Safari 12 / iOS 12. The build emits an ES5 SystemJS fallback and an ES5 service worker. For Home Screen installation, the browser needs HTTPS and the certificate must be trusted by iOS. Open the EverDash dashboard in Safari, wait for a complete online load, then use **Share → Add to Home Screen**. Visit online after an update and close/reopen all copies so the service worker can activate. Safari may evict offline data; keep a separate configuration backup.

Automated browser and bundle checks are not physical-device certification. Before announcing a release, verify pairing, touch controls, certificate trust, Home Screen launch, and offline shell behavior on an actual iOS 12 device where available.
