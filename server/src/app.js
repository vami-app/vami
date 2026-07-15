"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const { authLimiter, generalLimiter } = require("./middlewares/rateLimiter");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const uploadRoutes = require("./routes/upload.routes");
const feedRoutes = require("./routes/feed.routes");

const app = express();

app.set("trust proxy", 1);

// CORS — allow the Next.js client with credentials (cookies)
const allowedOriginCheck = (origin, callback) => {
  // Allow server-to-server or local script requests
  if (!origin) return callback(null, true);
  
  // Exact match with configured URL
  if (origin === env.clientUrl) return callback(null, true);
  
  // Allow localhost for dev
  if (origin.startsWith("http://localhost:")) return callback(null, true);
  
  // Allow dynamic Vercel preview deployments (matching vami-client or inkwell)
  if (origin.endsWith(".vercel.app") && (origin.includes("vami-client") || origin.includes("inkwell") || origin.includes("vami"))) {
    return callback(null, true);
  }
  
  callback(new Error("Not allowed by CORS"));
};

app.use(
  cors({
    origin: allowedOriginCheck,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded images
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../uploads"), {
    maxAge: "7d",
    setHeaders: (res) => res.set("Cross-Origin-Resource-Policy", "cross-origin"),
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" }, message: "Inkwell API is running" });
});

app.use("/api", generalLimiter);

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/feed", feedRoutes);

// 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
