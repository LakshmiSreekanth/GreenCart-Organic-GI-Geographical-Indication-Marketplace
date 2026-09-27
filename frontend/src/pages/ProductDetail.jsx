import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, rupee } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, setCartCount, refreshMe } = useAuth();
  const [data, setData] = useState(null);
  const [recs, setRecs] = useState([]);
  const [msg, setMsg] = useState("");
  const [review, setReview] = useState({ rating: 5, comment: "" });

  async function load() {
    const d = await api(`/api/products/${id}`);
    setData(d);
    const r = await api(`/api/recommend/${id}`);
    setRecs(r.recommendations || []);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addCart() {
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ product_id: Number(id), quantity: 1 }) });
      setMsg("Added to cart");
      refreshMe();
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function wish() {
    try {
      await api("/api/wishlist", { method: "POST", body: JSON.stringify({ product_id: Number(id) }) });
      setMsg("Saved to wishlist");
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    try {
      await api(`/api/products/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify(review),
      });
      setMsg("Review saved");
      load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!data) return <div className="page-msg">Loading product…</div>;
  const p = data.product;

  return (
    <div>
      <div className="product-hero">
        <img src={p.image_url} alt={p.name} />
        <div>
          {p.is_gi ? <span className="gi">GI Certified · {p.gi_tag}</span> : null}{" "}
          {p.is_organic ? <span className="organic">Organic</span> : null}
          <h1>{p.name}</h1>
          <p className="muted">
            {p.farm_name} · {p.location} · {p.avg_rating}★ from {p.review_count} reviews
          </p>
          <div className="price">{rupee(p.price)} / {p.unit}</div>
          <p>{p.description}</p>
          <p className="muted">In stock: {p.stock}</p>
          {msg && <p className="notice">{msg}</p>}
          {user?.role === "customer" && (
            <div className="row">
              <button className="btn" onClick={addCart}>
                Add to cart
              </button>
              <button className="btn secondary" onClick={wish}>
                Wishlist
              </button>
            </div>
          )}
          {!user && <Link to="/login">Login as customer to order</Link>}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 28 }}>
        <h2>Reviews</h2>
        {data.reviews.map((r) => (
          <div key={r.id} style={{ marginBottom: 12 }}>
            <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <strong>{r.user_name}</strong>
            <p>{r.comment}</p>
          </div>
        ))}
        {user?.role === "customer" && (
          <form onSubmit={submitReview}>
            <h3>Write a review</h3>
            <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <textarea
              placeholder="How was the harvest?"
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
            />
            <button className="btn" style={{ marginTop: 8 }}>
              Submit review
            </button>
          </form>
        )}
      </div>

      <h2>You may also like</h2>
      <p className="muted">Similar products from the REST API, matched by category, GI tag, and origin.</p>
      <div className="grid">
        {recs.map((r) => (
          <Link to={`/product/${r.id}`} className="card" key={r.id}>
            <img src={r.image_url} alt={r.name} />
            <div className="card-body">
              {r.is_gi ? <span className="gi">GI Certified</span> : null}
              <h3>{r.name}</h3>
              <div className="price">{rupee(r.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
