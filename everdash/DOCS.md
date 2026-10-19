# EverDash Home Assistant app

EverDash serves a dashboard through Home Assistant Ingress and can optionally serve paired tablets over HTTPS. Home Assistant provides the API credential to the app; there is no token field to copy into EverDash.

## Install

Add the EverDash repository to Home Assistant's app store. In the app store menu, choose **Check for updates** if EverDash does not appear yet, then install it. Start it, then open **EverDash** from the Home Assistant sidebar. The first start creates an empty dashboard. Open Settings → Dashboard configuration to import a JSON file or edit the configuration, validate it, and save it.

The repository and image coordinates are set for the public EverDash project. The app appears in the store before release, but installation requires a published, public versioned image in GitHub Container Registry.

## Optional direct HTTPS access

Ingress is the management surface. To serve the dashboard directly to a tablet:

1. Place a TLS certificate and its private key in Home Assistant's `/ssl` directory.
2. In the EverDash app configuration, enable **Direct HTTPS**, enter the public HTTPS origin, and enter the certificate and key paths under `/ssl`.
3. Map the app's port 8443 to a port reachable by the tablet. Configure the router and DNS so the public origin resolves to that address.
4. Restart EverDash, then visit the HTTPS origin in Safari and explicitly start pairing.
5. Make sure Safari trusts the certificate, open the HTTPS origin, and approve the pairing code under Settings → Tablet access in Home Assistant Ingress.

Direct access remains disabled when its URL, certificate, key, or TLS validation is missing or invalid. The management Ingress listener remains available so these settings can be corrected.

## Data and recovery

The app stores the validated dashboard in `/data/dashboard.json`, its previous valid revision in `/data/dashboard.previous.json`, and hashed paired-device sessions in `/data/devices.json`. Home Assistant cold backups include these files. Keep a separate copy of the dashboard JSON export before major edits.

If the current dashboard is corrupt, EverDash recovers the previous valid copy and reports that state. If both copies are invalid, restore a valid dashboard JSON using the management recovery flow or restore the Home Assistant backup. The app never replaces damaged configuration with household example data.
