import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "customer@greencart.in", password: "Customer@123" });
  const [error, setError] = useState("");
  const { loginSuccess, refreshMe } = useAuth();
  const navigate = useNavigate();

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
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
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
        New here? <Link to="/register">Create account</Link>
      </p>
    </form>
  );
}
