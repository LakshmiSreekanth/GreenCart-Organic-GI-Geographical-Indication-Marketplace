import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, rupee } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Cart() {
  const [data, setData] = useState({ items: [], subtotal: 0 });
  const { refreshMe } = useAuth();
  const navigate = useNavigate();

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
