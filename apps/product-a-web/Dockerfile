# Multi-stage production Dockerfile for product-a-web SPA
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm nx run product-a-web:build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/product-a-web/dist /usr/share/nginx/html
COPY apps/product-a-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
