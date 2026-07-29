import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../entities/user';
import { login } from '../api/authApi';

/**
 * LoginForm — handles the login user workflow.
 *
 * Responsibilities:
 * - Render email + password fields
 * - Call the auth API
 * - Update AuthContext on success → triggers session restore across the app
 * - Show field-level and server-level error messages
 *
 * Zero business logic — calls authApi.login() and reacts to the result.
 */
export function LoginForm() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** @param {any} e */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login({ email: email.trim(), password });
      setUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorObj = /** @type {any} */ (err);
      const status = errorObj?.status;
      if (status === 401) setError('Invalid email or password.');
      else if (status === 429) setError('Too many attempts. Please wait 15 minutes.');
      else if (status === 503) setError('Service temporarily unavailable. Please try again shortly.');
      else setError(errorObj?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="login-email" className="form-label">Email</label>
        <input
          id="login-email"
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-password" className="form-label">Password</label>
        <input
          id="login-password"
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <div className="form-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <button
        type="submit"
        id="login-submit"
        className="btn btn--primary btn--full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
