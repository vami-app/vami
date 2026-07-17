"use strict";

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  console.log("=== Promote User to Admin Utility ===");
  
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Error: Please provide a user email as an argument.");
    console.error("Usage: node server/src/scripts/promote_admin.js <email>");
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`Error: User with email "${email}" not found.`);
    await mongoose.connection.close();
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`User "${user.name}" (${email}) is already an admin.`);
  } else {
    user.role = "admin";
    await user.save();
    console.log(`Successfully promoted "${user.name}" (${email}) to admin!`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("Promotion failed:", err);
  try {
    await mongoose.connection.close();
  } catch (e) {}
  process.exit(1);
});
