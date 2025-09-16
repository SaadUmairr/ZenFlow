# --- Dependencies stage ---
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline


# --- Build stage ---
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build


# --- Runtime stage ---
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat \
  && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only runtime essentials
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["pnpm", "start"]
