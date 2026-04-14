import os
import asyncpg

# Global pool — shared across all requests
# A pool keeps N connections open, reuses them
db_pool = None

async def connect_db():
    global db_pool
    db_pool = await asyncpg.create_pool(
        dsn=os.getenv("DATABASE_URL"),
        min_size=2,    # keep at least 2 connections open
        max_size=10    # don't open more than 10
    )
    print("Connected to PostgreSQL")

async def disconnect_db():
    global db_pool
    if db_pool:
        await db_pool.close()

def get_pool():
    return db_pool