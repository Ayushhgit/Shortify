# Base Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by moviepy and other packages
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender1 \
    imagemagick \
    build-essential \
    gcc \
    libpq-dev \
    curl \
    pkg-config \
    libcairo2-dev \
    libgirepository1.0-dev \
    && if [ -f /etc/ImageMagick-6/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-6/policy.xml; fi \
    && if [ -f /etc/ImageMagick-7/policy.xml ]; then sed -i 's/rights="none"/rights="read|write"/g' /etc/ImageMagick-7/policy.xml; fi \
    && rm -rf /var/lib/apt/lists/*
    
# Set Firebase credentials
COPY shortify-876e7-firebase-adminsdk-fbsvc-9193bebcff.json /app/firebase-credentials.json

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip and install Python dependencies with verbose output
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -v -r requirements.txt

# Copy application source code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]