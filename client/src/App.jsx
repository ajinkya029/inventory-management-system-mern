import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Package,
  Boxes,
  CircleAlert,
  Search,
  Plus,
  Download,
  Bell,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Warehouse,
  TrendingUp,
  ListFilter,
  LoaderCircle,
  RefreshCw,
  Minus,
  Check,
  LogOut,
  LockKeyhole,
} from "lucide-react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stockwise_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const initialStats = {
  productCount: 0,
  totalUnits: 0,
  inventoryValue: 0,
  lowStock: 0,
  categories: 0,
};
export default function App() {
  const [token, setToken] = useState(
      () => localStorage.getItem("stockwise_token") || "",
    ),
    [user, setUser] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("stockwise_user") || "null");
      } catch {
        return null;
      }
    });
  const [page, setPage] = useState("overview");
  const [warehouses, setWarehouses] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("stockwise_warehouses") || "null") || [
          {
            id: 1,
            name: "Main Warehouse",
            location: "Mumbai, Maharashtra",
            capacity: 1200,
            used: 845,
          },
          {
            id: 2,
            name: "West Distribution Center",
            location: "Pune, Maharashtra",
            capacity: 800,
            used: 520,
          },
          {
            id: 3,
            name: "North Storage",
            location: "Delhi, India",
            capacity: 600,
            used: 210,
          },
        ]
      );
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState([]),
    [stats, setStats] = useState(initialStats),
    [categories, setCategories] = useState([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All categories"),
    [loading, setLoading] = useState(true),
    [modal, setModal] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const changePage = (next) => {
    setPage(next);
    setError("");
  };
  const persistWarehouses = (next) => {
    setWarehouses(next);
    localStorage.setItem("stockwise_warehouses", JSON.stringify(next));
  };
  const addWarehouse = () => {
    const name = prompt("Warehouse name:");
    if (!name?.trim()) return;
    const location = prompt("Warehouse location:") || "Location not set";
    const capacity = Math.max(
      0,
      Number(prompt("Storage capacity (units):") || 0),
    );
    persistWarehouses([
      ...warehouses,
      { id: Date.now(), name: name.trim(), location, capacity, used: 0 },
    ]);
    notify("Warehouse added");
  };
  const editWarehouse = (w) => {
    const name = prompt("Warehouse name:", w.name);
    if (!name?.trim()) return;
    const location = prompt("Warehouse location:", w.location) || w.location;
    const capacity = Math.max(
      w.used,
      Number(
        prompt("Storage capacity (units):", String(w.capacity)) || w.capacity,
      ),
    );
    persistWarehouses(
      warehouses.map((x) =>
        x.id === w.id ? { ...x, name: name.trim(), location, capacity } : x,
      ),
    );
    notify("Warehouse updated");
  };
  const deleteWarehouse = (w) => {
    if (!confirm(`Delete ${w.name}?`)) return;
    persistWarehouses(warehouses.filter((x) => x.id !== w.id));
    notify("Warehouse deleted");
  };
  const logout = () => {
    localStorage.removeItem("stockwise_token");
    localStorage.removeItem("stockwise_user");
    setToken("");
    setUser(null);
    setError("");
    setProducts([]);
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, s, c] = await Promise.all([
        api.get("/products", { params: { search, category } }),
        api.get("/products/stats"),
        api.get("/products/categories"),
      ]);
      setProducts(p.data);
      setStats(s.data);
      setCategories(c.data);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        return;
      }
      setError(
        e.response?.data?.message ||
          "Unable to reach API. Start the server and MongoDB.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (token) fetchData();
    else {
      setLoading(false);
      setProducts([]);
      setStats(initialStats);
      setCategories([]);
    }
  }, [search, category, token]);
  const handleLogin = (payload) => {
    localStorage.setItem("stockwise_token", payload.token);
    localStorage.setItem("stockwise_user", JSON.stringify(payload.user));
    setUser(payload.user);
    setToken(payload.token);
    setError("");
  };
  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };
  const saveProduct = async (data) => {
    try {
      if (data._id) await api.put("/products/" + data._id, data);
      else await api.post("/products", data);
      setModal(null);
      setError("");
      notify(data._id ? "Product updated" : "Product added");
      fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Could not save product");
    }
  };
  const deleteProduct = async (p) => {
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    try {
      await api.delete("/products/" + p._id);
      notify("Product deleted");
      fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed");
    }
  };
  const adjust = async (p, delta) => {
    try {
      await api.patch(`/products/${p._id}/stock`, { delta });
      notify("Stock updated");
      fetchData();
    } catch (e) {
      setError(e.response?.data?.message || "Stock update failed");
    }
  };
  const exportCsv = () => {
    const rows = [
      [
        "Name",
        "SKU",
        "Category",
        "Quantity",
        "Unit price",
        "Stock value",
        "Supplier",
      ],
      ...products.map((p) => [
        p.name,
        p.sku,
        p.category,
        p.quantity,
        p.price,
        p.quantity * p.price,
        p.supplier,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "inventory-export.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Boxes size={21} />
          </div>
          <span>Stockwise</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <button
            className={`nav-item ${page === "overview" ? "active" : ""}`}
            onClick={() => changePage("overview")}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button
            className={`nav-item ${page === "products" ? "active" : ""}`}
            onClick={() => changePage("products")}
          >
            <Package size={18} />
            Products <span className="nav-count">{stats.productCount}</span>
          </button>
          <button
            className={`nav-item ${page === "warehouses" ? "active" : ""}`}
            onClick={() => changePage("warehouses")}
          >
            <Warehouse size={18} />
            Warehouses
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <TrendingUp size={16} />
            </div>
            <b>Stay on top of stock</b>
            <p>Keep your inventory healthy and organized.</p>
            <button onClick={() => setModal({ mode: "new" })}>
              Add your first item <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => changePage("settings")}
          >
            <Settings size={17} />
            Settings
          </button>
          <div className="profile">
            <div className="avatar">AD</div>
            <div className="profile-copy">
              <b>{user?.name || "Stockwise User"}</b>
              <span>{user?.role || "Inventory team"}</span>
            </div>
            <button
              className="profile-logout"
              title="Sign out"
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            Workspace <span>/</span>{" "}
            <b>
              {
                {
                  overview: "Inventory overview",
                  products: "Products",
                  warehouses: "Warehouses",
                  settings: "Settings",
                }[page]
              }
            </b>
          </div>
          <div className="top-actions">
            <button className="icon-button">
              <Bell size={18} />
              <i className="notification-dot" />
            </button>
            <div className="top-avatar">
              {(user?.name || "SU")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <button className="logout-button" onClick={logout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </header>
        <div className="page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MONDAY, NOVEMBER 22</div>
              <h1>
                {
                  {
                    overview: "Inventory overview",
                    products: "Products",
                    warehouses: "Warehouses",
                    settings: "Settings",
                  }[page]
                }
              </h1>
              <p>
                {
                  {
                    overview:
                      "Track your stock, monitor performance, and manage products.",
                    products: "Manage your product catalog and stock levels.",
                    warehouses:
                      "Organize storage locations and monitor capacity.",
                    settings:
                      "Manage your account and application preferences.",
                  }[page]
                }
              </p>
            </div>
            {(page === "overview" || page === "products") && (
              <button
                className="primary-btn"
                onClick={() => {
                  setError("");
                  setModal({ mode: "new" });
                }}
              >
                <Plus size={17} /> Add product
              </button>
            )}
            {page === "warehouses" && (
              <button className="primary-btn" onClick={addWarehouse}>
                <Plus size={17} /> Add warehouse
              </button>
            )}
          </div>
          {error && (
            <div className="error-banner">
              <CircleAlert size={17} />
              {error}
              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {page === "overview" && (
            <div className="stats-grid">
              <Stat
                title="Total products"
                value={stats.productCount.toLocaleString("en-IN")}
                icon={<Package size={19} />}
                note="Unique items in catalog"
                tone="blue"
              />
              <Stat
                title="Units in stock"
                value={stats.totalUnits.toLocaleString("en-IN")}
                icon={<Boxes size={19} />}
                note="Across all products"
                tone="violet"
              />
              <Stat
                title="Inventory value"
                value={money(stats.inventoryValue)}
                icon={<TrendingUp size={19} />}
                note="At current unit cost"
                tone="green"
              />
              <Stat
                title="Low stock alerts"
                value={stats.lowStock.toLocaleString("en-IN")}
                icon={<CircleAlert size={19} />}
                note="Items at reorder level"
                tone="orange"
                alert={stats.lowStock > 0}
              />
            </div>
          )}
          {(page === "overview" || page === "products") && (
            <section className="inventory-card">
              <div className="table-head">
                <div>
                  <h2>Product inventory</h2>
                  <p>Manage and monitor your products</p>
                </div>
                <div className="table-tools">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products..."
                    />
                    <kbd>⌘ K</kbd>
                  </div>
                  <button
                    className="filter-btn"
                    onClick={() => setCategory("All categories")}
                  >
                    <ListFilter size={16} /> Filter <ChevronDown size={14} />
                  </button>
                  <button className="export-btn" onClick={exportCsv}>
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div className="category-row">
                <button
                  className={
                    category === "All categories"
                      ? "category-pill selected"
                      : "category-pill"
                  }
                  onClick={() => setCategory("All categories")}
                >
                  All products <span>{stats.productCount}</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    className={
                      category === c
                        ? "category-pill selected"
                        : "category-pill"
                    }
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>SKU</th>
                      <th>CATEGORY</th>
                      <th>STOCK LEVEL</th>
                      <th>UNIT PRICE</th>
                      <th>VALUE</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="empty">
                          <LoaderCircle className="spin" /> Loading inventory...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">
                          <div className="empty-icon">
                            <Package size={24} />
                          </div>
                          <b>No products found</b>
                          <p>
                            Try changing your search or add your first item.
                          </p>
                          <button
                            className="primary-btn small"
                            onClick={() => setModal({ mode: "new" })}
                          >
                            <Plus size={15} /> Add product
                          </button>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div className="product-cell">
                              <div className="product-icon">
                                <Package size={17} />
                              </div>
                              <div>
                                <b>{p.name}</b>
                                <small>{p.supplier || "No supplier"}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="sku">{p.sku}</span>
                          </td>
                          <td>
                            <span className="category-tag">{p.category}</span>
                          </td>
                          <td>
                            <div className="stock-cell">
                              <div className="stock-bar">
                                <div
                                  className={`stock-fill ${p.quantity <= p.reorderLevel ? "low" : ""}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(4, (p.quantity / Math.max(p.reorderLevel * 4, 20)) * 100))}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`stock-count ${p.quantity <= p.reorderLevel ? "low-text" : ""}`}
                              >
                                {p.quantity}{" "}
                                <small>
                                  {p.quantity <= p.reorderLevel
                                    ? "Low stock"
                                    : "in stock"}
                                </small>
                              </span>
                              <div className="stock-controls">
                                <button
                                  title="Decrease"
                                  onClick={() => adjust(p, -1)}
                                  disabled={p.quantity === 0}
                                >
                                  <Minus size={13} />
                                </button>
                                <button
                                  title="Increase"
                                  onClick={() => adjust(p, 1)}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td>{money(p.price)}</td>
                          <td className="value-cell">
                            {money(p.price * p.quantity)}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                title="Edit"
                                onClick={() => {
                                  setError("");
                                  setModal({ mode: "edit", product: p });
                                }}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => deleteProduct(p)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  Showing <b>{products.length}</b> products
                </span>
                <button className="refresh" onClick={fetchData}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </section>
          )}
          {page === "warehouses" && (
            <section className="warehouse-grid">
              {warehouses.map((w) => (
                <article className="warehouse-card" key={w.id}>
                  <div className="warehouse-card-top">
                    <div className="warehouse-symbol">
                      <Warehouse size={20} />
                    </div>
                    <div className="warehouse-actions">
                      <button
                        onClick={() => editWarehouse(w)}
                        title="Edit warehouse"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteWarehouse(w)}
                        title="Delete warehouse"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h2>{w.name}</h2>
                  <p className="warehouse-location">{w.location}</p>
                  <div className="capacity-row">
                    <span>Storage utilization</span>
                    <b>
                      {w.capacity ? Math.round((w.used / w.capacity) * 100) : 0}
                      %
                    </b>
                  </div>
                  <div className="capacity-track">
                    <div
                      style={{
                        width: `${w.capacity ? Math.min(100, (w.used / w.capacity) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="capacity-meta">
                    <span>{w.used.toLocaleString()} units used</span>
                    <span>{w.capacity.toLocaleString()} capacity</span>
                  </div>
                </article>
              ))}
              {warehouses.length === 0 && (
                <div className="empty-warehouse">
                  No warehouses yet. Add your first warehouse to get started.
                </div>
              )}
            </section>
          )}
          {page === "settings" && (
            <section className="settings-card">
              <div className="settings-section">
                <div className="settings-avatar">
                  {(user?.name || "SU")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h2>Account information</h2>
                  <p>Signed in user profile and access details.</p>
                </div>
              </div>
              <div className="settings-fields">
                <label>
                  Full name
                  <input readOnly value={user?.name || "Stockwise User"} />
                </label>
                <label>
                  Email address
                  <input readOnly value={user?.email || "Not available"} />
                </label>
                <label>
                  Role
                  <input readOnly value={user?.role || "Inventory team"} />
                </label>
                <label>
                  Session status
                  <input readOnly value="Authenticated" />
                </label>
              </div>
              <div className="settings-actions">
                <div>
                  <b>Sign out</b>
                  <p>End your current Stockwise session on this device.</p>
                </div>
                <button className="cancel-btn" onClick={logout}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
              <p className="settings-note">
                Warehouse records in this version are saved in this browser
                only. Product and account data are stored through the backend
                API.
              </p>
            </section>
          )}
          <footer>
            Stockwise Inventory <span>•</span> Built to keep operations moving
          </footer>
        </div>
      </main>
      {modal && (
        <ProductModal
          product={modal.product}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}{" "}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Stat({ title, value, icon, note, tone, alert }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className={`stat-icon ${tone}`}>{icon}</div>
      </div>
      <div className={`stat-value ${alert ? "alert-number" : ""}`}>{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "General",
    quantity: 0,
    price: 0,
    supplier: "",
    description: "",
    reorderLevel: 5,
    ...product,
  });
  const [busy, setBusy] = useState(false);
  const update = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSave(form);
    setBusy(false);
  };
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <h2>{product ? "Edit product" : "Add a product"}</h2>
            <p>Enter product details for your inventory.</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          <label className="full">
            Product name *
            <input
              required
              name="name"
              value={form.name}
              onChange={update}
              placeholder="e.g. Wireless keyboard"
            />
          </label>
          <label>
            SKU *
            <input
              required
              name="sku"
              value={form.sku}
              onChange={update}
              placeholder="e.g. KEY-001"
            />
          </label>
          <label>
            Category
            <input
              name="category"
              value={form.category}
              onChange={update}
              placeholder="e.g. Accessories"
            />
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="0"
              required
              name="quantity"
              value={form.quantity}
              onChange={update}
            />
          </label>
          <label>
            Unit price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              name="price"
              value={form.price}
              onChange={update}
            />
          </label>
          <label>
            Reorder level
            <input
              type="number"
              min="0"
              name="reorderLevel"
              value={form.reorderLevel}
              onChange={update}
            />
          </label>
          <label>
            Supplier
            <input
              name="supplier"
              value={form.supplier}
              onChange={update}
              placeholder="Supplier name"
            />
          </label>
          <label className="full">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              rows="3"
              placeholder="Optional product notes"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={busy}>
            {busy ? "Saving..." : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("admin@stockwise.local"),
    [password, setPassword] = useState("Admin123!"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      onLogin(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Check the server and credentials.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">
            <Boxes size={21} />
          </div>
          <span>Stockwise</span>
        </div>
        <div className="login-icon">
          <LockKeyhole size={21} />
        </div>
        <h1>Welcome back</h1>
        <p className="login-subtitle">
          Sign in to manage your inventory workspace.
        </p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={submit} className="login-form">
          <label>
            Email address
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary-btn login-submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="demo-credentials">
          <b>Demo account</b>
          <span>admin@stockwise.local</span>
          <span>Password: Admin123!</span>
        </div>
      </div>
      <div className="login-footer">Stockwise Inventory Management</div>
    </div>
  );
}
