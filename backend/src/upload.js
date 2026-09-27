const path = require("path");
const multer = require("multer");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "certificates"), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "products"), { recursive: true });

function storage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_DIR, folder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });
}

const certUpload = multer({
  storage: storage("certificates"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const productUpload = multer({
  storage: storage("products"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { certUpload, productUpload, UPLOAD_DIR };
