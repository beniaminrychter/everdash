# Backup and recovery

## Dashboard configuration

Use **Download JSON** in EverDash's management screen before major edits or upgrades. Keep copies somewhere private and outside the app's own data directory. An export includes entity IDs, labels, and layout, so it can reveal details about your home.

To restore only the dashboard, choose **Import JSON**, select the saved file, inspect the validation result, then save. EverDash validates the whole document before replacing the active revision; a rejected import leaves the last valid configuration in place. If the running dashboard has not picked up a saved change yet, wait for its revision update or reload it.

## Full Home Assistant recovery

Create and test Home Assistant backups using its normal backup process. EverDash stores JSON configuration and pairing/session records in the app's persistent data directory, which the Home Assistant app manager includes in app backups. Stop EverDash before manually copying data. Restore the Home Assistant backup, start the app, confirm that the dashboard loads, and pair the tablet again if needed. Do not edit the session database by hand.

## Lost or retired tablet

From the authenticated Ingress management screen, revoke the tablet's paired session. The tablet should lose access on its next request. Clear EverDash's website data from Safari on the old device before handing it to someone else. Pair the replacement from the management screen and verify the new device label.

## Server or certificate issue

Open EverDash from the Home Assistant sidebar and check the app log and health state. Ingress management remains available if optional direct HTTPS certificate validation fails. For direct access, check that the configured certificate and key paths are readable under `/ssl`, the certificate matches the configured public hostname, the iPad trusts its issuer, and port `8443` is reachable on the local network. Do not disable certificate validation or switch to plain HTTP as a workaround.
