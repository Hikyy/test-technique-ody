# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY turbo.json tsconfig.base.json biome.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY db/package.json db/package.json
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo /repo
COPY . .
RUN pnpm turbo run build --filter=@ody/api

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3001
RUN apk add --no-cache tini wget
RUN addgroup -g 1001 -S nodejs && adduser -S api -u 1001
COPY --from=build --chown=api:nodejs /repo/apps/api/dist /app/apps/api/dist
COPY --from=build --chown=api:nodejs /repo/apps/api/package.json /app/apps/api/package.json
COPY --from=build --chown=api:nodejs /repo/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build --chown=api:nodejs /repo/db /app/db
COPY --from=build --chown=api:nodejs /repo/packages /app/packages
COPY --from=build --chown=api:nodejs /repo/node_modules /app/node_modules
COPY --from=build --chown=api:nodejs /repo/package.json /app/package.json
COPY --from=build --chown=api:nodejs /repo/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --chmod=0755 apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
USER api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/src/main.js"]
