import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '@/env.mjs';
import { logger } from '@/lib/logger';

// Fix Windows DNS SRV lookup issues for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if unsupported in specific edge environments
}

const MONGODB_URI = env.MONGODB_URI;

/**
 * Global cache prevents connections from growing exponentially
 * during API Route usage in development (hot reloads) and reuses
 * warm connections in serverless production invocations.
 */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,

      // ─── Connection Pool ──────────────────────────────────────────
      // In serverless, each function instance is isolated.
      // maxPoolSize controls connections per instance; keep it small
      // to avoid exhausting Atlas M0's 500-connection limit.
      maxPoolSize: 10,

      // ─── Timeouts ─────────────────────────────────────────────────
      // Fail fast instead of hanging indefinitely in serverless.
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      logger.info('MongoDB connected', { domain: 'db' });
      return m;
    });

    // ─── Connection Lifecycle Events ─────────────────────────────────
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { domain: 'db', error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', { domain: 'db' });
      // Reset cached connection so the next request re-establishes
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', { domain: 'db' });
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
