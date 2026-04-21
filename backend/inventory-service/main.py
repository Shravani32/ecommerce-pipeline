import os, json, asyncio, asyncpg
from aiokafka import AIOKafkaConsumer
from dotenv import load_dotenv

load_dotenv()

async def main():
    # Connect to Postgres
    db = await asyncpg.create_pool(dsn=os.getenv("DATABASE_URL"))
    print("[Inventory] Connected to Postgres")

    # Create Kafka consumer
    consumer = AIOKafkaConsumer(
        "order.placed",                # topic to listen to
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
        group_id="inventory-service",  # unique group ID for this service
        auto_offset_reset="earliest",  # if this is a new consumer, start from beginning
        value_deserializer=lambda v: json.loads(v.decode("utf-8"))
    )

    await consumer.start()
    print("[Inventory] Listening on topic: order.placed")

    try:
        # This loop runs forever — waiting for new messages
        async for message in consumer:
            event = message.value
            order_id = event["order_id"]
            print(f"[Inventory] Processing order {order_id}")

            # Decrement stock for each item in the order
            for item in event["items"]:
                result = await db.execute(
                    """UPDATE products
                       SET stock = stock - $1
                       WHERE id = $2 AND stock >= $1""",
                    item["quantity"],
                    item["product_id"]
                )
                if result == "UPDATE 0":
                    # Stock ran out between validation and processing
                    print(f"[Inventory] WARNING: Insufficient stock for {item['product_id']}")
                else:
                    print(f"[Inventory] Stock updated for {item['product_id']}")

            # Update order status to CONFIRMED
            await db.execute(
                "UPDATE orders SET status = 'CONFIRMED' WHERE id = $1",
                order_id
            )
            print(f"[Inventory] Order {order_id} marked CONFIRMED")

    finally:
        await consumer.stop()
        await db.close()

if __name__ == "__main__":
    asyncio.run(main())