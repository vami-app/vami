/**
 * UserAvatar — pure display component.
 * Shows the user's avatar image if available, or a colored circle
 * with their initials as a fallback. Zero network requests.
 *
 * @param {{ user: { email?: string, username?: string, avatarUrl?: string } | null, size?: 'sm'|'md'|'lg' }} props
 */
export function UserAvatar({ user, size = 'md' }) {
  const sizeMap = { sm: 32, md: 40, lg: 56 };
  const px = sizeMap[size] || 40;

  const initials = user
    ? (user.username || user.email || '?')
        .charAt(0)
        .toUpperCase()
    : '?';

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.username || user.email} avatar`}
        className="user-avatar user-avatar--image"
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className="user-avatar user-avatar--initials"
      style={{ width: px, height: px, fontSize: px * 0.4 }}
      aria-label={`Avatar for ${user?.username || user?.email || 'user'}`}
      role="img"
    >
      {initials}
    </div>
  );
}
