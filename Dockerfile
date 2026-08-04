# syntax=docker/dockerfile:1.4
# FAANG-Grade Multi-Stage Dockerfile for Next.js Standalone

# 1. Base Image - strict version pinning
FROM node:18.18.0-alpine AS base

# 2. Dependencies - isolated to leverage Docker cache
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Only copy package files to cache dependency installation
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder - compiles the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be provided at build time if they affect the build.
# We bypass Zod strict validation for the Docker build phase, as secrets will be injected at runtime.
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# 4. Runner - Minimal production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files for the standalone output
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start the standalone server directly, bypassing npm
CMD ["node", "server.js"]
