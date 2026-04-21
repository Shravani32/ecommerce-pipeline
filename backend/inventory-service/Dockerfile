FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Consumers are plain Python scripts, not HTTP servers
CMD ["python", "main.py"]