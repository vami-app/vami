import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/auth';
import { ROLE_PERMISSIONS, ROLES } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// ─── Lockout Policy ─────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Authenticate an admin and return a signed JWT.
 * Implements account lockout after repeated failures (GAP-12).
 */
export const authenticateAdmin = async (email, password) => {
  await dbConnect();

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  // ── Unknown email — return generic error (timing-safe: same path as bad password)
  if (!admin) {
    logger.warn('Login attempt for unknown email', { domain: 'auth', email });
    return { error: 'Invalid credentials', status: 401 };
  }

  // ── Check account lockout ─────────────────────────────────────────────────
  if (admin.lockUntil && admin.lockUntil > new Date()) {
    const remainingMs = admin.lockUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    logger.warn('Login attempt on locked account', {
      domain: 'auth',
      adminId: admin._id.toString(),
      lockedUntil: admin.lockUntil,
    });
    return {
      error: `Account is temporarily locked. Try again in ${remainingMin} minute(s).`,
      status: 429,
    };
  }

  // ── Verify password ───────────────────────────────────────────────────────
  const isValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isValid) {
    // Increment failure counter and potentially lock the account
    const newAttempts = (admin.loginAttempts || 0) + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

    await Admin.findByIdAndUpdate(admin._id, {
      loginAttempts: newAttempts,
      ...(shouldLock && { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) }),
    });

    logger.warn('Failed login attempt', {
      domain: 'auth',
      adminId: admin._id.toString(),
      attempts: newAttempts,
      locked: shouldLock,
    });

    if (shouldLock) {
      return {
        error: `Too many failed attempts. Account locked for ${LOCK_DURATION_MS / 60000} minutes.`,
        status: 429,
      };
    }

    return { error: 'Invalid credentials', status: 401 };
  }

  // ── Successful login — reset lockout counters ─────────────────────────────
  if (admin.loginAttempts > 0) {
    await Admin.findByIdAndUpdate(admin._id, {
      loginAttempts: 0,
      lockUntil: null,
    });
  }

  const role = admin.role || ROLES.SUPER_ADMIN;
  const permissions = ROLE_PERMISSIONS[role];

  // Include tokenVersion in JWT payload to enable instant revocation (GAP-10)
  const token = await signToken({
    adminId: admin._id.toString(),
    email: admin.email,
    role,
    permissions,
    version: admin.tokenVersion ?? 0,
  });

  logger.info('Admin login successful', {
    domain: 'auth',
    adminId: admin._id.toString(),
    role,
  });

  return { token };
};

/**
 * Update admin password and invalidate all existing sessions.
 */
export const updateAdminPassword = async (email, currentPassword, newPassword) => {
  await dbConnect();

  const admin = await Admin.findOne({ email });
  if (!admin) return { error: 'Admin not found', status: 404 };

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return { error: 'Current password is incorrect', status: 400 };

  // Increment tokenVersion to revoke all existing JWT sessions
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  admin.loginAttempts = 0;
  admin.lockUntil = null;
  await admin.save();

  logger.info('Admin password changed — all sessions revoked', {
    domain: 'auth',
    adminId: admin._id.toString(),
  });

  return { success: true };
};
