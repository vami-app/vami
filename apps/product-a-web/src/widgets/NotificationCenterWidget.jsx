import React, { useState, useEffect } from 'react';
import { Card, Heading, Text, Badge, Button, Stack } from '@vami/ui';

/**
 * @typedef {Object} InAppNotificationItem
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {boolean} read
 */

/**
 * Platform Notification Center Widget.
 * Fetches user in-app notifications from notification-service REST API.
 */
export function NotificationCenterWidget() {
  const [notifications, setNotifications] = useState(/** @type {InAppNotificationItem[]} */ ([]));
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/notifications/in-app?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.totalUnread || 0);
      }
    } catch {
      // Graceful fallback for offline / mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const sendTestNotification = async () => {
    try {
      await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: 'user_demo',
          channel: 'in-app',
          category: 'system',
          title: 'System Alert {{ timestamp }}',
          message: 'Welcome to Product A. Your session is active.',
          variables: { timestamp: new Date().toLocaleTimeString() },
        }),
      });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (/** @type {string} */ id) => {
    try {
      await fetch(`/api/v1/notifications/in-app/${id}/read?userId=user_demo`, {
        method: 'PATCH',
      });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card elevation="sm" padding="20px">
      <Stack gap="16px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heading level={3}>Notifications</Heading>
            <Badge variant={unreadCount > 0 ? 'brand' : 'subtle'}>{unreadCount} unread</Badge>
          </div>
          <Button variant="subdued" onClick={sendTestNotification}>
            + Trigger Test Alert
          </Button>
        </div>

        {loading ? (
          <Text size="sm" color="var(--vami-color-text-subtle)">Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <Text size="sm" color="var(--vami-color-text-subtle)">No notifications found. Trigger one above!</Text>
        ) : (
          <Stack gap="8px">
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: item.read ? 'transparent' : 'var(--vami-color-background-subdued)',
                  border: '1px solid var(--vami-color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Text weight="semibold" size="sm">{item.title}</Text>
                  <Text size="xs" color="var(--vami-color-text-secondary)">{item.message}</Text>
                </div>
                {!item.read && (
                  <Button variant="subdued" onClick={() => markAsRead(item.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
