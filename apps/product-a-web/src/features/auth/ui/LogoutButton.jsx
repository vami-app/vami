import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../entities/user';
import { logout } from '../api/authApi';

/**
 * LogoutButton — triggers session revocation and clears AuthContext.
 * Redirects to /login on success.
 */
export function LogoutButton() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await logout();
    } catch {
      // Swallow errors — clear local state regardless of server response
      // This prevents the user from being "stuck" logged in if the server is down
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  }

  return (
    <button
      id="logout-btn"
      className="btn btn--ghost btn--sm"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Sign out"
    >
      {isLoading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
