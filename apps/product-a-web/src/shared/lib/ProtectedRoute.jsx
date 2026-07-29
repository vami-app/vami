import { useAuth } from '../../entities/user';
import { Navigate } from 'react-router-dom';

/**
 * Route guard that redirects unauthenticated users to /login.
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 *
 * @param {{ children: React.ReactNode }} props
 */
export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen" aria-label="Loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
