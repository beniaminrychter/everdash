FROM node:24.17.0-alpine3.24 AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/tablet/package.json ./apps/tablet/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY packages/dashboard/package.json ./packages/dashboard/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24.17.0-alpine3.24 AS runtime

ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache su-exec \
    && mkdir -p /app /data \
    && chown -R node:node /app
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=node:node /app/apps/tablet/package.json ./apps/tablet/package.json
COPY --from=build --chown=node:node /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=build --chown=node:node /app/apps/server/package.json ./apps/server/package.json
COPY --from=build --chown=node:node /app/packages/dashboard/package.json ./packages/dashboard/package.json
COPY --from=build --chown=node:node /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=node:node /app/packages/ui/package.json ./packages/ui/package.json
RUN corepack enable \
    && pnpm install --frozen-lockfile --prod
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-admin ./dist-admin
COPY --from=build --chown=node:node /app/dist-server ./dist-server
COPY --chown=root:root run.sh /app/run.sh
RUN chmod 755 /app/run.sh

EXPOSE 8095
VOLUME ["/data"]
ENTRYPOINT ["/app/run.sh"]
