import { describe, it, expect } from 'vitest';
const { shouldDeliver } = require('../domain/preference-engine');
const { renderTemplate } = require('../domain/template-engine');
const { IdempotencyService } = require('../infra/idempotency');
const { InAppNotificationStore } = require('../store/in-app-store');

describe('notification-service — Unit Tests', () => {
  it('preference engine allows transactional alerts regardless of opt-outs', () => {
    const result = shouldDeliver({
      channel: 'email',
      category: 'transactional',
      userPreferences: { email_enabled: false },
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain('Transactional category bypasses');
  });

  it('preference engine respects user opt-outs for marketing notifications', () => {
    const result = shouldDeliver({
      channel: 'email',
      category: 'marketing',
      userPreferences: { email_enabled: false },
    });
    expect(result.allowed).toBe(false);
  });

  it('template engine renders variables safely with HTML sanitization', () => {
    const rendered = renderTemplate('Hello {{ user.name }}, welcome to {{ app }}!', {
      user: { name: '<script>alert(1)</script>Alex' },
      app: 'Vami',
    });
    expect(rendered).toContain('&lt;script&gt;');
    expect(rendered).toContain('Alex');
    expect(rendered).toContain('Vami');
  });

  it('idempotency service prevents duplicate execution', async () => {
    const service = new IdempotencyService();
    const lock1 = await service.acquireLock('key_123', 1000);
    const lock2 = await service.acquireLock('key_123', 1000);

    expect(lock1).toBe(true);
    expect(lock2).toBe(false);
  });

  it('in-app notification store handles creation and keyset pagination', async () => {
    const store = new InAppNotificationStore();
    await store.create({ userId: 'u1', title: 'Welcome', message: 'Hello 1', category: 'system' });
    await store.create({ userId: 'u1', title: 'Update', message: 'Hello 2', category: 'system' });

    const page1 = await store.listForUser('u1', { limit: 1 });
    expect(page1.items.length).toBe(1);
    expect(page1.totalUnread).toBe(2);
    expect(page1.nextCursor).toBeDefined();

    const markResult = await store.markRead(page1.items[0].id, 'u1');
    expect(markResult.read).toBe(true);
  });
});
