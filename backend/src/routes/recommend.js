const express = require("express");
const { all, get } = require("../db");

const router = express.Router();

// General featured recommendations (GI & Organic curated picks)
router.get("/", (_req, res) => {
  const recommendations = all(
    `SELECT p.*, f.farm_name,
            COALESCE(ROUND(AVG(r.rating), 1), 5.0) AS avg_rating,
            COUNT(r.id) AS review_count
       FROM products p
       JOIN farmers f ON f.id = p.farmer_id
  LEFT JOIN reviews r ON r.product_id = p.id
      WHERE f.certificate_status = 'approved'
      GROUP BY p.id
      ORDER BY p.is_gi DESC, avg_rating DESC, p.created_at DESC
      LIMIT 8`
  );
  res.json({ recommendations });
});

// Product-specific recommendations (content-based via Category, GI Tag, Origin & Rating)
router.get("/:productId", (req, res) => {
  const product = get("SELECT * FROM products WHERE id = ?", [req.params.productId]);
  if (!product) {
    return res.status(404).json({ message: "Product not found", recommendations: [] });
  }

  // 1. Direct matches by GI tag, category, and location with scoring
  let recommendations = all(
    `SELECT p.*, f.farm_name,
            COALESCE(ROUND(AVG(r.rating), 1), 5.0) AS avg_rating,
            COUNT(r.id) AS review_count,
            (
              CASE WHEN p.gi_tag IS NOT NULL AND p.gi_tag != '' AND p.gi_tag = ? THEN 4 ELSE 0 END +
              CASE WHEN p.category = ? THEN 3 ELSE 0 END +
              CASE WHEN p.location = ? THEN 2 ELSE 0 END +
              CASE WHEN p.is_gi = 1 THEN 1 ELSE 0 END
            ) AS score
       FROM products p
       JOIN farmers f ON f.id = p.farmer_id
  LEFT JOIN reviews r ON r.product_id = p.id
      WHERE p.id != ?
        AND f.certificate_status = 'approved'
        AND (p.category = ? OR (p.gi_tag IS NOT NULL AND p.gi_tag = ?) OR p.location = ?)
      GROUP BY p.id
      ORDER BY score DESC, avg_rating DESC, p.price ASC
      LIMIT 6`,
    [
      product.gi_tag || "",
      product.category,
      product.location,
      product.id,
      product.category,
      product.gi_tag || "",
      product.location,
    ]
  );

  // 2. If fewer than 4 items found, supplement with other verified organic/GI products
  if (recommendations.length < 4) {
    const existingIds = [product.id, ...recommendations.map((r) => r.id)];
    const placeholders = existingIds.map(() => "?").join(",");
    const fallback = all(
      `SELECT p.*, f.farm_name,
              COALESCE(ROUND(AVG(r.rating), 1), 5.0) AS avg_rating,
              COUNT(r.id) AS review_count,
              1 AS score
         FROM products p
         JOIN farmers f ON f.id = p.farmer_id
    LEFT JOIN reviews r ON r.product_id = p.id
        WHERE p.id NOT IN (${placeholders})
          AND f.certificate_status = 'approved'
        GROUP BY p.id
        ORDER BY p.is_gi DESC, avg_rating DESC
        LIMIT ?`,
      [...existingIds, 6 - recommendations.length]
    );
    recommendations = recommendations.concat(fallback);
  }

  res.json({ product_id: product.id, recommendations });
});

module.exports = router;
