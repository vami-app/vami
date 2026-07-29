# Multi-stage production Dockerfile for product-a-api (BFF)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --chown=node:node --from=builder /app /app
RUN mkdir -p /app/logs && chown -R node:node /app

EXPOSE 4000
USER node
CMD ["node", "apps/product-a-api/src/bootstrap/server.js"]
