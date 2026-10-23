# Changelog

## 0.2.1

- Refine the Home Assistant dashboard builder with shadcn controls, toast feedback, and clearer card and badge actions.
- Preserve tablet card rendering in the editor preview and improve weather and sensor reading updates.

## 0.2.0

- Replace the Home Assistant JSON-first screen with a visual builder for views, cards, badges, and dashboard settings; keep validated JSON editing optional.
- Add a searchable entity catalogue, tablet registration and revocation, LAN URL discovery, and a read-only preview using the actual tablet renderer.
- Split the React/shadcn Home Assistant workspace and preview from the iOS 12-compatible Preact tablet build.
- Serve the tablet dashboard over the mapped local HTTP port 8095, retain optional trusted HTTPS on 8443, and keep management behind Ingress on 8099.
- Move project documentation and notices out of the tracked `docs/` directory while keeping local docs ignored.

## 0.1.2

- Read Home Assistant's root-only options file securely before starting the app as the unprivileged `node` user.
- Test container startup with the default `/data/options.json` path and Home Assistant's `0600` file permissions.

## 0.1.1

- Leave the optional direct HTTPS host port unmapped by default so it cannot conflict with another app.
- Document how to expose direct HTTPS on an available host port when it is enabled.

## 0.1.0

- Initial EverDash Home Assistant app package.
- Add Home Assistant Ingress management and optional paired direct HTTPS access.
- Persist dashboard JSON, previous configuration, and revocable device sessions under `/data`.
