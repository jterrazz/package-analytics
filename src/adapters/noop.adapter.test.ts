import { describe, expect, test } from 'vitest';

import { NoopAnalyticsAdapter } from './noop.adapter.js';

describe('noopAnalyticsAdapter', () => {
    test('should resolve every event method without throwing', async () => {
        // Given — a noop adapter
        const analytics = new NoopAnalyticsAdapter();

        // When / Then — every event method resolves
        await expect(analytics.track('user_signed_up')).resolves.toBeUndefined();
        await expect(
            analytics.track('user_signed_up', {
                profileId: 'user-1',
                properties: { plan: 'free' },
            }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.page({ title: 'Home', url: 'https://example.com/' }),
        ).resolves.toBeUndefined();
        await expect(analytics.revenue(10, { currency: 'EUR' })).resolves.toBeUndefined();
    });

    test('should resolve every profile method without throwing', async () => {
        // Given — a noop adapter
        const analytics = new NoopAnalyticsAdapter();

        // When / Then — every profile method resolves
        await expect(
            analytics.identify({ email: 'user@example.com', profileId: 'user-1' }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.increment('logins', { profileId: 'user-1' }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.decrement('credits', { profileId: 'user-1', value: 2 }),
        ).resolves.toBeUndefined();
        expect(() => {
            analytics.setGlobalProperties({ app: 'test' });
        }).not.toThrow();
    });

    test('should return itself as child scope', () => {
        // Given — a noop adapter
        const analytics = new NoopAnalyticsAdapter();

        // When — creating a request-scoped child
        const child = analytics.child({ ip: '1.2.3.4', userAgent: 'Mozilla/5.0' });

        // Then — the same instance is returned
        expect(child).toBe(analytics);
    });
});
