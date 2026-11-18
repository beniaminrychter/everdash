# EverDash

EverDash turns legacy tablets (including iPad running iOS 12 / Safari 12) into fast, reliable Home Assistant dashboards with a visual builder.

## Setup

1. Install and start the **EverDash** app.
2. Click **Open Web UI** or open **EverDash** from your Home Assistant sidebar — no separate Home Assistant URL setup or sign-in is required.
3. Build your views, sections, and cards in the visual editor, then save.
4. Open **Devices** in the EverDash sidebar to copy or scan the tablet URL (`http://YOUR-HA-HOST:8095/`), open it on your tablet, and enter the one-time 6-digit registration code.

## Network

- `8095/tcp` — Direct HTTP server for the tablet dashboard (`/`) and standalone admin builder (`/admin/`). You can override this port in the app's **Network** configuration if `8095` is already in use; EverDash runs on the host network (IPv4 and IPv6) and reads your configured port on startup.
- Sidebar access uses Home Assistant Ingress automatically (`8099` internal proxy port) and requires no additional port forwarding.

## Backups and recovery

EverDash stores its dashboard configuration, Home Assistant OAuth refresh credential, and registered tablet sessions under `/data`, which Home Assistant includes in app backups.

If your Home Assistant address changes and you cannot sign in to disconnect, run inside the container shell:

```sh
node /app/dist-server/server.js --reset-connection
```
