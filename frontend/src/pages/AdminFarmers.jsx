import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [status, setStatus] = useState("pending");

  async function load() {
    const q = status ? `?status=${status}` : "";
    const d = await api("/api/admin/farmers" + q);
    setFarmers(d.farmers);
  }

  useEffect(() => {
    load();
  }, [status]);

  async function approve(id) {
    await api(`/api/admin/farmers/${id}/approve`, { method: "PUT" });
    load();
  }

  async function reject(id) {
    const reason = window.prompt("Rejection reason", "Certificate not readable") || "";
    await api(`/api/admin/farmers/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) });
    load();
  }

  return (
    <div>
      <h1>Farmer certificates</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 240, marginBottom: 16 }}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="">All</option>
      </select>
      <table>
        <thead>
          <tr>
            <th>Farm</th>
            <th>Owner</th>
            <th>Location</th>
            <th>Status</th>
            <th>Certificate</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((f) => (
            <tr key={f.id}>
              <td>{f.farm_name}</td>
              <td>
                {f.name}
                <br />
                <span className="muted">{f.email}</span>
              </td>
              <td>{f.location}</td>
              <td className={"status " + f.certificate_status}>{f.certificate_status}</td>
              <td>
                {f.certificate_path ? (
                  <a href={f.certificate_path} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <button className="btn small" onClick={() => approve(f.id)}>
                  Approve
                </button>{" "}
                <button className="btn small danger" onClick={() => reject(f.id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
