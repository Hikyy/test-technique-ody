# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /repo
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY turbo.json tsconfig.base.json biome.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY db/package.json db/package.json
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY --from=deps /repo /repo
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @ody/web build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone /app
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static /app/apps/web/.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/login || exit 1
CMD ["node", "apps/web/server.js"]
