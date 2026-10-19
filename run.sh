#!/bin/sh
set -eu
umask 077

mkdir -p /data
chown node:node /data
mkdir -p /run/everdash
cp /data/options.json /run/everdash/options.json
chown node:node /run/everdash/options.json
chmod 600 /run/everdash/options.json
export EVERDASH_OPTIONS_FILE=/run/everdash/options.json
exec su-exec node:node node /app/dist-server/server.js
