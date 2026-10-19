FROM node:24.17.0-alpine3.24 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run build:server

FROM node:24.17.0-alpine3.24 AS runtime

ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache su-exec \
    && mkdir -p /app /data /ssl \
    && chown -R node:node /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-admin ./dist-admin
COPY --from=build --chown=node:node /app/dist-preview ./dist-preview
COPY --from=build --chown=node:node /app/dist-server ./dist-server
COPY --chown=root:root run.sh /app/run.sh
RUN chmod 755 /app/run.sh

EXPOSE 8095 8099 8443
VOLUME ["/data", "/ssl"]
ENTRYPOINT ["/app/run.sh"]
