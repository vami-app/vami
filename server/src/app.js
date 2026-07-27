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
const uploadRoutes = require("./routes/upload.routes");
const feedRoutes = require("./routes/feed.routes");
const adminRoutes = require("./routes/admin.routes");
const reportRoutes = require("./routes/report.routes");
const publicationRoutes = require("./routes/publication.routes");

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
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/webhooks", webhookRoutes);
const { registry } = require("./kernel");
const { highlightModule } = require("./modules/highlights/highlights.module");
const { readingListModule } = require("./modules/reading-lists/reading-lists.module");
const { postRevisionsModule } = require("./modules/post-revisions/post-revisions.module");
const { commentsModule } = require("./modules/comments/comments.module");
const { notificationsModule } = require("./modules/notifications/notifications.module");

registry.register("highlights", highlightModule);
registry.register("reading-lists", readingListModule);
registry.register("post-revisions", postRevisionsModule);
registry.register("comments", commentsModule);
registry.register("notifications", notificationsModule);
registry.boot(app);

app.use("/api/membership", membershipRoutes);
app.use("/api/writer", writerRoutes);
app.use("/api/publications", publicationRoutes);

// 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
