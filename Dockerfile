FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Create a dummy .env for build time (Prisma only needs this to generate client)
# Real variables will be injected by Railway at runtime
RUN echo 'DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"' > .env && \
    echo 'DIRECT_URL="postgresql://dummy:dummy@localhost/dummy"' >> .env
# Generate Prisma client (no database validation needed)
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

# Las variables de entorno se pasan en runtime por Railway
ENTRYPOINT ["/app/docker-entrypoint.sh"]
