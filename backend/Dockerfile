# ===========================
# Stage 1 - Build environment
# ===========================
FROM python:3.10-slim AS builder

WORKDIR /app

# Install system dependencies for building Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libpq-dev \
    pkg-config \
    libcairo2-dev \
    libgirepository1.0-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Upgrade pip and install dependencies to a temporary folder
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ===========================
# Stage 2 - Runtime environment
# ===========================
FROM python:3.10-slim

WORKDIR /app

# Install only runtime system dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender1 \
    imagemagick \
    curl \
    && if [ -f /etc/ImageMagick-6/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-6/policy.xml; fi \
    && if [ -f /etc/ImageMagick-7/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-7/policy.xml; fi \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Set Firebase credentials
COPY shortify-876e7-firebase-adminsdk-fbsvc-9193bebcff.json /app/firebase-credentials.json

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
