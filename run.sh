#!/bin/sh
set -eu
umask 077

mkdir -p /data
chown node:node /data
exec su-exec node:node node /app/dist-server/server.js
