import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function Orders() {
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
