# ---- builder ----
FROM oven/bun:1.3.1-debian AS builder

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# ---- production builder ----
FROM builder AS production-builder
RUN bun run build

# ---- runner ----
FROM node:24-bookworm AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN addgroup --system appgroup \
  && adduser --system --ingroup appgroup appuser

COPY --from=production-builder --chown=appuser:appgroup /app/public ./public
COPY --from=production-builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=production-builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

EXPOSE 3000
CMD ["node", "server.js"]

# ---- development ----
FROM builder AS development
CMD ["bun", "run", "dev"]
