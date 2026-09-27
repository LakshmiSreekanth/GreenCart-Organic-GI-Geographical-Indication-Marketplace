const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");

const router = express.Router();

router.get("/:productId/reviews", (req, res) => {
  const reviews = all(
    `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC`,
    [req.params.productId]
  );
  res.json({ reviews });
});

router.post("/:productId/reviews", auth(), allow("customer"), (req, res) => {
  const product = get("SELECT * FROM products WHERE id = ?", [req.params.productId]);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const { rating, comment } = req.body;
  const stars = Number(rating);
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "Rating must be 1–5" });
  }
  const purchased = get(
    `SELECT oi.id FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.customer_id = ? AND oi.product_id = ?
      LIMIT 1`,
    [req.user.id, product.id]
  );
  if (!purchased) {
    return res.status(403).json({ message: "You can review products you have ordered" });
  }
  const existing = get("SELECT id FROM reviews WHERE product_id = ? AND user_id = ?", [
    product.id,
    req.user.id,
  ]);
  if (existing) {
    run("UPDATE reviews SET rating = ?, comment = ? WHERE id = ?", [
      stars,
      comment || "",
      existing.id,
    ]);
  } else {
    run("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", [
      product.id,
      req.user.id,
      stars,
      comment || "",
    ]);
  }
  res.status(201).json({ message: "Review saved" });
});

module.exports = router;
