"use strict";

const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const { authLimiter, generalLimiter } = require("./middlewares/rateLimiter");

const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const uploadRoutes = require("./routes/upload.routes");
const feedRoutes = require("./routes/feed.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const publicationRoutes = require("./routes/publication.routes");
const readingListRoutes = require("./routes/readingList.routes");

const app = express();

app.set("trust proxy", 1);

// CORS — allow the Next.js client with credentials (cookies)
const ALLOWED_ORIGIN_PATTERNS = [
  env.clientUrl,
  "https://inkwell-client.vercel.app",
  /^https:\/\/inkwell-client-[a-z0-9-]+-inkwell-org\.vercel\.app$/
];

const allowedOriginCheck = (origin, callback) => {
  // Allow server-to-server or local script requests
  if (!origin) return callback(null, true);
  
  // Allow localhost for dev
  if (origin.startsWith("http://localhost:")) return callback(null, true);
  
  const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => {
    if (typeof pattern === "string") {
      return origin === pattern;
    }
    return pattern.test(origin);
  });
  
  if (isAllowed) {
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

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const passport = require("./config/passport");
app.use(passport.initialize());

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
const webhookRoutes = require("./routes/webhook.routes");
const telemetryRoutes = require("./routes/telemetry.routes");
const membershipRoutes = require("./routes/membership.routes");
const writerRoutes = require("./routes/writer.routes");
const notificationRoutes = require("./routes/notification.routes");
const highlightRoutes = require("./routes/highlight.routes");

const { ModuleRegistry } = require("../../../libs/shared/registry/module-registry");
const identityModule = require("../../../services/identity-service");
new ModuleRegistry().register(identityModule).mountAll(app);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/writer", writerRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/lists", readingListRoutes);
app.use("/api", highlightRoutes);

// 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
