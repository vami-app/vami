// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateProfileForm } from '../features/update-profile';

// Mock profileApi
vi.mock('../features/update-profile/api/profileApi', () => ({
  updateProfile: vi.fn(),
  getProfile: vi.fn(),
}));

const mockProfile = {
  displayName: 'Alice',
  bio: 'Engineer at Vami.',
  avatarUrl: '',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('UpdateProfileForm — proof-of-architecture vertical', () => {
  it('renders form fields pre-populated with current profile data', () => {
    render(<UpdateProfileForm profile={mockProfile} onSaved={vi.fn()} />);

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Engineer at Vami.')).toBeInTheDocument();
  });

  it('calls updateProfile only with changed fields (diff-patch)', async () => {
    const { updateProfile } = await import('../features/update-profile/api/profileApi');
    const updatedProfile = { ...mockProfile, displayName: 'Alice Smith' };
    vi.mocked(updateProfile).mockResolvedValueOnce({ success: true, profile: updatedProfile });

    const onSaved = vi.fn();
    render(<UpdateProfileForm profile={mockProfile} onSaved={onSaved} />);

    // Change only displayName
    const nameInput = screen.getByDisplayValue('Alice');
    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      // Only changed field should be sent — NOT bio or avatarUrl
      expect(updateProfile).toHaveBeenCalledWith({ displayName: 'Alice Smith' });
      expect(onSaved).toHaveBeenCalledWith(updatedProfile);
    });
  });

  it('shows success message after successful save', async () => {
    const { updateProfile } = await import('../features/update-profile/api/profileApi');
    const updatedProfile = { ...mockProfile, bio: 'Updated bio.' };
    vi.mocked(updateProfile).mockResolvedValueOnce({ success: true, profile: updatedProfile });

    render(<UpdateProfileForm profile={mockProfile} onSaved={vi.fn()} />);

    const bioInput = screen.getByDisplayValue('Engineer at Vami.');
    fireEvent.change(bioInput, { target: { value: 'Updated bio.' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/saved successfully/i);
    });
  });

  it('shows 403 forbidden error correctly', async () => {
    const { updateProfile } = await import('../features/update-profile/api/profileApi');
    vi.mocked(updateProfile).mockRejectedValueOnce({ status: 403, message: 'Forbidden' });

    render(<UpdateProfileForm profile={mockProfile} onSaved={vi.fn()} />);

    const nameInput = screen.getByDisplayValue('Alice');
    fireEvent.change(nameInput, { target: { value: 'Hacker' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/do not have permission/i);
    });
  });

  it('shows nothing changed when no fields are changed (no API call)', async () => {
    const { updateProfile } = await import('../features/update-profile/api/profileApi');
    vi.mocked(updateProfile).mockClear();

    render(<UpdateProfileForm profile={mockProfile} onSaved={vi.fn()} />);

    // Submit without changing anything
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfile).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent(/saved successfully/i);
    });
  });
});
