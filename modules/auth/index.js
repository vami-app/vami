/**
 * Auth Module — Public API
 *
 * Only these exports are allowed to be imported by other modules or app/ routes.
 * Internal files (auth.model.js, etc.) must never be imported directly from outside this module.
 */
export {
  authenticateAdmin,
  updateAdminPassword,
} from './auth.service';

export { AuthLoginSchema, AuthPasswordSchema } from './auth.schema';
