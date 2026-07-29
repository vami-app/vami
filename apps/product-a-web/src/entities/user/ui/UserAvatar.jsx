import { Avatar } from "@vami/ui";

/**
 * UserAvatar — pure display component.
 * Shows the user's avatar image if available, or a colored circle
 * with their initials as a fallback. Zero network requests.
 *
 * @param {{ user: { email?: string, username?: string, avatarUrl?: string } | null, size?: 'sm'|'md'|'lg' }} props
 */
export function UserAvatar({ user, size = "md" }) {
  const sizeMap = { sm: 32, md: 40, lg: 56 };
  const px = sizeMap[size] || 40;

  const initials = user
    ? (user.username || user.email || "?").charAt(0).toUpperCase()
    : "?";

  return (
    <Avatar.Root
      className="user-avatar"
      style={{ width: px, height: px, fontSize: px * 0.4 }}
      borderRadius="10%"
      aria-label={`Avatar for ${user?.username || user?.email || "user"}`}
      role="img"
    >
      <Avatar.Image
        src={user?.avatarUrl}
        alt={`${user?.username || user?.email} avatar`}
      />
      <Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
    </Avatar.Root>
  );
}
