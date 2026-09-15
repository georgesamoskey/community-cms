# syntax=docker/dockerfile:1.6
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=768" \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_PORTAL_URL=http://localhost:3003
ARG NEXT_PUBLIC_BACKOFFICE_URL=http://localhost:3001
ARG NEXT_PUBLIC_EAGASEKE_ORIGIN=http://localhost:3000
ENV NEXT_PUBLIC_PORTAL_URL=$NEXT_PUBLIC_PORTAL_URL \
    NEXT_PUBLIC_BACKOFFICE_URL=$NEXT_PUBLIC_BACKOFFICE_URL \
    NEXT_PUBLIC_EAGASEKE_ORIGIN=$NEXT_PUBLIC_EAGASEKE_ORIGIN

RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3004 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Contenu éditable (volume bind-mount en prod)
COPY --from=builder /app/src/content ./src/content

EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3004/ || exit 1
CMD ["node", "server.js"]
