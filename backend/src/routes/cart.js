const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");

const router = express.Router();

router.get("/", auth(), allow("customer"), (req, res) => {
  const items = all(
    `SELECT c.id, c.quantity, p.id AS product_id, p.name, p.price, p.unit, p.stock, p.image_url, p.is_gi, p.gi_tag
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?`,
    [req.user.id]
  );
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ items, subtotal });
});

router.post("/", auth(), allow("customer"), (req, res) => {
  const { product_id, quantity } = req.body;
  const product = get("SELECT * FROM products WHERE id = ?", [product_id]);
  if (!product) return res.status(404).json({ message: "Product not found" });
  const qty = Math.max(1, Number(quantity || 1));
  const existing = get("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [
    req.user.id,
    product_id,
  ]);
  if (existing) {
    run("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?", [qty, existing.id]);
  } else {
    run("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [
      req.user.id,
      product_id,
      qty,
    ]);
  }
  res.status(201).json({ message: "Added to cart" });
});

router.put("/:id", auth(), allow("customer"), (req, res) => {
  const qty = Math.max(1, Number(req.body.quantity || 1));
  const item = get("SELECT * FROM cart_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  run("UPDATE cart_items SET quantity = ? WHERE id = ?", [qty, item.id]);
  res.json({ message: "Cart updated" });
});

router.delete("/:id", auth(), allow("customer"), (req, res) => {
  run("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  res.json({ message: "Removed from cart" });
});

router.delete("/", auth(), allow("customer"), (req, res) => {
  run("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
  res.json({ message: "Cart cleared" });
});

module.exports = router;
