import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function FarmerDashboard() {
  const { farmer, refreshMe } = useAuth();
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
          Upload your organic / GI certificate. You can list products only after admin approval.
          <input type="file" accept=".pdf,image/*" onChange={uploadCert} style={{ marginTop: 8 }} />
        </div>
      )}
      {msg && <p>{msg}</p>}
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
