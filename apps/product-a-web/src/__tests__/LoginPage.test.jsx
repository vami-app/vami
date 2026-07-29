// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../entities/user';

// Mock the authApi module
vi.mock('../features/auth/api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the /api/v1/bff/auth/me call (AuthProvider uses this on mount)
vi.mock('@vami/api-client', () => ({
  apiClient: vi.fn().mockRejectedValue({ status: 401 }),  // unauthenticated by default
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders login form with email and password fields', async () => {
    renderLoginPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows validation error when form submitted empty', async () => {
    renderLoginPage();
    await waitFor(() => screen.getByRole('button', { name: /sign in/i }));
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email and password are required/i);
    });
  });

  it('shows invalid credentials error on 401', async () => {
    const { login } = await import('../features/auth/api/authApi');
    vi.mocked(login).mockRejectedValueOnce({ status: 401 });

    renderLoginPage();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i);
    });
  });

  it('shows rate limit error on 429', async () => {
    const { login } = await import('../features/auth/api/authApi');
    vi.mocked(login).mockRejectedValueOnce({ status: 429 });

    renderLoginPage();
    await waitFor(() => screen.getByLabelText(/email/i));

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i);
    });
  });
});
