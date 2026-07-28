"use strict";

const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");

async function start() {
  await connectDB();
  const { initSocket } = require("./config/socket");
  const server = app.listen(env.port, () => {
    console.log(`[server] Inkwell API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
  initSocket(server);

  const shutdown = (signal) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
