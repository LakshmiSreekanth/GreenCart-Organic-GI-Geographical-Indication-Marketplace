import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupee } from "../api.js";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], giTags: [], locations: [] });
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    gi: "",
    organic: "",
    minPrice: "",
    maxPrice: "",
    location: "",
  });

  function load() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    api("/api/products?" + params.toString()).then((d) => setProducts(d.products));
  }

  useEffect(() => {
    api("/api/products/meta").then(setMeta);
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <div>
      <h1>Shop organic & GI produce</h1>
      <p className="muted">Search by name, filter by GI tag, category, price and origin.</p>
      <div className="filters">
        <input
          placeholder="Search tea, mango, rice…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {meta.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={filters.gi} onChange={(e) => setFilters({ ...filters, gi: e.target.value })}>
          <option value="">GI & others</option>
          <option value="1">GI tagged only</option>
        </select>
        <select value={filters.organic} onChange={(e) => setFilters({ ...filters, organic: e.target.value })}>
          <option value="">Any farming</option>
          <option value="1">Organic only</option>
        </select>
        <input
          type="number"
          placeholder="Min ₹"
          value={filters.minPrice}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
        />
        <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
          <option value="">Any origin</option>
          {meta.locations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="grid">
        {products.map((p) => (
          <Link to={`/product/${p.id}`} className="card" key={p.id}>
            <img src={p.image_url} alt={p.name} />
            <div className="card-body">
              {p.is_gi ? <span className="gi">GI Certified</span> : null}
              {p.is_organic ? <span className="organic">Organic</span> : null}
              <h3>{p.name}</h3>
              <div className="muted">
                {p.location} · {p.avg_rating}★ ({p.review_count})
              </div>
              <div className="price">
                {rupee(p.price)} <span className="muted">/ {p.unit}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!products.length && <p className="page-msg">No products match these filters.</p>}
    </div>
  );
}
