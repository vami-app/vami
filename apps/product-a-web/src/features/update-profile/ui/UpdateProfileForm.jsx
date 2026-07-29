import { useState } from 'react';
import { updateProfile } from '../api/profileApi';

/**
 * UpdateProfileForm — full profile edit vertical feature.
 *
 * This is the proof-of-architecture component: it exercises
 * every layer from FSD shared → entities → features → BFF → identity-service.
 *
 * @param {{ profile: any, onSaved: (profile: any) => void }} props
 */
export function UpdateProfileForm({ profile, onSaved }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /** @param {any} e */
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Only send changed fields — do not mass-assign
    const patch = {};
    if (displayName.trim() !== (profile?.displayName || '')) patch.displayName = displayName.trim();
    if (bio.trim() !== (profile?.bio || '')) patch.bio = bio.trim();
    if (avatarUrl.trim() !== (profile?.avatarUrl || '')) patch.avatarUrl = avatarUrl.trim();

    if (Object.keys(patch).length === 0) {
      setSuccess(true);
      return;
    }

    setIsSaving(true);
    try {
      const data = await updateProfile(patch);
      onSaved(data.profile);
      setSuccess(true);
    } catch (err) {
      const errorObj = /** @type {any} */ (err);
      if (errorObj?.status === 401) setError('Your session has expired. Please log in again.');
      else if (errorObj?.status === 403) setError('You do not have permission to edit this profile.');
      else setError(errorObj?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      id="update-profile-form"
      className="profile-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Edit profile"
    >
      <div className="form-field">
        <label htmlFor="profile-display-name" className="form-label">
          Display name
          <span className="form-hint">Up to 100 characters</span>
        </label>
        <input
          id="profile-display-name"
          type="text"
          className="form-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={100}
          disabled={isSaving}
          placeholder="Your display name"
        />
      </div>

      <div className="form-field">
        <label htmlFor="profile-bio" className="form-label">
          Bio
          <span className="form-hint">Up to 500 characters</span>
        </label>
        <textarea
          id="profile-bio"
          className="form-input form-textarea"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          disabled={isSaving}
          placeholder="Tell us a little about yourself…"
        />
      </div>

      <div className="form-field">
        <label htmlFor="profile-avatar-url" className="form-label">Avatar URL</label>
        <input
          id="profile-avatar-url"
          type="url"
          className="form-input"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          maxLength={2048}
          disabled={isSaving}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      {error && (
        <div className="form-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {success && (
        <div className="form-success" role="status" aria-live="polite">
          Profile saved successfully.
        </div>
      )}

      <button
        id="profile-save-btn"
        type="submit"
        className="btn btn--primary"
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
