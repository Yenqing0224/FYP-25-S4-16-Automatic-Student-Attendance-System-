# Use Python 3.10 Slim
FROM python:3.10-slim

# Force logs to show up immediately
ENV PYTHONUNBUFFERED=True

# Install system libraries (Required for OpenCV)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Start Server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]