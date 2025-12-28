# ==========================================
# STAGE 1: Builder (Compiles everything)
# ==========================================
FROM python:3.10-slim as builder

WORKDIR /app

# Install build dependencies (needed for installation only)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libpq-dev \
    pkg-config \
    libcairo2-dev \
    libgirepository1.0-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# Install optimized CPU versions
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir tensorflow-cpu && \
    pip install --no-cache-dir -r requirements.txt

# ==========================================
# STAGE 2: Runtime (Final Clean Image)
# ==========================================
FROM python:3.10-slim as runtime

WORKDIR /app

# Install runtime libraries (Matches your original setup, minus build tools)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender1 \
    imagemagick \
    libpq5 \
    libcairo2 \
    libgirepository-1.0-1 \
    curl \
    # Fix ImageMagick policy
    && if [ -f /etc/ImageMagick-6/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-6/policy.xml; fi \
    && if [ -f /etc/ImageMagick-7/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-7/policy.xml; fi \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-installed Python environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Firebase credentials & App Code
COPY shortify-876e7-firebase-adminsdk-fbsvc-9193bebcff.json /app/firebase-credentials.json
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]