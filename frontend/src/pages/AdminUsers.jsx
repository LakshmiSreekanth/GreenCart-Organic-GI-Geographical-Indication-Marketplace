import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function load() {
    const d = await api("/api/admin/users");
    setUsers(d.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!window.confirm("Remove this user?")) return;
    await api(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>Users</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Farm</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.farm_name || "—"}</td>
              <td>
                {u.role !== "admin" && (
                  <button className="btn small danger" onClick={() => remove(u.id)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
