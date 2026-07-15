"use strict";

const mongoose = require("mongoose");
const env = require("./env");

/**
 * Connect to MongoDB. Exits the process on a fatal connection error.
 * @returns {Promise<typeof mongoose>}
 */
async function connectDB() {
  mongoose.set("strictQuery", true);
  try {
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error("[db] MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
