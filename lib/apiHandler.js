import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Higher-Order Function to wrap API Route Handlers.
 *
 * Responsibilities (in order):
 *   1. Authenticate & authorize (if required)
 *   2. Ensure DB connection
 *   3. Execute handler
 *   4. Catch & structure errors — never leak internals to client in production
 *
 * @param {Function} handler
 * @param {{ requireAuth?: boolean, requiredPermission?: string | null }} [options]
 */
export function withApiHandler(handler, options = { requireAuth: false, requiredPermission: null }) {
  return async (request, context) => {
    try {
      // ── 1. Authentication & Authorization ──────────────────────────
      if (options.requireAuth) {
        const { decoded, error } = await requireAuth(request);
        if (error) return error;

        // PBAC: Check permissions embedded in JWT — no additional DB round-trip
        if (options.requiredPermission) {
          const { hasPermission } = await import('@/lib/permissions');
          if (!hasPermission(decoded, options.requiredPermission)) {
            logger.warn('Forbidden: insufficient permissions', {
              domain: 'auth',
              permission: options.requiredPermission,
              adminId: decoded.adminId,
              path: request.nextUrl?.pathname,
            });
            return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
          }
        }
      }

      // ── 2. Database Connection ──────────────────────────────────────
      await dbConnect();

      // ── 3. Execute Handler ──────────────────────────────────────────
      return await handler(request, context);

    } catch (error) {
      // ── 4. Structured Error Handling ───────────────────────────────
      const isProduction = process.env.NODE_ENV === 'production';

      // Log with full context — parseable by any log aggregator
      logger.error('Unhandled API error', {
        domain: 'api',
        path: request.nextUrl?.pathname,
        method: request.method,
        errorCode: error.code,
        message: error.message,
        // Stack trace only in development
        stack: !isProduction ? error.stack : undefined,
      });

      // ── MongoDB Duplicate Key ─────────────────────────────────────
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || 'field';
        return NextResponse.json(
          { error: `A record with this ${field} already exists.`, code: 'DUPLICATE_KEY' },
          { status: 409 }
        );
      }

      // ── Mongoose Validation Error ─────────────────────────────────
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Database validation failed', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      // ── Generic 500 — sanitize message in production ──────────────
      const clientMessage = isProduction ? 'Internal Server Error' : error.message;

      return NextResponse.json(
        { error: clientMessage, code: 'INTERNAL_ERROR' },
        { status: error.status || 500 }
      );
    }
  };
}
