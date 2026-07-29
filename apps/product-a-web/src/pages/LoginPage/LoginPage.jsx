import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../entities/user';
import { LoginForm } from '../../features/auth';

/**
 * LoginPage — route-level composition for /login.
 * Thin page: redirects to /dashboard if already authenticated,
 * otherwise renders the LoginForm feature component.
 */
export function LoginPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <main className="auth-page" aria-label="Sign in">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__logo">⬡</span>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to your Vami account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
