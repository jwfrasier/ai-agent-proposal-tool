FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && npm ci \
 && apt-get purge -y python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-only placeholders so lib/config.ts passes validation during `next build`.
# Real values are injected at runtime via `fly secrets`.
ENV ANTHROPIC_API_KEY=build-placeholder \
    SAM_GOV_API_KEY=build-placeholder \
    CRON_SECRET=build-placeholder-1234 \
    DAILY_COST_CAP_USD=2.00 \
    DATABASE_URL=/tmp/build-only.db \
    NODE_ENV=production
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/data/govcontracts.db \
    PDF_OUTPUT_DIR=/data/pdfs
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/lib ./lib
RUN mkdir -p /data
EXPOSE 3000
# Migrate on container start, then serve.
CMD ["sh", "-c", "npx tsx lib/db/migrate.ts && node node_modules/next/dist/bin/next start -p 3000"]
