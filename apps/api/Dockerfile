FROM oven/bun:1.3-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile || bun install

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["bun", "run", "src/main.ts"]
