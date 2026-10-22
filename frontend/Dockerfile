# ==============================================================================
# LisanHealth Frontend Multi-Stage Dockerfile (Node 24 Alpine + Nginx Alpine)
# Production static web asset server with API reverse proxy
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Static Assets
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY frontend/package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source
COPY frontend/ ./

# Compile TypeScript and bundle Vite production assets
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Server
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="LisanHealth Engineering Team"
LABEL description="LisanHealth Frontend Web Server & Proxy"

# Install curl for container health check probes
RUN apk add --no-cache curl

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Health Check instruction
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/nginx-health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
