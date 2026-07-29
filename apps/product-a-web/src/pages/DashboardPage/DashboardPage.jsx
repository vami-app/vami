import { useAuth } from '../../entities/user';
import { AppHeader } from '../../widgets/AppHeader';
import { UserProfileCard } from '../../widgets/UserProfileCard';
import { NotificationCenterWidget } from '../../widgets/NotificationCenterWidget';
import { MediaUploadWidget } from '../../widgets/MediaUploadWidget';
import { AppShell, Grid, Card, Heading, Text, Stack } from '@vami/ui';
import { Link } from 'react-router-dom';

/**
 * DashboardPage — protected landing page after login.
 * Composes responsive atomic layout, Notification Center, and Media Upload Platform services.
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell title="Product A — Platform Dashboard" userMenu={<AppHeader />}>
      <Stack gap="24px">
        <div>
          <Heading level={1}>
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </Heading>
          <Text size="md" color="var(--vami-color-text-secondary)">
            Here's what's happening across your platform services.
          </Text>
        </div>

        <Grid cols={{ xs: 1, md: 2 }} gap="24px">
          {/* User Profile Card */}
          <Card elevation="sm" padding="20px">
            <Stack gap="16px">
              <Heading level={3}>Your Profile</Heading>
              <UserProfileCard
                profile={{
                  displayName: user?.username || user?.email,
                  avatarUrl: null,
                }}
              />
              <Link to="/profile" className="btn btn--secondary btn--sm" id="go-to-profile-btn" style={{ width: 'fit-content' }}>
                Manage Profile →
              </Link>
            </Stack>
          </Card>

          {/* Platform Notification Center */}
          <NotificationCenterWidget />
        </Grid>

        {/* Platform Direct-to-Storage Media Manager */}
        <MediaUploadWidget />
      </Stack>
    </AppShell>
  );
}

