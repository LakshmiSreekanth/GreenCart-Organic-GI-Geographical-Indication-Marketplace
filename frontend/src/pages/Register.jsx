import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
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
  const navigate = useNavigate();

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
        <option value="customer">I want to buy</option>
        <option value="farmer">I want to sell (farmer)</option>
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
