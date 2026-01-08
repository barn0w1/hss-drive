# Base stage
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install dependencies for all workspaces
ENV CI=true
RUN pnpm install --frozen-lockfile

# Build only API and its dependencies (shared)
RUN pnpm --filter @hss/api... build

# DEBUG: List the contents of dist to verify structure
RUN echo "Checking dist structure:" && find apps/api/dist -maxdepth 4

# Prune dev dependencies keeping only prod deps
RUN pnpm --filter @hss/api --prod deploy pruned --legacy

# Final Runner stage
FROM base AS runner
WORKDIR /app

# Copy pruned dependencies and built code
COPY --from=builder /usr/src/app/pruned .
COPY --from=builder /usr/src/app/apps/api/dist/apps/api/src ./dist
# Copy migration files
COPY --from=builder /usr/src/app/apps/api/drizzle ./drizzle

EXPOSE 3000
CMD ["node", "dist/index.js"]
