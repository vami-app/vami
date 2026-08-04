import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * Higher-Order Function to wrap API Route Handlers.
 * Automatically handles DB connection, Authentication, and generic Error catching.
 *
 * @param {Function} handler - The actual API logic function
 * @param {Object} options - { requireAuth: boolean }
 */
export function withApiHandler(handler, options = { requireAuth: false, requiredPermission: null }) {
  return async (request, context) => {
    try {
      // 1. Authenticate if required
      if (options.requireAuth) {
        const { decoded, error } = await requireAuth(request);
        if (error) return error; // Returns the 401 response
        
        // PBAC: Check permissions cryptographically without hitting DB
        if (options.requiredPermission) {
          const { hasPermission } = await import('@/lib/permissions');
          if (!hasPermission(decoded, options.requiredPermission)) {
            return NextResponse.json({ error: 'Forbidden: Insufficient Permissions' }, { status: 403 });
          }
        }
      }

      // 2. Ensure Database Connection
      await dbConnect();

      // 3. Execute Handler
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle MongoDB Duplicate Key Error (11000)
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || 'field';
        return NextResponse.json(
          { error: `A record with this ${field} already exists.` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: error.status || 500 }
      );
    }
  };
}
