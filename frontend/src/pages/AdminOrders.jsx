import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";

export default function AdminOrders() {
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
