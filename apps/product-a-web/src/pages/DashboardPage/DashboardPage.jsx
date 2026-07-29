import { useAuth } from '../../entities/user';
import { AppHeader } from '../../widgets/AppHeader';
import { UserProfileCard } from '../../widgets/UserProfileCard';
import { Link } from 'react-router-dom';

/**
 * DashboardPage — protected landing page after login.
 * Shows a welcome summary and links to key actions.
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-layout">
      <AppHeader />
      <main className="page-content" aria-label="Dashboard">
        <div className="dashboard-welcome">
          <h1 className="page-title">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="page-subtitle">Here's what's happening with your account.</p>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card" aria-label="Your profile">
            <h2 className="dashboard-card__title">Your Profile</h2>
            <div className="dashboard-card__profile-preview">
              <UserProfileCard
                profile={{
                  displayName: user?.username || user?.email,
                  avatarUrl: null,
                }}
              />
            </div>
            <Link to="/profile" className="btn btn--secondary btn--sm" id="go-to-profile-btn">
              Manage profile →
            </Link>
          </section>

          <section className="dashboard-card" aria-label="Quick actions">
            <h2 className="dashboard-card__title">Quick Actions</h2>
            <ul className="dashboard-actions">
              <li><Link to="/profile" className="action-link">Edit your profile</Link></li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
