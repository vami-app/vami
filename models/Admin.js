import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'EDITOR'],
      default: 'SUPER_ADMIN',
      required: true,
    },

    // ─── Session Revocation (GAP-10) ──────────────────────────────────
    // Incremented on password change or explicit "sign out all sessions".
    // The JWT payload carries this version — if it doesn't match, the
    // token is treated as revoked without needing a token blocklist.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // ─── Brute Force Protection (GAP-12) ─────────────────────────────
    // Account is locked for 15 minutes after 5 consecutive failures.
    // Resets to 0 on a successful login.
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AdminSchema.index({ createdAt: -1 });

/**
 * Virtual: returns true if the account is currently locked.
 */
AdminSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > new Date();
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
