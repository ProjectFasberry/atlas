# syntax=docker/dockerfile:1

# Wiki app of the atlas monorepo: Next.js 16 standalone + PostgreSQL.
# The build context is the repository root (see .github/workflows/build-wiki.yml).
ARG NODE_VERSION=26

FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@12.4.2

# --- dependencies: the whole workspace, so the shared lockfile stays valid ---
FROM base AS deps
WORKDIR /app
COPY . .
# Optional GitHub Packages token for private @projectfasberry packages.
RUN --mount=type=secret,id=npm_token \
    sh -c 'if [ -s /run/secrets/npm_token ]; then printf "@projectfasberry:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=%s\nalways-auth=true\n" "$(cat /run/secrets/npm_token)" > /root/.npmrc; fi' \
    && pnpm install --frozen-lockfile --filter wiki... --ignore-scripts

# --- build: no database access, every page is dynamic ---
FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=https://wiki.fasberry.fun
ENV NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN pnpm --filter wiki build

# --- runtime: standalone output only ---
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    WIKI_MIGRATIONS_DIR=/app/apps/wiki/drizzle

RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# npm and corepack are only needed while building; dropping them shrinks the
# runtime and removes their bundled dependencies (and their CVEs) entirely
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --from=builder --chown=nextjs:nodejs /app/apps/wiki/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/wiki/.next/static ./apps/wiki/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/wiki/public ./apps/wiki/public
# migrations are applied by the app on start (lib/db.ts)
COPY --from=builder --chown=nextjs:nodejs /app/apps/wiki/drizzle ./apps/wiki/drizzle

WORKDIR /app/apps/wiki
USER nextjs
EXPOSE 3000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "server.js"]
