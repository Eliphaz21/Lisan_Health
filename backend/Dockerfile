# ==============================================================================
# LisanHealth Backend Multi-Stage Dockerfile (TypeScript + Express)
# Production-ready, non-root user execution, minimal attack surface
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Runtime Image
# ------------------------------------------------------------------------------
FROM node:24-alpine AS runtime

LABEL maintainer="LisanHealth Engineering Team"
LABEL description="LisanHealth TypeScript Express Backend Microservice"
ENV NODE_ENV=production
WORKDIR /app/backend

# Apply the latest security patches available in the pinned Alpine release.
RUN apk upgrade --no-cache

# Create non-root system user & group (UID: 1001)
RUN addgroup -S -g 10001 lisan && adduser -S -u 10001 -G lisan lisan

# Create storage directories and set permissions
RUN mkdir -p /app/storage/uploads /app/storage/audio && chown -R lisan:lisan /app

# Copy application source code
COPY --from=builder /build/backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /build/backend/dist ./dist
RUN chown -R lisan:lisan /app/backend

# Switch to non-root user
USER lisan

# Container Health Check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/api/v1/health || exit 1

EXPOSE 8000

CMD ["node", "dist/server.js"]
