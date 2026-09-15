# syntax=docker/dockerfile:1.6
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_PORTAL_URL=http://localhost:3003
ARG NEXT_PUBLIC_BACKOFFICE_URL=http://localhost:3001
ARG NEXT_PUBLIC_EAGASEKE_ORIGIN=http://localhost:3000
ENV NEXT_PUBLIC_PORTAL_URL=$NEXT_PUBLIC_PORTAL_URL \
    NEXT_PUBLIC_BACKOFFICE_URL=$NEXT_PUBLIC_BACKOFFICE_URL \
    NEXT_PUBLIC_EAGASEKE_ORIGIN=$NEXT_PUBLIC_EAGASEKE_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3004 \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./

# Pas de USER non-root : volumes contenu/uploads CMS en bind-mount
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3004/ || exit 1
CMD ["npx", "next", "start", "-p", "3004"]
