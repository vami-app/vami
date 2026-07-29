import { useAuth, UserAvatar } from '../../entities/user';
import { LogoutButton } from '../../features/auth';
import { env } from '../../shared/config/env';

/**
 * AppHeader — top navigation bar.
 * Self-contained widget: reads auth state, renders nav, provides logout action.
 * No props needed — reads directly from AuthContext.
 */
export function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="app-header" role="banner">
      <div className="app-header__inner">
        <a href="/dashboard" className="app-header__brand" aria-label={`${env.appName} home`}>
          <span className="app-header__logo">⬡</span>
          <span className="app-header__name">{env.appName}</span>
        </a>

        <nav className="app-header__nav" aria-label="Main navigation">
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/profile" className="nav-link">Profile</a>
        </nav>

        <div className="app-header__user">
          {user && (
            <>
              <UserAvatar user={user} size="sm" />
              <span className="app-header__username">{user.username || user.email}</span>
            </>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
