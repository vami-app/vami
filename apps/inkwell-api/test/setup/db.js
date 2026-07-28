"use strict";

process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const connectDB = require("../../src/config/db");

async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
}

async function dropTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

async function closeTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

module.exports = {
  connectTestDB,
  dropTestDB,
  closeTestDB,
};
