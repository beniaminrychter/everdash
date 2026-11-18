# Changelog

## 0.2.7

- Add Home Assistant sidebar **Ingress** (`ingress: true` on internal port `8099`, admin-only) so the EverDash builder opens directly from Home Assistant with no separate sign-in.
- Automatically connect to Home Assistant Core via `SUPERVISOR_TOKEN` when running as a Home Assistant App, keeping direct tablet traffic on port `8095` (or your configured Network port override) without Ingress session timeouts.

## 0.2.6

- Enable `host_network: true` for the Home Assistant App and bind the server dual-stack (`::` with `0.0.0.0` fallback) so `.local` mDNS hostnames work over both IPv6 and IPv4 without bridge proxy resets.
- Preserve **Network** port `8095/tcp` overrides under host networking by reading the configured port from Home Assistant Supervisor on container startup.

## 0.2.5

- Fix iOS 12 / Safari 12 standalone PWA device registration by omitting `SameSite` for WebKit 12 clients and using `SameSite=Lax` for tablet session cookies, and surface an error if a browser fails to keep the session cookie.
- Add a dimmed force-reload button in the bottom-right corner of the device registration screen to clear the service worker and app caches.

## 0.2.4

- Add Home Assistant Apps packaging (`repository.yaml` and `everdash/config.yaml`) using the published `ghcr.io/beniaminrychter/everdash` multi-architecture image.
- Expose port `8095/tcp` for the tablet dashboard (`/`) and admin builder (`/admin/`) with Web UI launch and `/health` watchdog support.
