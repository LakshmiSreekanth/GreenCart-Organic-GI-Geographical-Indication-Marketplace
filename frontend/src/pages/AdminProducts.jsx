import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  async function load() {
    const d = await api("/api/admin/products");
    setProducts(d.products);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>All products</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Farm</th>
            <th>Price</th>
            <th>GI</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.farm_name}</td>
              <td>{rupee(p.price)}</td>
              <td>{p.is_gi ? p.gi_tag : "—"}</td>
              <td>
                <button className="btn small danger" onClick={() => remove(p.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
