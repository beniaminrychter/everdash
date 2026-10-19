# EverDash release checklist

Do not create a public release until every release blocker below has an owner and is resolved.

## Public repository and licensing

- [x] Choose and add the MIT license in the root `LICENSE` file.
- [x] Set the actual public GitHub owner/repository in `everdash/config.yaml` and root `repository.yaml`; replace all owner placeholders.
- [x] Confirm the untagged image reference matches the public GHCR namespace; Home Assistant selects the image tag from the app version. Publishing that image is still pending.
- [ ] Enable GitHub private vulnerability reporting and publish a monitored security contact.
- [ ] Review source and history for credentials, private dashboard configuration, user names, local paths, and private network addresses. Rotate exposed credentials and arrange any authorized history cleanup before publication.
- [x] Inventory current runtime dependency licenses and shipped asset attribution in [third-party notices](third-party-notices.md); re-audit after dependency or asset changes.

## Release validation

- [x] `npm ci`, `npm run check`, `npm run build`, `npm run check:compat`, `npm run build:server`, `npm run smoke:server`, and `npm run test:browser` pass on CI and in local verification (except the Docker image smoke, which runs in the tag workflow).
- [x] Review the dependency audit: the production tree is clear; the five high findings are a dev-only `braces` advisory through Ultracite, with no patched version published yet. Recheck before future releases.
- [ ] Tag matches `package.json` and `everdash/config.yaml` version (`vX.Y.Z`); release preflight confirms actual repository/image coordinates.
- [ ] Build and run a local image smoke check before multi-architecture publication.
- [ ] Publish `amd64` and `aarch64` images and confirm the versioned multi-architecture manifest resolves for both.
- [ ] Make the GHCR package public so Home Assistant can pull the image.
- [ ] Install the tagged repository in a clean Home Assistant OS test instance, pair a device, edit/save/import JSON, restart, upgrade, and restore a backup.
- [x] Confirmed no test actuated physical devices; access policy uses isolated fixtures.
- [ ] Test TLS trust, pairing, touch input, Home Screen launch, and offline shell on a physical iOS 12 / Safari 12 device where available. Document unavailable hardware checks plainly.
- [ ] Publish release notes with migration guidance and known limitations; verify the app store manifest points to the published image.

## After release

- [ ] Verify app startup and logs on a clean Home Assistant installation.
- [ ] Monitor private security reports and issue tracker.
- [ ] Keep the current stable image and recovery instructions available while preparing the next release.
