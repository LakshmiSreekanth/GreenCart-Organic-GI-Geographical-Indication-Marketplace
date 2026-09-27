const express = require("express");
const { all, get } = require("../db");
const { auth, allow } = require("../auth");

const router = express.Router();

router.get("/me", auth(), allow("farmer"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  res.json({ farmer });
});

router.get("/dashboard", auth(), allow("farmer"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  if (!farmer) return res.status(404).json({ message: "Farmer not found" });

  const totals = get(
    `SELECT
      (SELECT COUNT(*) FROM products WHERE farmer_id = ?) AS total_products,
      (SELECT COUNT(DISTINCT o.id)
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id
        WHERE p.farmer_id = ?) AS total_orders,
      (SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE p.farmer_id = ?) AS total_earnings`,
    [farmer.id, farmer.id, farmer.id]
  );

  const recent = all(
    `SELECT o.id, o.status, o.created_at, o.total, u.name AS customer_name,
            oi.quantity, oi.price, p.name AS product_name
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
      WHERE p.farmer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 12`,
    [farmer.id]
  );

  res.json({ farmer, totals, recent });
});

router.get("/orders", auth(), allow("farmer"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  const orders = all(
    `SELECT o.id, o.status, o.created_at, o.shipping_address, u.name AS customer_name,
            p.name AS product_name, oi.quantity, oi.price,
            (oi.quantity * oi.price) AS line_total
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
      WHERE p.farmer_id = ?
      ORDER BY o.created_at DESC`,
    [farmer.id]
  );
  res.json({ orders });
});

module.exports = router;
