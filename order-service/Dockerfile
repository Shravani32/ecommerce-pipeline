# order-service/Dockerfile
# Step 1: Start from official Python 3.11 slim image
# "slim" = smaller size, no extra tools you don't need
FROM python:3.11-slim

# Step 2: Set working directory inside the container
# All following commands run from /app
WORKDIR /app

# Step 3: Copy requirements FIRST (before code)
# Why? Docker caches each step. If only your .py files
# change, Docker reuses the pip install cache. Faster builds.
COPY requirements.txt .

# Step 4: Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy all your source code into /app
COPY . .

# Step 6: Run the app when container starts
# --host 0.0.0.0 = listen on all interfaces (not just localhost)
# Without 0.0.0.0, the app is unreachable from outside the container!
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]