# Security policy

## Supported versions

Security fixes are targeted at the latest published EverDash release. Update to the latest release before requesting help with an older version.

## Reporting a vulnerability

Please do not publish an unpatched vulnerability in a public issue. Use [GitHub's private vulnerability reporting](https://github.com/beniaminrychter/everdash/security/advisories/new), or email the monitored security contact at [contact@everdash.app](mailto:contact@everdash.app). Do not attach Home Assistant backups, credentials, or real entity lists to a report.

## Security boundaries

The Supervisor token is server-only and must never be added to frontend environment variables or static files. Management relies on Home Assistant Ingress authorization. Direct HTTPS is optional and requires a valid certificate trusted by each client. Paired dashboard sessions are private to the app and revocable from management. The explicit JSON dashboard determines which entity readings are exposed and which configured controls can issue services.

When reporting an incident, include the EverDash version, Home Assistant version, installation mode (Ingress or direct HTTPS), and a concise reproduction. Redact hostnames, entity IDs, tokens, and device/session data.
