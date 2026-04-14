import os, json, asyncio
from aiokafka import AIOKafkaConsumer
from dotenv import load_dotenv

load_dotenv()

async def send_email_mock(to_user: str, order_id: str, total: float):
    # In real life: use SendGrid, AWS SES, or SMTP
    # For now: just print — you can see this in docker logs
    print(f"""
[Notification] Email sent!
  To:      user_{to_user}@example.com
  Subject: Your order {order_id} is confirmed
  Body:    Order total ₹{total:.2f} placed successfully.
           We will ship within 2-3 business days.
""")

async def main():
    consumer = AIOKafkaConsumer(
        "order.placed",
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "kafka:29092"),
        group_id="notification-service",   # different group = own copy of every message
        auto_offset_reset="earliest",
        value_deserializer=lambda v: json.loads(v.decode("utf-8"))
    )

    await consumer.start()
    print("[Notification] Listening on topic: order.placed")

    try:
        async for message in consumer:
            event = message.value
            await send_email_mock(
                to_user=event["user_id"],
                order_id=event["order_id"],
                total=event["total"]
            )
    finally:
        await consumer.stop()

if __name__ == "__main__":
    asyncio.run(main())