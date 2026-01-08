# Base stage
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
WORKDIR /app

# Cache dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

# Build application
COPY . .
RUN pnpm install --offline --frozen-lockfile
RUN pnpm --filter @hss/api... build

# Prune for production
RUN pnpm --filter @hss/api --prod deploy pruned --legacy

# Final Runner stage
FROM base AS runner
WORKDIR /app

# Use non-root user for security
USER node

# Copy pruned dependencies
COPY --from=builder --chown=node:node /app/pruned .

# Copy build artifacts
# Flattening the nested structure caused by monorepo compilation
COPY --from=builder --chown=node:node /app/apps/api/dist/apps/api/src ./dist
COPY --from=builder --chown=node:node /app/apps/api/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/index.js"]
