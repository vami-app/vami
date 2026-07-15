"use strict";

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { ApiError } = require("../utils/apiResponse");

const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(12).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * @type {import('multer').Options['fileFilter']}
 */
function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, "Only JPEG, PNG, WEBP, or GIF images are allowed"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload, UPLOAD_DIR };
