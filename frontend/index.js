// src/api/index.js
// All backend calls centralized here.
// Change BASE_URL if your FastAPI runs on a different port.

const BASE_URL = "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProducts:  ()           => request("/products"),
  getOrders:    ()           => request("/orders"),
  getOrder:     (id)         => request(`/orders/${id}`),
  placeOrder:   (body)       => request("/orders", { method: "POST", body: JSON.stringify(body) }),
  healthCheck:  ()           => request("/health"),
};
