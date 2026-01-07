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
RUN pnpm install --frozen-lockfile

# Build everything
RUN pnpm -r build

# Prune dev dependencies keeping only prod deps
RUN pnpm --filter @hss/api --prod deploy pruned

# Final Runner stage
FROM base AS runner
WORKDIR /app

# Copy pruned dependencies and built code
COPY --from=builder /usr/src/app/pruned .
COPY --from=builder /usr/src/app/apps/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
