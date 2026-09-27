const express = require("express");
const bcrypt = require("bcryptjs");
const { get, run } = require("../db");
const { signToken, auth } = require("../auth");
const { certUpload } = require("../upload");

const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email, password, role, phone, address, farm_name, location } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  const userRole = role === "farmer" ? "farmer" : "customer";
  if (get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()])) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const result = run(
    "INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
    [name, email.toLowerCase(), password_hash, userRole, phone || null, address || null]
  );
  const userId = result.lastInsertRowid;
  if (userRole === "farmer") {
    run(
      "INSERT INTO farmers (user_id, farm_name, location, certificate_status) VALUES (?, ?, ?, 'pending')",
      [userId, farm_name || `${name}'s Farm`, location || address || "India"]
    );
  }
  const user = get("SELECT id, name, email, role, phone, address FROM users WHERE id = ?", [userId]);
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = get("SELECT * FROM users WHERE email = ?", [(email || "").toLowerCase()]);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
  };
  res.json({ token: signToken(user), user: publicUser });
});

router.get("/me", auth(), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  res.json({ user: req.user, farmer });
});

router.put("/me", auth(), (req, res) => {
  const { name, phone, address } = req.body;
  run("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?", [
    name || req.user.name,
    phone || req.user.phone,
    address || req.user.address,
    req.user.id,
  ]);
  const user = get("SELECT id, name, email, role, phone, address FROM users WHERE id = ?", [
    req.user.id,
  ]);
  res.json({ user });
});

router.post("/certificate", auth(), allowFarmer, certUpload.single("certificate"), (req, res) => {
  const farmer = get("SELECT * FROM farmers WHERE user_id = ?", [req.user.id]);
  if (!farmer) return res.status(404).json({ message: "Farmer profile not found" });
  if (!req.file) return res.status(400).json({ message: "Certificate file is required" });
  const filePath = `/uploads/certificates/${req.file.filename}`;
  run(
    "UPDATE farmers SET certificate_path = ?, certificate_status = 'pending', rejection_reason = NULL WHERE id = ?",
    [filePath, farmer.id]
  );
  res.json({ message: "Certificate uploaded. Waiting for admin review.", certificate_path: filePath });
});

function allowFarmer(req, res, next) {
  if (req.user.role !== "farmer") {
    return res.status(403).json({ message: "Farmer account required" });
  }
  next();
}

module.exports = router;
