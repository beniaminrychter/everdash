# Migrate to EverDash JSON configuration

EverDash dashboard configuration is a versioned JSON document. It contains entity IDs, view/card ordering, labels, optional icons, and polling/timezone settings. It does not contain a Home Assistant URL, token, username, or password. The Home Assistant app obtains its API access from Supervisor.

## Export a previous typed dashboard

If your earlier dashboard used `home.config.ts`, use the repository's converter while in the project checkout:

```sh
npm ci
npm run config:export -- /path/to/home.config.ts /path/to/dashboard.json
```

For the original local file, `npm run config:export` reads `.local/home.config.ts` and writes `.local/dashboard.json`. The converter validates the generated version 1 JSON. Review it before importing; invalid or unsupported entity IDs are reported instead of guessed. Treat the exported file as household configuration because it contains entity IDs and labels.

In EverDash's management screen, download the current JSON as a backup or import the exported file. The visual entity selector and arrangement editor update the same JSON document. Save and confirm the revision before opening the dashboard on a tablet.

## Move from Vite environment credentials

Older development setups may have used `VITE_*` values for a Home Assistant URL or long-lived token. EverDash does not read or build these values into the browser. The Home Assistant app uses Supervisor's server-only credential. Remove old token values from `.env`, shell profiles, hosting settings, build logs, and deployment secrets after the migration.

If a token was ever committed, consider it disclosed even if the file was later deleted. Revoke it in Home Assistant and create a replacement only if another trusted client still needs one. Removing the file in a new commit does not erase the prior Git history. Review every branch and tag; arrange a deliberate history rewrite and coordinate all clones before publishing if a credential was exposed. Never run automatic history cleanup as part of a routine release.

## Preserve a previous dashboard

Before replacing a config, download its JSON from the management screen and store it in a private backup location. If an import is invalid, the server rejects it and preserves the last valid revision. Import the saved JSON to restore it. For server recovery, stop the app, restore the Home Assistant backup containing EverDash app data, then start the app and verify configuration and pairing. Re-pair a tablet if its session was not part of the restored app data or has been revoked.
