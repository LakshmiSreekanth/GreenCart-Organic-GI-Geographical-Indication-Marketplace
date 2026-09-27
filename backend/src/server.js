require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const { seedIfEmpty } = require("./seed");
const authRoutes = require("./routes/auth");
const farmerRoutes = require("./routes/farmers");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviews");
const wishlistRoutes = require("./routes/wishlist");
const recommendRoutes = require("./routes/recommend");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static uploads
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "GreenCart API", runtime: "Node.js + Express" });
});

// Express.js REST API routes
app.use("/api/auth", authRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/recommend", recommendRoutes);

// Serve React Frontend (No Vite needed - served directly by Express)
const frontendDir = path.resolve(__dirname, "../../frontend");
app.use(express.static(frontendDir));

// Fallback to frontend index.html for client-side navigation
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(frontendDir, "index.html"));
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

// Initialize database, seed if empty, and start Express server
initDb()
  .then(() => {
    const seeded = seedIfEmpty();
    if (seeded) console.log("Database seeded with demo marketplace data");
    app.listen(PORT, () => {
      console.log(`GreenCart application running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
