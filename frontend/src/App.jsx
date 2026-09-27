import React from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Orders from "./pages/Orders.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import FarmerProducts from "./pages/FarmerProducts.jsx";
import FarmerOrders from "./pages/FarmerOrders.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminFarmers from "./pages/AdminFarmers.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AdminOrders from "./pages/AdminOrders.jsx";

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-msg">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const navigate = useNavigate();
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

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/cart"
            element={
              <Guard roles={["customer"]}>
                <Cart />
              </Guard>
            }
          />
          <Route
            path="/checkout"
            element={
              <Guard roles={["customer"]}>
                <Checkout />
              </Guard>
            }
          />
          <Route
            path="/orders"
            element={
              <Guard roles={["customer"]}>
                <Orders />
              </Guard>
            }
          />
          <Route
            path="/wishlist"
            element={
              <Guard roles={["customer"]}>
                <Wishlist />
              </Guard>
            }
          />
          <Route
            path="/farmer"
            element={
              <Guard roles={["farmer"]}>
                <FarmerDashboard />
              </Guard>
            }
          />
          <Route
            path="/farmer/products"
            element={
              <Guard roles={["farmer"]}>
                <FarmerProducts />
              </Guard>
            }
          />
          <Route
            path="/farmer/orders"
            element={
              <Guard roles={["farmer"]}>
                <FarmerOrders />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard roles={["admin"]}>
                <AdminDashboard />
              </Guard>
            }
          />
          <Route
            path="/admin/farmers"
            element={
              <Guard roles={["admin"]}>
                <AdminFarmers />
              </Guard>
            }
          />
          <Route
            path="/admin/users"
            element={
              <Guard roles={["admin"]}>
                <AdminUsers />
              </Guard>
            }
          />
          <Route
            path="/admin/products"
            element={
              <Guard roles={["admin"]}>
                <AdminProducts />
              </Guard>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <Guard roles={["admin"]}>
                <AdminOrders />
              </Guard>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
