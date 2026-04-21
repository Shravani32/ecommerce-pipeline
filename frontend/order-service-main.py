# order-service/main.py
import os, json, asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError
from dotenv import load_dotenv
from database import connect_db, disconnect_db, get_pool

load_dotenv()

app = FastAPI(title="Order Service")

# ── CORS — allow React dev server ────────────────────────
# In production, replace "*" with your actual frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

kafka_producer = None


# ── Request schemas ──────────────────────────────────────
class OrderItem(BaseModel):
    product_id: str
    quantity: int

class CreateOrderRequest(BaseModel):
    user_id: str
    items: list[OrderItem]


# ── Startup ──────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    global kafka_producer
    await connect_db()

    for attempt in range(5):
        try:
            kafka_producer = AIOKafkaProducer(
                bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
            )
            await kafka_producer.start()
            print("Connected to Kafka")
            break
        except KafkaConnectionError:
            print(f"Kafka not ready, retry {attempt + 1}/5...")
            await asyncio.sleep(3)


# ── Shutdown ─────────────────────────────────────────────
@app.on_event("shutdown")
async def shutdown():
    if kafka_producer:
        await kafka_producer.stop()
    await disconnect_db()


# ── GET /health ──────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "order-service"}


# ── GET /products ────────────────────────────────────────
@app.get("/products")
async def list_products():
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM products ORDER BY name")
    return [dict(r) for r in rows]


# ── GET /orders — list all orders ────────────────────────
@app.get("/orders")
async def list_orders():
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 100"
    )
    return [dict(r) for r in rows]


# ── GET /orders/{id} ─────────────────────────────────────
@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    pool = get_pool()
    row = await pool.fetchrow("SELECT * FROM orders WHERE id = $1", order_id)
    if not row:
        raise HTTPException(404, "Order not found")
    return dict(row)


# ── POST /orders — create order ──────────────────────────
@app.post("/orders", status_code=201)
async def create_order(request: CreateOrderRequest):
    pool = get_pool()

    # Validate stock + build item details
    total = 0.0
    items_detail = []
    for item in request.items:
        row = await pool.fetchrow(
            "SELECT * FROM products WHERE id = $1", item.product_id
        )
        if not row:
            raise HTTPException(404, f"Product {item.product_id} not found")
        if row["stock"] < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {row['name']}")

        price = float(row["price"])
        total += price * item.quantity
        items_detail.append({
            "product_id": item.product_id,
            "name":       row["name"],
            "quantity":   item.quantity,
            "price":      price,
        })

    # Persist to Postgres first
    row = await pool.fetchrow(
        """INSERT INTO orders (user_id, items, total, status)
           VALUES ($1, $2, $3, 'PENDING') RETURNING id""",
        request.user_id,
        json.dumps(items_detail),
        total,
    )
    order_id = str(row["id"])

    # Publish to Kafka after successful DB write
    event = {
        "order_id": order_id,
        "user_id":  request.user_id,
        "items":    items_detail,
        "total":    total,
    }
    await kafka_producer.send(
        topic="order.placed",
        key=order_id,
        value=event,
    )
    print(f"Published order.placed for {order_id}")

    return {"order_id": order_id, "status": "PENDING", "total": total}
