"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  console.log("=== Reset Export Limits Utility ===");
  await connectDB();

  const res = await User.updateMany(
    {},
    {
      $set: { exportStatus: "idle" },
      $unset: { exportRequestedAt: "" }
    }
  );

  console.log(`Successfully reset export request limits for ${res.modifiedCount} users!`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Reset failed:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
