import { useState } from "react";
import ProductsPage from "./ProductsPage";
import OrdersPage from "./OrdersPage";
import PlaceOrderPage from "./PlaceOrderPage";
import "./index.css";

const NAV = [
  { id: "products", label: "Products", icon: "▦" },
  { id: "place-order", label: "Place Order", icon: "⊕" },
  { id: "orders", label: "Order Tracker", icon: "◈" },
];

export default function App() {
  const [page, setPage] = useState("products");
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="app">
      {/* Ambient background grid */}
      <div className="bg-grid" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">⬡</span>
          <div>
            <div className="brand-name">OrderFlow</div>
            <div className="brand-sub">Kafka Pipeline</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-row">
            <span className="status-dot online" />
            <span className="status-text">API Connected</span>
          </div>
          <div className="status-row">
            <span className="status-dot online" />
            <span className="status-text">Kafka Live</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {page === "products"    && <ProductsPage notify={notify} />}
        {page === "place-order" && <PlaceOrderPage notify={notify} setPage={setPage} />}
        {page === "orders"      && <OrdersPage notify={notify} />}
      </main>

      {/* Toast notification */}
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          <span className="toast-icon">{notification.type === "success" ? "✓" : "✕"}</span>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
