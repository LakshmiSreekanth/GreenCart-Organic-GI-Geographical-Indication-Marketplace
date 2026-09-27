const express = require("express");
const { all, get, run } = require("../db");
const { auth, allow } = require("../auth");
const { productUpload } = require("../upload");

const router = express.Router();

function approvedFarmer(userId) {
  return get(
    "SELECT * FROM farmers WHERE user_id = ? AND certificate_status = 'approved'",
    [userId]
  );
}

function withRatings(products) {
  return products.map((p) => {
    const agg = get(
      `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count
         FROM reviews WHERE product_id = ?`,
      [p.id]
    );
    return { ...p, avg_rating: Number(agg.avg_rating.toFixed(1)), review_count: agg.review_count };
  });
}

router.get("/", (req, res) => {
  const { q, category, gi, organic, minPrice, maxPrice, location, farmerOnly } = req.query;
  let sql = `
    SELECT p.*, f.farm_name, f.location AS farm_location, u.name AS farmer_name
      FROM products p
      JOIN farmers f ON f.id = p.farmer_id
      JOIN users u ON u.id = f.user_id
     WHERE f.certificate_status = 'approved'
  `;
  const params = [];
  if (q) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ? OR p.gi_tag LIKE ?)";
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) {
    sql += " AND p.category = ?";
    params.push(category);
  }
  if (gi === "1") sql += " AND p.is_gi = 1";
  if (organic === "1") sql += " AND p.is_organic = 1";
  if (minPrice) {
    sql += " AND p.price >= ?";
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += " AND p.price <= ?";
    params.push(Number(maxPrice));
  }
  if (location) {
    sql += " AND (p.location LIKE ? OR f.location LIKE ?)";
    params.push(`%${location}%`, `%${location}%`);
  }
  sql += " ORDER BY p.created_at DESC";
  let products = all(sql, params);

  if (farmerOnly === "1" && req.headers.authorization) {
    // handled by /mine
  }

  res.json({ products: withRatings(products) });
});

router.get("/meta", (_req, res) => {
  const categories = all("SELECT DISTINCT category FROM products ORDER BY category");
  const giTags = all("SELECT DISTINCT gi_tag FROM products WHERE gi_tag IS NOT NULL AND gi_tag != ''");
  const locations = all("SELECT DISTINCT location FROM products WHERE location IS NOT NULL");
  res.json({
    categories: categories.map((c) => c.category),
    giTags: giTags.map((g) => g.gi_tag),
    locations: locations.map((l) => l.location),
  });
});

router.get("/mine", auth(), allow("farmer"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  const products = all("SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC", [
    farmer.id,
  ]);
  res.json({ farmer, products: withRatings(products) });
});

router.get("/:id", (req, res) => {
  const product = get(
    `SELECT p.*, f.farm_name, f.location AS farm_location, u.name AS farmer_name
       FROM products p
       JOIN farmers f ON f.id = p.farmer_id
       JOIN users u ON u.id = f.user_id
      WHERE p.id = ?`,
    [req.params.id]
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  const reviews = all(
    `SELECT r.*, u.name AS user_name
       FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC`,
    [product.id]
  );
  const rated = withRatings([product])[0];
  res.json({ product: rated, reviews });
});

router.post("/", auth(), allow("farmer"), productUpload.single("image"), (req, res) => {
  const farmer = approvedFarmer(req.user.id);
  if (!farmer) {
    return res.status(403).json({ message: "Admin must approve your organic certificate before you can sell" });
  }
  const { name, description, category, gi_tag, is_gi, is_organic, price, stock, unit, location, image_url } =
    req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ message: "Name, category and price are required" });
  }
  const image = req.file ? `/uploads/products/${req.file.filename}` : image_url || null;
  const result = run(
    `INSERT INTO products (farmer_id, name, description, category, gi_tag, is_gi, is_organic, price, stock, unit, location, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      farmer.id,
      name,
      description || "",
      category,
      gi_tag || null,
      Number(is_gi) ? 1 : 0,
      is_organic === "0" || is_organic === 0 ? 0 : 1,
      Number(price),
      Number(stock || 0),
      unit || "kg",
      location || farmer.location,
      image,
    ]
  );
  const product = get("SELECT * FROM products WHERE id = ?", [result.lastInsertRowid]);
  res.status(201).json({ product });
});

router.put("/:id", auth(), allow("farmer"), productUpload.single("image"), (req, res) => {
  const farmer = approvedFarmer(req.user.id);
  if (!farmer) return res.status(403).json({ message: "Certificate not approved" });
  const existing = get("SELECT * FROM products WHERE id = ? AND farmer_id = ?", [
    req.params.id,
    farmer.id,
  ]);
  if (!existing) return res.status(404).json({ message: "Product not found" });
  const { name, description, category, gi_tag, is_gi, is_organic, price, stock, unit, location, image_url } =
    req.body;
  const image = req.file
    ? `/uploads/products/${req.file.filename}`
    : image_url || existing.image_url;
  run(
    `UPDATE products SET name=?, description=?, category=?, gi_tag=?, is_gi=?, is_organic=?, price=?, stock=?, unit=?, location=?, image_url=?
      WHERE id=?`,
    [
      name || existing.name,
      description ?? existing.description,
      category || existing.category,
      gi_tag ?? existing.gi_tag,
      is_gi !== undefined ? (Number(is_gi) ? 1 : 0) : existing.is_gi,
      is_organic !== undefined ? (Number(is_organic) ? 1 : 0) : existing.is_organic,
      price !== undefined ? Number(price) : existing.price,
      stock !== undefined ? Number(stock) : existing.stock,
      unit || existing.unit,
      location || existing.location,
      image,
      existing.id,
    ]
  );
  res.json({ product: get("SELECT * FROM products WHERE id = ?", [existing.id]) });
});

router.delete("/:id", auth(), allow("farmer"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  const existing = get("SELECT * FROM products WHERE id = ? AND farmer_id = ?", [
    req.params.id,
    farmer.id,
  ]);
  if (!existing) return res.status(404).json({ message: "Product not found" });
  run("DELETE FROM products WHERE id = ?", [existing.id]);
  res.json({ message: "Product deleted" });
});

module.exports = router;
