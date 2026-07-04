import { describe, expect, it } from 'vitest';

import { NoopAnalyticsAdapter } from './noop.adapter.js';

describe('NoopAnalyticsAdapter', () => {
    it('should perform no operation on any method', async () => {
        // Given — a noop adapter
        const analytics = new NoopAnalyticsAdapter();

        // When / Then — every method resolves without throwing
        await expect(analytics.track('user_signed_up')).resolves.toBeUndefined();
        await expect(
            analytics.track('user_signed_up', {
                profileId: 'user-1',
                properties: { plan: 'free' },
            }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.identify({ email: 'user@example.com', profileId: 'user-1' }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.increment('logins', { profileId: 'user-1' }),
        ).resolves.toBeUndefined();
        await expect(
            analytics.decrement('credits', { profileId: 'user-1', value: 2 }),
        ).resolves.toBeUndefined();
        expect(() => analytics.setGlobalProperties({ app: 'test' })).not.toThrow();
    });
});
