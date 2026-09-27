import React, { useEffect, useState } from "react";
import { api, rupee } from "../api.js";

const empty = {
  name: "",
  description: "",
  category: "Pantry",
  gi_tag: "",
  is_gi: 0,
  is_organic: 1,
  price: "",
  stock: "",
  unit: "kg",
  location: "",
  image_url: "",
};

export default function FarmerProducts() {
  const [products, setProducts] = useState([]);
  const [farmer, setFarmer] = useState(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const d = await api("/api/products/mine");
    setProducts(d.products);
    setFarmer(d.farmer);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    try {
      if (editId) {
        await api(`/api/products/${editId}`, { method: "PUT", body: fd });
      } else {
        await api("/api/products", { method: "POST", body: fd });
      }
      setForm(empty);
      setEditId(null);
      setFile(null);
      setMsg("Saved");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function remove(id) {
    await api(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>My products</h1>
      {farmer && farmer.certificate_status !== "approved" && (
        <div className="notice">Wait for certificate approval before adding products.</div>
      )}
      <form className="panel" onSubmit={save}>
        <h2>{editId ? "Edit product" : "Add product"}</h2>
        <div className="filters" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="GI tag (optional)" value={form.gi_tag} onChange={(e) => setForm({ ...form, gi_tag: e.target.value })} />
          <input placeholder="Price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Image URL (or upload)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label>
          <input type="checkbox" checked={!!Number(form.is_gi)} onChange={(e) => setForm({ ...form, is_gi: e.target.checked ? 1 : 0 })} /> GI tagged
        </label>{" "}
        <label>
          <input type="checkbox" checked={!!Number(form.is_organic)} onChange={(e) => setForm({ ...form, is_organic: e.target.checked ? 1 : 0 })} /> Organic
        </label>
        {msg && <p>{msg}</p>}
        <button className="btn" style={{ marginTop: 10 }}>
          {editId ? "Update" : "Create"}
        </button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.name} {p.is_gi ? <span className="gi">GI</span> : null}
              </td>
              <td>{rupee(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <button
                  className="btn small secondary"
                  onClick={() => {
                    setEditId(p.id);
                    setForm({
                      name: p.name,
                      description: p.description,
                      category: p.category,
                      gi_tag: p.gi_tag || "",
                      is_gi: p.is_gi,
                      is_organic: p.is_organic,
                      price: p.price,
                      stock: p.stock,
                      unit: p.unit,
                      location: p.location || "",
                      image_url: p.image_url || "",
                    });
                  }}
                >
                  Edit
                </button>{" "}
                <button className="btn small danger" onClick={() => remove(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
