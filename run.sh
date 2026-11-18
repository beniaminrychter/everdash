#!/bin/sh
set -eu
umask 077
mkdir -p /data
chown node:node /data
if [ -z "${EVERDASH_PORT:-}" ] && { [ -n "${SUPERVISOR_SOCKET:-}" ] || [ -n "${SUPERVISOR_TOKEN:-}" ]; }; then
  EVERDASH_PORT="$(node /app/dist-server/server.js --resolve-port)"
  export EVERDASH_PORT
fi
exec su-exec node:node node /app/dist-server/server.js
