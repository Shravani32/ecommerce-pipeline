# Create README.md in project root
cat > README.md << 'EOF'
# E-Commerce Order Pipeline — Kafka + FastAPI + Docker

A production-style async order processing system inspired by Amazon's
order pipeline. Built with FastAPI, Apache Kafka, PostgreSQL, and Docker.

## Architecture

```
Client → API Gateway → Order Service → Kafka (order.placed topic)
                                           ↓              ↓
                                  Inventory Service  Notification Service
                                  (decrements stock) (sends email)
```

## Tech Stack

| Layer        | Tool                  |
|--------------|-----------------------|
| API          | FastAPI (Python)      |
| Message bus  | Apache Kafka          |
| Database     | PostgreSQL 15         |
| Cache        | Redis (optional)      |
| Containers   | Docker + Compose      |

## How to run locally

### Prerequisites
- Docker and docker-compose installed

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ecommerce-kafka-pipeline.git
cd ecommerce-kafka-pipeline

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values if needed

# 3. Start everything
docker-compose up --build

# 4. API is live at http://localhost:8000
```

## API Endpoints

| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| GET    | /health            | Health check        |
| GET    | /products          | List all products   |
| POST   | /orders            | Place a new order   |
| GET    | /orders/{id}       | Get order status    |

### Example: Place an order

```bash
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_42",
    "items": [
      {"product_id": "PROD001", "quantity": 1}
    ]
  }'
```

## Key concepts demonstrated

- **Event-driven architecture** — order service publishes, consumers react
- **Decoupling** — slow email service never blocks checkout
- **Consumer groups** — inventory and notification each get every event
- **Persist-then-publish** — DB write always before Kafka publish
- **Docker networking** — all services on shared internal network

## What I would improve at scale

- Add Redis for product catalog caching
- Implement the outbox pattern for guaranteed delivery
- Add Kafka Schema Registry for event validation
- Horizontal scaling with multiple consumer instances
EOF