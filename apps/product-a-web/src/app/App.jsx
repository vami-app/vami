import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from './providers';
import { ProtectedRoute } from '../shared/lib/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';

/**
 * App — root component. Composes Providers + Router + Routes.
 *
 * FSD routing convention:
 * - Public routes: accessible without auth (login)
 * - Protected routes: wrapped in <ProtectedRoute> — redirects to /login if unauthenticated
 * - Default: redirect / → /dashboard
 */
export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <main className="not-found-page" aria-label="Page not found">
                <h1>404 — Page not found</h1>
                <a href="/dashboard" className="btn btn--primary">Go to dashboard</a>
              </main>
            }
          />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
