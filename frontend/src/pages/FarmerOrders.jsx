import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";

export default function FarmerOrders() {
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
            <th>Update</th>
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
