const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");
const { mockNotify } = require("../notify");

const router = express.Router();

router.use(auth(), allow("admin"));

router.get("/dashboard", (_req, res) => {
  const stats = get(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT COUNT(*) FROM users WHERE role = 'farmer') AS farmers,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled') AS revenue,
      (SELECT COUNT(*) FROM farmers WHERE certificate_status = 'pending') AS pending_farmers
  `);
  const recentOrders = all(
    `SELECT o.*, u.name AS customer_name
       FROM orders o JOIN users u ON u.id = o.customer_id
      ORDER BY o.created_at DESC LIMIT 8`
  );
  const topProducts = all(`
    SELECT p.name, SUM(oi.quantity) AS sold, SUM(oi.quantity * oi.price) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
     GROUP BY p.id
     ORDER BY sold DESC
     LIMIT 5
  `);
  res.json({ stats, recentOrders, topProducts });
});

router.get("/farmers", (req, res) => {
  const status = req.query.status;
  let sql = `
    SELECT f.*, u.name, u.email, u.phone
      FROM farmers f JOIN users u ON u.id = f.user_id
  `;
  const params = [];
  if (status) {
    sql += " WHERE f.certificate_status = ?";
    params.push(status);
  }
  sql += " ORDER BY f.created_at DESC";
  res.json({ farmers: all(sql, params) });
});

router.put("/farmers/:id/approve", (req, res) => {
  const farmer = get(
    `SELECT f.*, u.email, u.name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = ?`,
    [req.params.id]
  );
  if (!farmer) return res.status(404).json({ message: "Farmer not found" });
  run("UPDATE farmers SET certificate_status = 'approved', rejection_reason = NULL WHERE id = ?", [
    farmer.id,
  ]);
  mockNotify({
    to: farmer.email,
    subject: "GreenCart: certificate approved",
    body: `Hi ${farmer.name}, your farm ${farmer.farm_name} is verified. You can now list products.`,
  });
  res.json({ message: "Farmer approved" });
});

router.put("/farmers/:id/reject", (req, res) => {
  const farmer = get(
    `SELECT f.*, u.email, u.name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = ?`,
    [req.params.id]
  );
  if (!farmer) return res.status(404).json({ message: "Farmer not found" });
  const reason = req.body.reason || "Certificate could not be verified";
  run("UPDATE farmers SET certificate_status = 'rejected', rejection_reason = ? WHERE id = ?", [
    reason,
    farmer.id,
  ]);
  mockNotify({
    to: farmer.email,
    subject: "GreenCart: certificate rejected",
    body: `Hi ${farmer.name}, we could not approve your certificate. Reason: ${reason}`,
  });
  res.json({ message: "Farmer rejected" });
});

router.get("/users", (_req, res) => {
  const users = all(
    `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at, f.certificate_status, f.farm_name
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
      ORDER BY u.created_at DESC`
  );
  res.json({ users });
});

router.delete("/users/:id", (req, res) => {
  const user = get("SELECT * FROM users WHERE id = ?", [req.params.id]);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin") return res.status(400).json({ message: "Cannot delete admin" });
  run("DELETE FROM users WHERE id = ?", [user.id]);
  res.json({ message: "User removed" });
});

router.get("/products", (_req, res) => {
  const products = all(
    `SELECT p.*, f.farm_name, u.name AS farmer_name
       FROM products p
       JOIN farmers f ON f.id = p.farmer_id
       JOIN users u ON u.id = f.user_id
      ORDER BY p.created_at DESC`
  );
  res.json({ products });
});

router.delete("/products/:id", (req, res) => {
  run("DELETE FROM products WHERE id = ?", [req.params.id]);
  res.json({ message: "Product removed" });
});

router.get("/orders", (_req, res) => {
  const orders = all(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON u.id = o.customer_id
      ORDER BY o.created_at DESC`
  );
  const withItems = orders.map((o) => ({
    ...o,
    items: all(
      `SELECT oi.*, p.name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
      [o.id]
    ),
  }));
  res.json({ orders: withItems });
});

module.exports = router;
