const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");
const { mockNotify } = require("../notify");

const router = express.Router();

const STATUSES = ["pending", "confirmed", "shipped", "delivered"];

router.get("/", auth(), (req, res) => {
  if (req.user.role === "customer") {
    const orders = all(
      `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    const withItems = orders.map((o) => ({
      ...o,
      items: all(
        `SELECT oi.*, p.name, p.image_url, p.unit
           FROM order_items oi JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?`,
        [o.id]
      ),
    }));
    return res.json({ orders: withItems });
  }
  return res.status(403).json({ message: "Use farmer or admin order endpoints" });
});

router.get("/:id", auth(), (req, res) => {
  const order = get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (req.user.role === "customer" && order.customer_id !== req.user.id) {
    return res.status(403).json({ message: "Not your order" });
  }
  const items = all(
    `SELECT oi.*, p.name, p.image_url, p.unit, f.farm_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN farmers f ON f.id = p.farmer_id
      WHERE oi.order_id = ?`,
    [order.id]
  );
  res.json({ order, items });
});

router.post("/", auth(), allow("customer"), (req, res) => {
  const cart = all(
    `SELECT c.*, p.price, p.stock, p.name
       FROM cart_items c JOIN products p ON p.id = c.product_id
      WHERE c.user_id = ?`,
    [req.user.id]
  );
  if (!cart.length) return res.status(400).json({ message: "Your cart is empty" });
  for (const item of cart) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ message: `Not enough stock for ${item.name}` });
    }
  }
  const shipping_address = req.body.shipping_address || req.user.address;
  if (!shipping_address) {
    return res.status(400).json({ message: "Shipping address is required" });
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const created = run(
    "INSERT INTO orders (customer_id, total, status, shipping_address) VALUES (?, ?, 'pending', ?)",
    [req.user.id, total, shipping_address]
  );
  const orderId = created.lastInsertRowid;
  for (const item of cart) {
    run("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);
    run("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.product_id]);
  }
  run("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
  mockNotify({
    to: req.user.email,
    subject: `GreenCart order #${orderId} confirmed`,
    body: `Thank you ${req.user.name}. Your order of ₹${total.toFixed(2)} is pending farmer confirmation.`,
  });
  const order = get("SELECT * FROM orders WHERE id = ?", [orderId]);
  res.status(201).json({ order, message: "Order placed" });
});

router.put("/:id/status", auth(), (req, res) => {
  const order = get("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return res.status(404).json({ message: "Order not found" });
  const { status } = req.body;
  if (!["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (req.user.role === "farmer") {
    const owns = get(
      `SELECT oi.id FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN farmers f ON f.id = p.farmer_id
        WHERE oi.order_id = ? AND f.user_id = ?
        LIMIT 1`,
      [order.id, req.user.id]
    );
    if (!owns) return res.status(403).json({ message: "This order is not from your farm" });
  } else if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only farmer or admin can update status" });
  }

  run("UPDATE orders SET status = ? WHERE id = ?", [status, order.id]);
  res.json({ order: get("SELECT * FROM orders WHERE id = ?", [order.id]) });
});

module.exports = router;
