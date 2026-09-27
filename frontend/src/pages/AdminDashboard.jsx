import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupee } from "../api.js";

export default function AdminDashboard() {
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
        <h2>Top products</h2>
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
