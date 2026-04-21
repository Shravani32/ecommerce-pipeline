// src/pages/ProductsPage.jsx
import { api } from "./index";
import { useFetch } from "./useFetch";

function SkeletonCard() {
  return (
    <div className="loading-card">
      <span className="skeleton" style={{ height: 10, width: "40%", marginBottom: 12 }} />
      <span className="skeleton" style={{ height: 18, width: "70%", marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="skeleton" style={{ height: 22, width: "35%" }} />
        <span className="skeleton" style={{ height: 22, width: "25%" }} />
      </div>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === 0)  return <span className="stock-badge stock-empty">Out of stock</span>;
  if (stock <= 20)  return <span className="stock-badge stock-low">{stock} left</span>;
  return               <span className="stock-badge stock-high">{stock} in stock</span>;
}

export default function ProductsPage({ notify }) {
  const { data: products, loading, error, refetch } = useFetch(api.getProducts);

  const totalProducts = products?.length ?? 0;
  const inStock       = products?.filter(p => p.stock > 0).length ?? 0;
  const lowStock      = products?.filter(p => p.stock > 0 && p.stock <= 20).length ?? 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Product Catalog</div>
        <div className="page-sub">Live inventory from PostgreSQL</div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Products</div>
          <div className="stat-value accent">{loading ? "—" : totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Stock</div>
          <div className="stat-value green">{loading ? "—" : inStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value amber">{loading ? "—" : lowStock}</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          Failed to load products: {error}
          <button
            onClick={refetch}
            className="btn btn-ghost"
            style={{ marginLeft: 12, padding: "4px 12px", fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Products grid */}
      <div className="products-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products?.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-id">{p.id}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-meta">
                  <div className="product-price">
                    ₹{Number(p.price).toLocaleString("en-IN")}
                    <span> /unit</span>
                  </div>
                  <StockBadge stock={p.stock} />
                </div>
              </div>
            ))
        }
      </div>

      {!loading && !error && products?.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          No products found. Check your database seed.
        </div>
      )}
    </div>
  );
}
