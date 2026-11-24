# backend/Dockerfile
FROM python:3.11-slim

# System libraries required by librosa / soundfile for WAV decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for better Docker layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend and ML pipeline source code
COPY backend/ /app/backend/
COPY ml_pipeline/ /app/ml_pipeline/

ENV PYTHONPATH=/app
WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]