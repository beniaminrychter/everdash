# Changelog

## 0.2.4

- Add Home Assistant Apps packaging (`repository.yaml` and `everdash/config.yaml`) using the published `ghcr.io/beniaminrychter/everdash` multi-architecture image.
- Expose port `8095/tcp` for the tablet dashboard (`/`) and admin builder (`/admin/`) with Web UI launch and `/health` watchdog support.
