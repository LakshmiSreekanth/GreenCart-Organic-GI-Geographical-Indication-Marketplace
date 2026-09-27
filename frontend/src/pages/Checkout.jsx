import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Checkout() {
  const { user, refreshMe } = useAuth();
  const [address, setAddress] = useState(user?.address || "");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function place(e) {
    e.preventDefault();
    try {
      const d = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({ shipping_address: address }),
      });
      await refreshMe();
      navigate("/orders");
      setMsg("Order #" + d.order.id + " placed");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <form className="panel auth-box" onSubmit={place}>
      <h1>Checkout</h1>
      <p className="muted">Pending → Confirmed → Shipped → Delivered</p>
      <label>Shipping address</label>
      <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
      {msg && <p className="error">{msg}</p>}
      <button className="btn" style={{ marginTop: 12 }}>
        Place order
      </button>
    </form>
  );
}
