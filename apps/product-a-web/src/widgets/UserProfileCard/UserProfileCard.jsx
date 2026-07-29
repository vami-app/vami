import { UserAvatar } from '../../entities/user';

/**
 * UserProfileCard — displays a user's profile summary.
 * Used on both the Dashboard (compact) and Profile page (expanded).
 *
 * @param {{ profile: any, onEditClick?: () => void }} props
 */
export function UserProfileCard({ profile, onEditClick }) {
  if (!profile) return null;

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <article className="profile-card" aria-label="User profile">
      <div className="profile-card__avatar">
        <UserAvatar user={{ username: profile.displayName, avatarUrl: profile.avatarUrl }} size="lg" />
      </div>

      <div className="profile-card__info">
        <h2 className="profile-card__name">{profile.displayName || 'No display name set'}</h2>

        {profile.bio && (
          <p className="profile-card__bio">{profile.bio}</p>
        )}

        {joined && (
          <p className="profile-card__joined">
            <span className="profile-card__label">Member since</span>
            {joined}
          </p>
        )}
      </div>

      {onEditClick && (
        <button
          id="profile-card-edit-btn"
          className="btn btn--secondary btn--sm"
          onClick={onEditClick}
          aria-label="Edit your profile"
        >
          Edit profile
        </button>
      )}
    </article>
  );
}
