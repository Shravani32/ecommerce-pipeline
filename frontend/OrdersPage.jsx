// src/pages/OrdersPage.jsx
import { useState } from "react";
import { api } from "../api";
import { useFetch } from "../hooks/useFetch";

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function OrderModal({ order, onClose }) {
  const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Order Details</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
              {order.id}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="detail-row">
          <span className="detail-key">User</span>
          <span className="detail-val">{order.user_id}</span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Status</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="detail-row">
          <span className="detail-key">Total</span>
          <span className="detail-val" style={{ color: "var(--accent2)", fontSize: 15 }}>
            ₹{Number(order.total).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-key">Created</span>
          <span className="detail-val">{new Date(order.created_at).toLocaleString("en-IN")}</span>
        </div>

        {/* Items */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--text3)", marginBottom: 10
          }}>
            Items
          </div>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid var(--border)",
              fontSize: 13
            }}>
              <span style={{ color: "var(--text)" }}>{item.name || item.product_id}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        {/* Kafka pipeline status */}
        <div style={{
          marginTop: 20, background: "var(--bg3)", borderRadius: "var(--radius)",
          padding: "12px 14px"
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10
          }}>
            Kafka pipeline
          </div>
          {[
            { label: "order.placed published", done: true },
            { label: "inventory-service consumed", done: order.status !== "PENDING" },
            { label: "notification-service consumed", done: order.status !== "PENDING" },
            { label: "status → CONFIRMED", done: order.status === "CONFIRMED" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5px 0", fontSize: 12, fontFamily: "var(--font-mono)"
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                background: step.done ? "var(--green-dim)" : "var(--surface2)",
                border: `1px solid ${step.done ? "var(--green)" : "var(--border2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: step.done ? "var(--green)" : "var(--text3)",
                flexShrink: 0
              }}>
                {step.done ? "✓" : "○"}
              </span>
              <span style={{ color: step.done ? "var(--text2)" : "var(--text3)" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage({ notify }) {
  const { data: orders, loading, error, refetch } = useFetch(api.getOrders);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [selected, setSelected] = useState(null);

  const filtered = (orders ?? [])
    .filter(o => filter === "ALL" || o.status === filter)
    .filter(o =>
      o.id.includes(search) ||
      o.user_id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const counts = {
    ALL:       orders?.length ?? 0,
    PENDING:   orders?.filter(o => o.status === "PENDING").length ?? 0,
    CONFIRMED: orders?.filter(o => o.status === "CONFIRMED").length ?? 0,
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="page-title">Order Tracker</div>
          <div className="page-sub">Real-time order status from PostgreSQL</div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={refetch}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value accent">{loading ? "—" : counts.ALL}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value green">{loading ? "—" : counts.CONFIRMED}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value amber">{loading ? "—" : counts.PENDING}</div>
        </div>
      </div>

      {error && (
        <div className="error-box">
          Could not load orders: {error}
        </div>
      )}

      {/* Search + filter */}
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by order ID or user ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {["ALL", "PENDING", "CONFIRMED", "FAILED"].map(f => (
          <button
            key={f}
            className="btn btn-ghost"
            style={{
              padding: "8px 14px", fontSize: 12,
              borderColor: filter === f ? "var(--accent)" : undefined,
              color: filter === f ? "var(--accent2)" : undefined,
            }}
            onClick={() => setFilter(f)}
          >
            {f} {f !== "ALL" && <span style={{ marginLeft: 4, opacity: 0.6 }}>({counts[f] ?? 0})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <span className="skeleton" style={{ height: 14, flex: 2 }} />
                <span className="skeleton" style={{ height: 14, flex: 1 }} />
                <span className="skeleton" style={{ height: 14, flex: 1 }} />
                <span className="skeleton" style={{ height: 14, width: 80 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: "60px 0", textAlign: "center",
            color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 13
          }}>
            {orders?.length === 0 ? "No orders yet. Place your first order." : "No orders match the filter."}
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                  <td className="order-id-cell">{o.id.slice(0, 8)}…</td>
                  <td>{o.user_id}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                    ₹{Number(o.total).toLocaleString("en-IN")}
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text3)" }}>
                    {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ color: "var(--text3)", fontSize: 16 }}>›</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
