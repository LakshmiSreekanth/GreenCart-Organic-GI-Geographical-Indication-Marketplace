const jwt = require("jsonwebtoken");
const { get } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "greencart_dev_secret_change_in_production";

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ message: "Login required" });
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = get("SELECT id, name, email, role, phone, address FROM users WHERE id = ?", [
        payload.id,
      ]);
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }
    next();
  };
}

module.exports = { signToken, auth, allow };
