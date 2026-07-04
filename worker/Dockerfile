FROM python:3.11-slim

WORKDIR /app

# Create a non-root group and user for security compliance
RUN groupadd -g 10001 workergroup && \
    useradd -u 10001 -g workergroup -m -s /bin/bash workeruser

# Install requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application script
COPY worker.py ./

# Adjust file ownership to the secure worker user
RUN chown -R workeruser:workergroup /app

# Switch to the non-root user
USER workeruser

CMD ["python", "-u", "worker.py"]
