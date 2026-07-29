import { useState, useEffect } from 'react';
import { AppHeader } from '../../widgets/AppHeader';
import { UserProfileCard } from '../../widgets/UserProfileCard';
import { UpdateProfileForm } from '../../features/update-profile';
import { getProfile } from '../../features/update-profile';

/**
 * ProfilePage — full profile management page.
 * Fetches profile data, shows the card, and toggles the edit form.
 * This page exercises the full proof-of-architecture vertical:
 *   ProfilePage → UpdateProfileForm → profileApi → BFF → ProfileService → ProfileRepository
 */
export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data.profile))
      .catch((err) => setError(err?.message || 'Failed to load profile.'))
      .finally(() => setIsLoading(false));
  }, []);

  /** @param {any} updatedProfile */
  function handleSaved(updatedProfile) {
    setProfile(updatedProfile);
    setIsEditing(false);
  }

  return (
    <div className="page-layout">
      <AppHeader />
      <main className="page-content" aria-label="Your profile">
        <h1 className="page-title">Your Profile</h1>

        {isLoading && (
          <div className="loading-screen" aria-label="Loading profile">
            <div className="loading-spinner" />
          </div>
        )}

        {error && !isLoading && (
          <div className="form-error" role="alert">{error}</div>
        )}

        {!isLoading && !error && profile && (
          <div className="profile-page__content">
            {!isEditing ? (
              <UserProfileCard
                profile={profile}
                onEditClick={() => setIsEditing(true)}
              />
            ) : (
              <section className="profile-edit-section" aria-label="Edit profile">
                <div className="profile-edit-section__header">
                  <h2 className="section-title">Edit Profile</h2>
                  <button
                    id="profile-cancel-edit-btn"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setIsEditing(false)}
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                </div>
                <UpdateProfileForm profile={profile} onSaved={handleSaved} />
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
