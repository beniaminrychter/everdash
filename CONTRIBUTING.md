# Contributing to EverDash

Thanks for helping make older screens useful again. Please open an issue to discuss a substantial behavior or architecture change before sending a large patch.

## Development setup

- Use Node.js 22.12+ and npm.
- Run `npm ci` and `npm run dev` for local development.
- Keep the Safari 12 / iOS 12 target in mind for authored JavaScript, CSS, dependencies, and build output.
- Keep entity IDs explicit. Do not add fabricated readings, hidden entity discovery, browser-side Home Assistant credentials, or automatic service calls.
- Place feature components and styles together under their owning `src/features/` directory. Keep shared modules independent of feature code.

## Validation

Run the relevant checks before submitting:

```sh
npm run format
npm run lint
npm run format:check
npm run typecheck
npm run typecheck:server
npm test
npm run build
npm run check:compat
npm run build:server
npm run smoke:server
npm run test:browser
```

Browser/server tests use isolated fixtures. Never run test commands with a real Home Assistant token or real entity service endpoint: a control test can operate real equipment. Changes to touch, TLS, Home Screen, or offline behavior need a physical iOS 12 check where hardware is available.

## Pull requests

Describe the user-visible behavior, the checks you ran, and any remaining device or Home Assistant validation. Keep config examples generic. Do not include `.env`, `.local/`, Home Assistant backups, personal entity IDs, screenshots showing household data, or access tokens. Report security issues privately using [SECURITY.md](SECURITY.md).
