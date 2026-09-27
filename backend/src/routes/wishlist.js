const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");

const router = express.Router();

router.get("/", auth(), allow("customer"), (req, res) => {
  const items = all(
    `SELECT w.id, w.product_id, p.name, p.price, p.image_url, p.is_gi, p.gi_tag, p.unit
       FROM wishlist w JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({ items });
});

router.post("/", auth(), allow("customer"), (req, res) => {
  const { product_id } = req.body;
  const product = get("SELECT id FROM products WHERE id = ?", [product_id]);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const existing = get("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?", [
    req.user.id,
    product_id,
  ]);
  if (existing) return res.json({ message: "Already in wishlist" });
  run("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)", [req.user.id, product_id]);
  res.status(201).json({ message: "Saved to wishlist" });
});

router.delete("/:productId", auth(), allow("customer"), (req, res) => {
  run("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [
    req.user.id,
    req.params.productId,
  ]);
  res.json({ message: "Removed from wishlist" });
});

module.exports = router;
