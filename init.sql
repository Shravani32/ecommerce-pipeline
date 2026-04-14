CREATE TABLE IF NOT EXISTS products (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10,2) NOT NULL,
    stock       INT DEFAULT 100
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     VARCHAR(50) NOT NULL,
    items       JSONB NOT NULL,
    total       DECIMAL(10,2),
    status      VARCHAR(20) DEFAULT 'PENDING',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Seed some products so we can test
INSERT INTO products (id, name, price, stock) VALUES
    ('PROD001', 'Laptop',     75000.00, 50),
    ('PROD002', 'Mouse',       500.00, 200),
    ('PROD003', 'Keyboard',   1500.00, 150)
ON CONFLICT DO NOTHING;