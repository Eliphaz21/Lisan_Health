# ==============================================================================
# LisanHealth Backend Multi-Stage Dockerfile (Python 3.12 Slim)
# Production-ready, non-root user execution, minimal attack surface
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install pinned Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 2: Minimal Runtime Image
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="LisanHealth Engineering Team"
LABEL description="LisanHealth FastAPI Backend Microservice"

# Install curl for container health check probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Create non-root system user & group (UID: 1001)
RUN groupadd -g 1001 lisan && \
    useradd -u 1001 -g lisan -s /bin/bash -m lisan

WORKDIR /app

# Create storage directories and set permissions
RUN mkdir -p /app/storage/uploads /app/storage/audio && \
    chown -R lisan:lisan /app

# Copy application source code
COPY --chown=lisan:lisan backend /app/backend

# Switch to non-root user
USER lisan

# Container Health Check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
