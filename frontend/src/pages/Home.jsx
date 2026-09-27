import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, rupee } from "../api.js";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api("/api/products").then((d) => setProducts(d.products.slice(0, 8)));
  }, []);

  return (
    <div>
      <section className="hero">
        <div>
          <div className="kicker">Organic · GI certified · Farm direct</div>
          <h1>A marketplace for produce with a place and a story.</h1>
          <p>
            GreenCart is a mini-Amazon for organic and Geographical Indication products. Farmers
            sell after certificate verification. Customers browse, filter, and order. Admin keeps
            the shelf honest.
          </p>
          <div className="row">
            <Link to="/shop" className="btn">
              Browse harvest
            </Link>
            <Link to="/register" className="btn secondary">
              Sell as a farmer
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>How it works</h3>
          <p>1. Farmer uploads an organic certificate</p>
          <p>2. Admin approves the farm</p>
          <p>3. Products go live with GI badges</p>
          <p>4. Customer orders · farmer fulfils · admin tracks</p>
        </div>
      </section>
      <h2>In season now</h2>
      <div className="grid">
        {products.map((p) => (
          <Link to={`/product/${p.id}`} className="card" key={p.id}>
            <img src={p.image_url} alt={p.name} />
            <div className="card-body">
              {p.is_gi ? <span className="gi">GI Certified</span> : null}
              {p.is_organic ? <span className="organic">Organic</span> : null}
              <h3>{p.name}</h3>
              <div className="muted">{p.farm_name}</div>
              <div className="price">{rupee(p.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
