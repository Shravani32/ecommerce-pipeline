# OrderFlow — React Frontend

Industrial-dark dashboard for the e-commerce Kafka pipeline backend.

## Pages

| Page          | Route (sidebar) | What it does                              |
|---------------|-----------------|-------------------------------------------|
| Products      | default         | Live catalog with stock levels from DB    |
| Place Order   | ⊕               | Cart UI → POST /orders → Kafka event      |
| Order Tracker | ◈               | All orders, search/filter, detail modal   |

## Stack

- React 18 + Vite
- No UI library — fully custom CSS (dark industrial theme)
- IBM Plex Mono + Syne fonts

## Setup

### 1. Make sure backend is running

```bash
cd ecommerce-pipeline
docker-compose up --build
# FastAPI must be live at http://localhost:8000
```

### 2. Install and run frontend

```bash
cd ecommerce-frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 3. Update order-service main.py for CORS + GET /orders

Copy `order-service-main.py` from this folder into your backend:

```bash
cp order-service-main.py ../ecommerce-pipeline/order-service/main.py
docker-compose up --build order-service   # rebuild just that service
```

## Project structure

```
ecommerce-frontend/
├── index.html
├── vite.config.js        ← proxy config (avoids CORS in dev)
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx            ← layout + routing + toast
    ├── index.css          ← all styles
    ├── api/
    │   └── index.js       ← all fetch calls in one place
    ├── hooks/
    │   └── useFetch.js    ← loading/error/data pattern
    └── pages/
        ├── ProductsPage.jsx
        ├── PlaceOrderPage.jsx
        └── OrdersPage.jsx
```
