/**
 * Initial auth form state helper.
 * FSD model layer abstraction for auth feature.
 */
export function createInitialAuthState() {
  return {
    email: '',
    password: '',
    error: '',
    isSubmitting: false,
  };
}
