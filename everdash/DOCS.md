# EverDash

EverDash turns legacy tablets (including iPad running iOS 12 / Safari 12) into fast, reliable Home Assistant dashboards with a visual builder.

## Setup

1. Install and start the **EverDash** app.
2. Click **Open Web UI** (or open `http://YOUR-HA-HOST:8095/admin/`) in your browser.
3. Select or enter your Home Assistant URL (for example `http://homeassistant.local:8123` or `http://YOUR-HA-LAN-IP:8123`) and sign in with a Home Assistant administrator account.
4. Build your views, sections, and cards in the visual editor, then save.
5. Open **Devices** in the admin sidebar to copy or scan the tablet URL (`http://YOUR-HA-HOST:8095/`), open it on your tablet, and enter the one-time 6-digit registration code.

## Ports

- `8095/tcp` — Serves both the tablet dashboard (`/`) and the admin builder (`/admin/`). You can change the host port in the app's **Network** configuration if `8095` is already in use.

## Backups and recovery

EverDash stores its dashboard configuration, Home Assistant OAuth refresh credential, and registered tablet sessions under `/data`, which Home Assistant includes in app backups.

If your Home Assistant address changes and you cannot sign in to disconnect, run inside the container shell:

```sh
node /app/dist-server/server.js --reset-connection
```
