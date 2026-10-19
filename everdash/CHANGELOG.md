# Changelog

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
