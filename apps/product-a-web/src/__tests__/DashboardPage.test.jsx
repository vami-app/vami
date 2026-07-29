// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock /me as unauthenticated — ProtectedRoute must redirect to /login
vi.mock('@vami/api-client', () => ({
  apiClient: vi.fn().mockRejectedValue({ status: 401 }),
}));

// Lazy import so mock is applied before module loads
async function renderDashboardWithAuth() {
  const { AuthProvider } = await import('../entities/user');
  const { ProtectedRoute } = await import('../shared/lib/ProtectedRoute');
  const { DashboardPage } = await import('../pages/DashboardPage');

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('DashboardPage — ProtectedRoute redirect', () => {
  it('redirects unauthenticated users to /login', async () => {
    await renderDashboardWithAuth();

    await waitFor(() => {
      // Must land on the login page stub, not the dashboard
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});
