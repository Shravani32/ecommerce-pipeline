// src/pages/PlaceOrderPage.jsx
import { useState } from "react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";

export default function PlaceOrderPage({ notify, setPage }) {
  const { data: products, loading: productsLoading } = useFetch(api.getProducts);

  const [userId,      setUserId]      = useState("");
  const [cart,        setCart]        = useState([]);   // [{product, quantity}]
  const [selectedId,  setSelectedId]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [lastOrder,   setLastOrder]   = useState(null);

  const selectedProduct = products?.find(p => p.id === selectedId);

  function addToCart() {
    if (!selectedProduct) return;
    const exists = cart.find(c => c.product.id === selectedId);
    if (exists) {
      setCart(cart.map(c =>
        c.product.id === selectedId
          ? { ...c, quantity: Math.min(c.quantity + 1, selectedProduct.stock) }
          : c
      ));
    } else {
      setCart([...cart, { product: selectedProduct, quantity: 1 }]);
    }
    setSelectedId("");
  }

  function updateQty(productId, delta) {
    setCart(cart
      .map(c => c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  }

  function removeItem(productId) {
    setCart(cart.filter(c => c.product.id !== productId));
  }

  const total = cart.reduce((sum, c) => sum + Number(c.product.price) * c.quantity, 0);

  async function handleSubmit() {
    if (!userId.trim()) { notify("Enter a User ID", "error"); return; }
    if (cart.length === 0) { notify("Add at least one item", "error"); return; }

    setSubmitting(true);
    try {
      const order = await api.placeOrder({
        user_id: userId.trim(),
        items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
      });
      setLastOrder(order);
      setCart([]);
      setUserId("");
      notify(`Order ${order.order_id.slice(0, 8)}... placed successfully!`);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Place Order</div>
        <div className="page-sub">Select products → publish to Kafka → consumers process async</div>
      </div>

      {/* Success banner */}
      {lastOrder && (
        <div style={{
          background: "var(--green-dim)", border: "1px solid rgba(46,204,113,0.3)",
          borderRadius: "var(--radius-lg)", padding: "16px 22px", marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ color: "var(--green)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              Order placed — Kafka event published
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)" }}>
              ID: {lastOrder.order_id} · Total: ₹{Number(lastOrder.total).toLocaleString("en-IN")} · Status: {lastOrder.status}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
            onClick={() => setPage("orders")}
          >
            Track order →
          </button>
        </div>
      )}

      <div className="order-form-grid">
        {/* Left: form */}
        <div>
          <div className="form-section" style={{ marginBottom: 16 }}>
            <div className="form-section-title">Customer</div>
            <div className="field">
              <label>User ID</label>
              <input
                type="text"
                placeholder="e.g. user_42"
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Add Products</div>
            <div className="field">
              <label>Select Product</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={productsLoading}
              >
                <option value="">— choose a product —</option>
                {products?.filter(p => p.stock > 0).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} · ₹{Number(p.price).toLocaleString("en-IN")} · {p.stock} left
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div style={{
                background: "var(--bg3)", borderRadius: "var(--radius)",
                padding: "10px 14px", marginBottom: 12,
                fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text2)"
              }}>
                {selectedProduct.name} — ₹{Number(selectedProduct.price).toLocaleString("en-IN")} / unit
              </div>
            )}

            <button
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={addToCart}
              disabled={!selectedId}
            >
              ⊕ Add to cart
            </button>
          </div>
        </div>

        {/* Right: cart */}
        <div className="form-section">
          <div className="form-section-title">Cart</div>

          {cart.length === 0
            ? <div className="cart-empty">No items yet. Add products from the left.</div>
            : (
              <>
                {cart.map(c => (
                  <div className="cart-item" key={c.product.id}>
                    <div className="cart-item-name">{c.product.name}</div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(c.product.id, -1)}>−</button>
                      <span className="qty-num">{c.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQty(c.product.id, +1)}
                        disabled={c.quantity >= c.product.stock}
                      >+</button>
                    </div>
                    <div className="cart-item-price">
                      ₹{(Number(c.product.price) * c.quantity).toLocaleString("en-IN")}
                    </div>
                    <button className="cart-remove" onClick={() => removeItem(c.product.id)}>✕</button>
                  </div>
                ))}

                <div className="cart-total">
                  <span className="cart-total-label">Total</span>
                  <span className="cart-total-value">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </>
            )
          }

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0 || !userId.trim()}
          >
            {submitting ? "Publishing to Kafka…" : "⊕ Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
