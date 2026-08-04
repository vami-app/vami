/**
 * Auth Module — Service Layer
 * Business logic for authentication and session management.
 * Delegates data access to models/Admin.js directly (small enough for no separate repo).
 */
export {
  authenticateAdmin,
  updateAdminPassword,
} from '@/services/auth.service';
