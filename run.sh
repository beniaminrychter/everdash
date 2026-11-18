#!/bin/sh
set -eu
umask 077
mkdir -p /data
chown node:node /data
if [ -n "${SUPERVISOR_SOCKET:-}" ] || [ -n "${SUPERVISOR_TOKEN:-}" ]; then
  if [ -z "${EVERDASH_PORT:-}" ]; then
    EVERDASH_PORT="$(node /app/dist-server/server.js --resolve-port)"
    export EVERDASH_PORT
  fi
  if [ -z "${EVERDASH_INGRESS_PORT:-}" ]; then
    EVERDASH_INGRESS_PORT="$(node /app/dist-server/server.js --resolve-ingress-port)"
    export EVERDASH_INGRESS_PORT
  fi
fi
exec su-exec node:node node /app/dist-server/server.js
