const { useState, useEffect, createContext, useContext } = React;

// ----------------------------------------------------
// 1. API & STORAGE HELPERS
// ----------------------------------------------------
const TOKEN_KEY = "greencart_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function rupee(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

// ----------------------------------------------------
// 2. ROUTING (Hash-based: No Vite, zero-config, works everywhere)
// ----------------------------------------------------
function getHashPath() {
  const hash = window.location.hash.slice(1);
  return hash.startsWith("/") ? hash : "/" + hash;
}

function navigate(to) {
  window.location.hash = to.startsWith("/") ? to : "/" + to;
}

function Link({ to, className, style, children, onClick }) {
  const href = "#" + (to.startsWith("/") ? to : "/" + to);
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
    >
      {children}
    </a>
  );
}

// ----------------------------------------------------
// 3. AUTH CONTEXT
// ----------------------------------------------------
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  async function refreshMe() {
    if (!getToken()) {
      setUser(null);
      setFarmer(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api("/api/auth/me");
      setUser(data.user);
      setFarmer(data.farmer);
      if (data.user.role === "customer") {
        const cart = await api("/api/cart");
        setCartCount(cart.items.reduce((s, i) => s + i.quantity, 0));
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  function loginSuccess(token, nextUser) {
    setToken(token);
    setUser(nextUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setFarmer(null);
    setCartCount(0);
  }

  return (
    <AuthContext.Provider
      value={{ user, farmer, loading, cartCount, setCartCount, loginSuccess, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// ----------------------------------------------------
// 4. SHARED LAYOUT COMPONENTS
// ----------------------------------------------------
function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-msg">Loading…</div>;
  if (!user) {
    navigate("/login");
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    navigate("/");
    return null;
  }
  return children;
}

function Navbar() {
  const { user, logout, cartCount } = useAuth();
  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="leaf">◆</span> GreenCart
      </Link>
      <nav className="nav-links">
        <Link to="/shop">Shop</Link>
        {user?.role === "customer" && (
          <>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/cart" className="cart-link">
              Cart <span className="badge">{cartCount}</span>
            </Link>
          </>
        )}
        {user?.role === "farmer" && (
          <>
            <Link to="/farmer">Farm</Link>
            <Link to="/farmer/products">Products</Link>
            <Link to="/farmer/orders">Farm orders</Link>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/farmers">Farmers</Link>
            <Link to="/admin/orders">All orders</Link>
          </>
        )}
      </nav>
      <div className="nav-auth">
        {user ? (
          <>
            <span className="who">
              {user.name} · {user.role}
            </span>
            <button
              className="btn ghost"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost">
              Login
            </Link>
            <Link to="/register" className="btn">
              Join GreenCart
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>GreenCart</strong>
        <p>Organic & Geographical Indication marketplace — farm to door, verified.</p>
        <small style={{ color: "var(--accent)" }}>Pure Node.js + Express REST APIs & SQL</small>
      </div>
      <div>
        <p>Demo accounts</p>
        <small>admin@greencart.in / Admin@123</small>
        <br />
        <small>farmer@greencart.in / Farmer@123</small>
        <br />
        <small>customer@greencart.in / Customer@123</small>
      </div>
    </footer>
  );
}

// ----------------------------------------------------
// 5. PAGES
// ----------------------------------------------------

// HOME PAGE
function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api("/api/products").then((d) => setProducts(d.products.slice(0, 8)));
  }, []);

  return (
    <div>
      <section className="hero">
        <div>
          <div className="kicker">Organic · GI certified · Farm direct</div>
          <h1>A marketplace for produce with a place and a story.</h1>
          <p>
            GreenCart is a mini-Amazon for organic and Geographical Indication products. Farmers
            sell after certificate verification. Customers browse, filter, and order. Admin keeps
            the shelf honest.
          </p>
          <div className="row">
            <Link to="/shop" className="btn">
              Browse harvest
            </Link>
            <Link to="/register" className="btn secondary">
              Sell as a farmer
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>How it works</h3>
          <p>1. Farmer uploads organic / GI certificate</p>
          <p>2. Admin approves the farm</p>
          <p>3. Products go live with GI badges</p>
          <p>4. Customer orders · farmer delivers · admin tracks</p>
        </div>
      </section>
      <h2>In season now</h2>
      <div className="grid">
        {products.map((p) => (
          <Link to={`/product/${p.id}`} className="card" key={p.id}>
            <img src={p.image_url} alt={p.name} />
            <div className="card-body">
              {p.is_gi ? <span className="gi">GI Certified</span> : null}
              {p.is_organic ? <span className="organic">Organic</span> : null}
              <h3>{p.name}</h3>
              <div className="muted">{p.farm_name}</div>
              <div className="price">{rupee(p.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// SHOP PAGE
function Shop() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], giTags: [], locations: [] });
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    gi: "",
    organic: "",
    minPrice: "",
    maxPrice: "",
    location: "",
  });

  function load() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    api("/api/products?" + params.toString()).then((d) => setProducts(d.products));
  }

  useEffect(() => {
    api("/api/products/meta").then(setMeta);
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <div>
      <h1>Shop organic & GI produce</h1>
      <p className="muted">Search by name, filter by GI tag, category, price and origin.</p>
      <div className="filters">
        <input
          placeholder="Search tea, mango, rice…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {meta.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={filters.gi} onChange={(e) => setFilters({ ...filters, gi: e.target.value })}>
          <option value="">GI & others</option>
          <option value="1">GI tagged only</option>
        </select>
        <select value={filters.organic} onChange={(e) => setFilters({ ...filters, organic: e.target.value })}>
          <option value="">Any farming</option>
          <option value="1">Organic only</option>
        </select>
        <input
          type="number"
          placeholder="Min ₹"
          value={filters.minPrice}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
        />
        <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
          <option value="">Any origin</option>
          {meta.locations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="grid">
        {products.map((p) => (
          <Link to={`/product/${p.id}`} className="card" key={p.id}>
            <img src={p.image_url} alt={p.name} />
            <div className="card-body">
              {p.is_gi ? <span className="gi">GI Certified</span> : null}
              {p.is_organic ? <span className="organic">Organic</span> : null}
              <h3>{p.name}</h3>
              <div className="muted">
                {p.location} · {p.avg_rating}★ ({p.review_count})
              </div>
              <div className="price">
                {rupee(p.price)} <span className="muted">/ {p.unit}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!products.length && <p className="page-msg">No products match these filters.</p>}
    </div>
  );
}

// PRODUCT DETAIL PAGE
function ProductDetail({ id }) {
  const { user, refreshMe } = useAuth();
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [msg, setMsg] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });

  async function load() {
    const d = await api(`/api/products/${id}`);
    setData(d);
    // Express JS Smart Recommendation API
    const r = await api(`/api/recommend/${id}`);
    setRecs(r.recommendations || []);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addCart() {
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ product_id: Number(id), quantity: 1 }) });
      setMsg("Added to cart");
      refreshMe();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function wish() {
    try {
      await api("/api/wishlist", { method: "POST", body: JSON.stringify({ product_id: Number(id) }) });
      setMsg("Saved to wishlist");
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    try {
      await api(`/api/products/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify(review),
      });
      setMsg("Review saved");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!data) return <div className="page-msg">Loading product…</div>;
  const p = data.product;

  return (
    <div>
      <div className="product-hero">
        <img src={p.image_url} alt={p.name} />
        <div>
          {p.is_gi ? <span className="gi">GI Certified · {p.gi_tag}</span> : null}{" "}
          {p.is_organic ? <span className="organic">Organic</span> : null}
          <h1>{p.name}</h1>
          <p className="muted">
            {p.farm_name} · {p.location} · {p.avg_rating}★ from {p.review_count} reviews
          </p>
          <div className="price">{rupee(p.price)} / {p.unit}</div>
          <p>{p.description}</p>
          <p className="muted">In stock: {p.stock}</p>
          {msg && <p className="notice">{msg}</p>}
          {user?.role === "customer" && (
            <div className="row">
              <button className="btn" onClick={addCart}>
                Add to cart
              </button>
              <button className="btn secondary" onClick={wish}>
                Wishlist
              </button>
            </div>
          )}
          {!user && <Link to="/login">Login as customer to order</Link>}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 28 }}>
        <h2>Reviews</h2>
        {data.reviews.map((r) => (
          <div key={r.id} style={{ marginBottom: 12 }}>
            <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <strong>{r.user_name}</strong>
            <p>{r.comment}</p>
          </div>
        ))}
        {user?.role === "customer" && (
          <form onSubmit={submitReview}>
            <h3>Write a review</h3>
            <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <textarea
              placeholder="How was the harvest?"
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
            <button className="btn" style={{ marginTop: 8 }}>
              Submit review
            </button>
          </form>
        )}
      </div>

      <h2>You may also like</h2>
      <p className="muted">Similar products from the Express recommendation engine, matched by category, GI tag, and origin.</p>
      <div className="grid">
        {recs.map((r) => (
          <Link to={`/product/${r.id}`} className="card" key={r.id}>
            <img src={r.image_url} alt={r.name} />
            <div className="card-body">
              {r.is_gi ? <span className="gi">GI Certified</span> : null}
              <h3>{r.name}</h3>
              <div className="price">{rupee(r.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// CART PAGE
function Cart() {
  const [data, setData] = useState({ items: [], subtotal: 0 });
  const { refreshMe } = useAuth();

  async function load() {
    const d = await api("/api/cart");
    setData(d);
    refreshMe();
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id, quantity) {
    await api(`/api/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
    load();
  }

  async function remove(id) {
    await api(`/api/cart/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>Your cart</h1>
      {!data.items.length && (
        <p>
          Cart is empty. <Link to="/shop">Continue shopping</Link>
        </p>
      )}
      {data.items.map((i) => (
        <div className="panel row" key={i.id} style={{ alignItems: "center" }}>
          <img src={i.image_url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <strong>{i.name}</strong>
            <div>
              {rupee(i.price)} · {i.is_gi ? <span className="gi">GI</span> : null}
            </div>
          </div>
          <input
            type="number"
            min="1"
            value={i.quantity}
            onChange={(e) => update(i.id, Number(e.target.value))}
            style={{ width: 80 }}
          />
          <button className="btn ghost danger" onClick={() => remove(i.id)} style={{ color: "#9b2c2c", borderColor: "#9b2c2c" }}>
            Remove
          </button>
        </div>
      ))}
      {data.items.length > 0 && (
        <div className="panel">
          <h2>Subtotal {rupee(data.subtotal)}</h2>
          <button className="btn" onClick={() => navigate("/checkout")}>
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}

// CHECKOUT PAGE
function Checkout() {
  const { user, refreshMe } = useAuth();
  const [address, setAddress] = useState(user?.address || "");
  const [msg, setMsg] = useState("");

  async function place(e) {
    e.preventDefault();
    try {
      const d = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ shipping_address: address }),
      });
      await refreshMe();
      navigate("/orders");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <form className="panel auth-box" onSubmit={place}>
      <h1>Checkout</h1>
      <p className="muted">Flow: Pending → Confirmed → Shipped → Delivered</p>
      <label>Shipping address</label>
      <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
      {msg && <p className="error">{msg}</p>}
      <button className="btn" style={{ marginTop: 12 }}>
        Place order
      </button>
    </form>
  );
}

// ORDERS PAGE
const STEPS = ["pending", "confirmed", "shipped", "delivered"];

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api("/api/orders").then((d) => setOrders(d.orders));
  }, []);

  return (
    <div>
      <h1>Order history</h1>
      {orders.map((o) => (
        <div className="panel" key={o.id}>
          <strong>Order #{o.id}</strong> · {rupee(o.total)} ·{" "}
          <span className={"status " + o.status}>{o.status}</span>
          <div className="track">
            {STEPS.map((s) => (
              <span key={s} className={STEPS.indexOf(s) <= STEPS.indexOf(o.status) ? "on" : ""}>
                {s}
              </span>
            ))}
          </div>
          {o.items.map((i) => (
            <div key={i.id} className="muted">
              {i.name} × {i.quantity} — {rupee(i.price)}
            </div>
          ))}
          <p className="muted">{o.shipping_address}</p>
        </div>
      ))}
      {!orders.length && <p>No orders yet.</p>}
    </div>
  );
}

// WISHLIST PAGE
function Wishlist() {
  const [items, setItems] = useState([]);

  async function load() {
    const d = await api("/api/wishlist");
    setItems(d.items);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api(`/api/wishlist/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>Wishlist</h1>
      <div className="grid">
        {items.map((i) => (
          <div className="card" key={i.id}>
            <img src={i.image_url} alt={i.name} />
            <div className="card-body">
              {i.is_gi ? <span className="gi">GI Certified</span> : null}
              <h3>
                <Link to={`/product/${i.product_id}`}>{i.name}</Link>
              </h3>
              <div className="price">{rupee(i.price)}</div>
              <button className="btn small" onClick={() => remove(i.product_id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {!items.length && <p>Nothing saved yet.</p>}
    </div>
  );
}

// FARMER DASHBOARD
function FarmerDashboard() {
  const { refreshMe } = useAuth();
  const [dash, setDash] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const d = await api("/api/farmers/dashboard");
    setDash(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadCert(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("certificate", file);
    try {
      await api("/api/auth/certificate", { method: "POST", body: fd });
      setMsg("Certificate uploaded. Admin will review it.");
      await refreshMe();
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!dash) return <div className="page-msg">Loading farm dashboard…</div>;
  const t = dash.totals;
  const f = dash.farmer;

  return (
    <div>
      <h1>{f.farm_name}</h1>
      <p>
        Certificate: <span className={"status " + f.certificate_status}>{f.certificate_status}</span>
      </p>
      {f.certificate_status !== "approved" && (
        <div className="notice">
          Upload your organic / GI certificate. You can list products once verified by Admin.
          <input type="file" accept=".pdf,image/*" onChange={uploadCert} style={{ marginTop: 8 }} />
        </div>
      )}
      {msg && <p className="notice">{msg}</p>}
      <div className="stats">
        <div className="stat">
          <span className="muted">Products</span>
          <b>{t.total_products}</b>
        </div>
        <div className="stat">
          <span className="muted">Orders</span>
          <b>{t.total_orders}</b>
        </div>
        <div className="stat">
          <span className="muted">Earnings</span>
          <b>{rupee(t.total_earnings)}</b>
        </div>
      </div>
      <div className="panel">
        <h2>Recent orders</h2>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dash.recent.map((r, i) => (
              <tr key={i}>
                <td>#{r.id}</td>
                <td>{r.customer_name}</td>
                <td>
                  {r.product_name} × {r.quantity}
                </td>
                <td className={"status " + r.status}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// FARMER PRODUCTS
const emptyProduct = {
  name: "",
  description: "",
  category: "Pantry",
  gi_tag: "",
  is_gi: 0,
  is_organic: 1,
  price: "",
  stock: "",
  unit: "kg",
  location: "",
  image_url: "",
};

function FarmerProducts() {
  const [products, setProducts] = useState([]);
  const [farmer, setFarmer] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const d = await api("/api/products/mine");
    setProducts(d.products);
    setFarmer(d.farmer);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    try {
      if (editId) {
        await api(`/api/products/${editId}`, { method: "PUT", body: fd });
      } else {
        await api("/api/products", { method: "POST", body: fd });
      }
      setForm(emptyProduct);
      setEditId(null);
      setFile(null);
      setMsg("Saved successfully");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this product?")) return;
    await api(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>My products</h1>
      {farmer && farmer.certificate_status !== "approved" && (
        <div className="notice">Wait for admin certificate approval before adding products.</div>
      )}
      <form className="panel" onSubmit={save}>
        <h2>{editId ? "Edit product" : "Add product"}</h2>
        <div className="filters" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="GI tag (optional)" value={form.gi_tag} onChange={(e) => setForm({ ...form, gi_tag: e.target.value })} />
          <input placeholder="Price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input placeholder="Unit (kg, 250g, 1L...)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Image URL (or upload)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>
          <input type="checkbox" checked={!!Number(form.is_gi)} onChange={(e) => setForm({ ...form, is_gi: e.target.checked ? 1 : 0 })} /> GI tagged
        </label>{" "}
        <label>
          <input type="checkbox" checked={!!Number(form.is_organic)} onChange={(e) => setForm({ ...form, is_organic: e.target.checked ? 1 : 0 })} /> Organic
        </label>
        {msg && <p className="notice">{msg}</p>}
        <button className="btn" style={{ marginTop: 10 }}>
          {editId ? "Update product" : "Create product"}
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.name} {p.is_gi ? <span className="gi">GI</span> : null}
              </td>
              <td>{rupee(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <button
                  className="btn small secondary"
                  onClick={() => {
                    setEditId(p.id);
                    setForm({
                      name: p.name,
                      description: p.description,
                      category: p.category,
                      gi_tag: p.gi_tag || "",
                      is_gi: p.is_gi,
                      is_organic: p.is_organic,
                      price: p.price,
                      stock: p.stock,
                      unit: p.unit,
                      location: p.location || "",
                      image_url: p.image_url || "",
                    });
                  }}
                >
                  Edit
                </button>{" "}
                <button className="btn small danger" onClick={() => remove(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// FARMER ORDERS
function FarmerOrders() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const d = await api("/api/farmers/orders");
    setOrders(d.orders);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await api(`/api/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div>
      <h1>Incoming orders</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Item</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={i}>
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>
                {o.product_name} × {o.quantity}
              </td>
              <td>{rupee(o.line_total)}</td>
              <td className={"status " + o.status}>{o.status}</td>
              <td>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  <option>pending</option>
                  <option>confirmed</option>
                  <option>shipped</option>
                  <option>delivered</option>
                  <option>cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ADMIN DASHBOARD
function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/api/admin/dashboard").then(setData);
  }, []);

  if (!data) return <div className="page-msg">Loading admin dashboard…</div>;
  const s = data.stats;

  return (
    <div>
      <h1>Admin dashboard</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link className="btn small" to="/admin/farmers">
          Certificates
        </Link>
        <Link className="btn small secondary" to="/admin/users">
          Users
        </Link>
        <Link className="btn small secondary" to="/admin/products">
          Products
        </Link>
        <Link className="btn small secondary" to="/admin/orders">
          Orders
        </Link>
      </div>
      <div className="stats">
        <div className="stat">
          <span className="muted">Customers</span>
          <b>{s.customers}</b>
        </div>
        <div className="stat">
          <span className="muted">Farmers</span>
          <b>{s.farmers}</b>
        </div>
        <div className="stat">
          <span className="muted">Products</span>
          <b>{s.products}</b>
        </div>
        <div className="stat">
          <span className="muted">Orders</span>
          <b>{s.orders}</b>
        </div>
        <div className="stat">
          <span className="muted">Revenue</span>
          <b>{rupee(s.revenue)}</b>
        </div>
        <div className="stat">
          <span className="muted">Pending farms</span>
          <b>{s.pending_farmers}</b>
        </div>
      </div>
      <div className="panel">
        <h2>Top selling products</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>{p.sold}</td>
                <td>{rupee(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ADMIN FARMERS
function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [status, setStatus] = useState("pending");

  async function load() {
    const q = status ? `?status=${status}` : "";
    const d = await api("/api/admin/farmers" + q);
    setFarmers(d.farmers);
  }

  useEffect(() => {
    load();
  }, [status]);

  async function approve(id) {
    await api(`/api/admin/farmers/${id}/approve`, { method: "PUT" });
    load();
  }

  async function reject(id) {
    const reason = window.prompt("Rejection reason", "Certificate not clear") || "";
    await api(`/api/admin/farmers/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) });
    load();
  }

  return (
    <div>
      <h1>Farmer certificate verification</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 240, marginBottom: 16 }}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="">All</option>
      </select>
      <table>
        <thead>
          <tr>
            <th>Farm</th>
            <th>Owner</th>
            <th>Location</th>
            <th>Status</th>
            <th>Certificate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((f) => (
            <tr key={f.id}>
              <td>{f.farm_name}</td>
              <td>
                {f.name}
                <br />
                <span className="muted">{f.email}</span>
              </td>
              <td>{f.location}</td>
              <td className={"status " + f.certificate_status}>{f.certificate_status}</td>
              <td>
                {f.certificate_path ? (
                  <a href={f.certificate_path} target="_blank" rel="noreferrer">
                    View certificate
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <button className="btn small" onClick={() => approve(f.id)}>
                  Approve
                </button>{" "}
                <button className="btn small danger" onClick={() => reject(f.id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ADMIN USERS
function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function load() {
    const d = await api("/api/admin/users");
    setUsers(d.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!window.confirm("Remove this user?")) return;
    await api(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>Users management</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Farm</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.farm_name || "—"}</td>
              <td>
                {u.role !== "admin" && (
                  <button className="btn small danger" onClick={() => remove(u.id)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ADMIN PRODUCTS
function AdminProducts() {
  const [products, setProducts] = useState([]);

  async function load() {
    const d = await api("/api/admin/products");
    setProducts(d.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!window.confirm("Remove product from platform?")) return;
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>All products</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Farm</th>
            <th>Price</th>
            <th>GI</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.farm_name}</td>
              <td>{rupee(p.price)}</td>
              <td>{p.is_gi ? p.gi_tag : "—"}</td>
              <td>
                <button className="btn small danger" onClick={() => remove(p.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ADMIN ORDERS
function AdminOrders() {
  const [orders, setOrders] = useState([]);

  async function load() {
    const d = await api("/api/admin/orders");
    setOrders(d.orders);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await api(`/api/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div>
      <h1>Platform orders</h1>
      {orders.map((o) => (
        <div className="panel" key={o.id}>
          <strong>
            #{o.id} {o.customer_name}
          </strong>{" "}
          {rupee(o.total)} · <span className={"status " + o.status}>{o.status}</span>
          <div>
            {o.items.map((i) => (
              <span key={i.id} className="muted">
                {i.name} × {i.quantity}{" "}
              </span>
            ))}
          </div>
          <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ maxWidth: 200, marginTop: 8 }}>
            <option>pending</option>
            <option>confirmed</option>
            <option>shipped</option>
            <option>delivered</option>
            <option>cancelled</option>
          </select>
        </div>
      ))}
    </div>
  );
}

// LOGIN PAGE
function Login() {
  const [form, setForm] = useState({ email: "customer@greencart.in", password: "Customer@123" });
  const [error, setError] = useState("");
  const { loginSuccess, refreshMe } = useAuth();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const d = await api("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
      loginSuccess(d.token, d.user);
      await refreshMe();
      if (d.user.role === "admin") navigate("/admin");
      else if (d.user.role === "farmer") navigate("/farmer");
      else navigate("/shop");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel auth-box" onSubmit={submit}>
      <h1>Welcome back</h1>
      <p className="muted">JWT login · role-based access</p>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        style={{ marginTop: 10 }}
      />
      {error && <p className="error">{error}</p>}
      <button className="btn" style={{ marginTop: 14, width: "100%" }}>
        Login
      </button>
      <p className="muted">
        Quick switch:{" "}
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setForm({ email: "admin@greencart.in", password: "Admin@123" })}
        >
          Admin
        </button>{" "}
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setForm({ email: "farmer@greencart.in", password: "Farmer@123" })}
        >
          Farmer
        </button>{" "}
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setForm({ email: "customer@greencart.in", password: "Customer@123" })}
        >
          Customer
        </button>
      </p>
      <p className="muted">
        New here? <Link to="/register">Create account</Link>
      </p>
    </form>
  );
}

// REGISTER PAGE
function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    address: "",
    farm_name: "",
    location: "",
  });
  const [error, setError] = useState("");
  const { loginSuccess, refreshMe } = useAuth();

  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      loginSuccess(d.token, d.user);
      await refreshMe();
      navigate(d.user.role === "farmer" ? "/farmer" : "/shop");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel auth-box" onSubmit={submit}>
      <h1>Join GreenCart</h1>
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="customer">I want to buy (Customer)</option>
        <option value="farmer">I want to sell (Farmer)</option>
      </select>
      <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      {form.role === "farmer" && (
        <>
          <input placeholder="Farm name" value={form.farm_name} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} />
          <input placeholder="Farm location / state" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn" style={{ marginTop: 12, width: "100%" }}>
        Create account
      </button>
    </form>
  );
}

// ----------------------------------------------------
// 6. MAIN APP SHELL & ROUTING DISPATCHER
// ----------------------------------------------------
function App() {
  const [currentPath, setCurrentPath] = useState(getHashPath());

  useEffect(() => {
    function onHashChange() {
      setCurrentPath(getHashPath());
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function renderView() {
    const path = currentPath;

    // Static pages
    if (path === "/" || path === "") return <Home />;
    if (path === "/shop") return <Shop />;
    if (path === "/login") return <Login />;
    if (path === "/register") return <Register />;

    // Dynamic product page: /product/:id
    if (path.startsWith("/product/")) {
      const id = path.split("/")[2];
      return <ProductDetail id={id} />;
    }

    // Protected customer routes
    if (path === "/cart") {
      return (
        <Guard roles={["customer"]}>
          <Cart />
        </Guard>
      );
    }
    if (path === "/checkout") {
      return (
        <Guard roles={["customer"]}>
          <Checkout />
        </Guard>
      );
    }
    if (path === "/orders") {
      return (
        <Guard roles={["customer"]}>
          <Orders />
        </Guard>
      );
    }
    if (path === "/wishlist") {
      return (
        <Guard roles={["customer"]}>
          <Wishlist />
        </Guard>
      );
    }

    // Protected farmer routes
    if (path === "/farmer") {
      return (
        <Guard roles={["farmer"]}>
          <FarmerDashboard />
        </Guard>
      );
    }
    if (path === "/farmer/products") {
      return (
        <Guard roles={["farmer"]}>
          <FarmerProducts />
        </Guard>
      );
    }
    if (path === "/farmer/orders") {
      return (
        <Guard roles={["farmer"]}>
          <FarmerOrders />
        </Guard>
      );
    }

    // Protected admin routes
    if (path === "/admin") {
      return (
        <Guard roles={["admin"]}>
          <AdminDashboard />
        </Guard>
      );
    }
    if (path === "/admin/farmers") {
      return (
        <Guard roles={["admin"]}>
          <AdminFarmers />
        </Guard>
      );
    }
    if (path === "/admin/users") {
      return (
        <Guard roles={["admin"]}>
          <AdminUsers />
        </Guard>
      );
    }
    if (path === "/admin/products") {
      return (
        <Guard roles={["admin"]}>
          <AdminProducts />
        </Guard>
      );
    }
    if (path === "/admin/orders") {
      return (
        <Guard roles={["admin"]}>
          <AdminOrders />
        </Guard>
      );
    }

    // Default fallback
    return <Home />;
  }

  return (
    <AuthProvider>
      <div className="app-shell">
        <Navbar />
        <main>{renderView()}</main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

// Mount React Root
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
