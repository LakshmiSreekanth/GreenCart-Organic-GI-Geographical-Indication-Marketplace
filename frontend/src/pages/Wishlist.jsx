import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupee } from "../api.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);

  async function load() {
    const d = await api("/api/wishlist");
    setItems(d.items);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api(`/api/wishlist/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>Wishlist</h1>
      <div className="grid">
        {items.map((i) => (
          <div className="card" key={i.id}>
            <img src={i.image_url} alt={i.name} />
            <div className="card-body">
              {i.is_gi ? <span className="gi">GI Certified</span> : null}
              <h3>
                <Link to={`/product/${i.product_id}`}>{i.name}</Link>
              </h3>
              <div className="price">{rupee(i.price)}</div>
              <button className="btn small" onClick={() => remove(i.product_id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {!items.length && <p>Nothing saved yet.</p>}
    </div>
  );
}
