import { OpenPanel } from '@openpanel/sdk';
import { describe, expect, test, vi } from 'vitest';

import { OpenPanelAnalyticsAdapter } from './open-panel.adapter.js';

/**
 * Doubles the one collaborator the adapter is not handed: the SDK client it
 * constructs itself. The preset restores every spy after each test, so the
 * scope is taken inside the test that needs it, never once for the file.
 */
const spyOnClient = () => ({
    decrement: vi.spyOn(OpenPanel.prototype, 'decrement').mockResolvedValue(),
    identify: vi.spyOn(OpenPanel.prototype, 'identify').mockResolvedValue(),
    increment: vi.spyOn(OpenPanel.prototype, 'increment').mockResolvedValue(),
    setGlobalProperties: vi.spyOn(OpenPanel.prototype, 'setGlobalProperties').mockReturnValue(),
    track: vi.spyOn(OpenPanel.prototype, 'track').mockResolvedValue(),
});

describe('openPanelAnalyticsAdapter', () => {
    test('should apply global properties from the config', () => {
        // Given - an adapter created with global properties, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({
            clientId: 'client-id',
            globalProperties: { app: 'jterrazz-web' },
        });

        // Then - the properties are set on the client
        expect(analytics).toBeInstanceOf(OpenPanelAnalyticsAdapter);
        expect(client.setGlobalProperties).toHaveBeenCalledWith({ app: 'jterrazz-web' });
    });

    test('should track an event with profile and properties', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - tracking an event scoped to a profile
        await analytics.track('article_read', {
            profileId: 'user-1',
            properties: { slug: 'hello-world' },
        });

        // Then - properties and profileId are merged into the SDK payload
        expect(client.track).toHaveBeenCalledWith('article_read', {
            profileId: 'user-1',
            slug: 'hello-world',
        });
    });

    test('should track a page view as a screen_view event', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - tracking a page view
        await analytics.page(
            {
                referrer: 'https://google.com',
                title: 'Hello World',
                url: 'https://example.com/articles/hello?utm_source=x',
            },
            { profileId: 'user-1' },
        );

        // Then - the page maps to OpenPanel's reserved screen_view properties
        expect(client.track).toHaveBeenCalledWith('screen_view', {
            __path: 'https://example.com/articles/hello?utm_source=x',
            __referrer: 'https://google.com',
            __title: 'Hello World',
            profileId: 'user-1',
        });
    });

    test('should omit undefined page fields', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - tracking a page view with only a url
        await analytics.page({ url: 'https://example.com/' });

        // Then - no undefined __title/__referrer keys are sent
        expect(client.track).toHaveBeenCalledWith('screen_view', {
            __path: 'https://example.com/',
            profileId: undefined,
        });
    });

    test('should track revenue in EUR by default', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - tracking revenue without a currency
        await analytics.revenue(29.99, { profileId: 'user-1' });

        // Then - the reserved revenue event carries the amount and EUR
        expect(client.track).toHaveBeenCalledWith('revenue', {
            __revenue: 29.99,
            currency: 'EUR',
            profileId: 'user-1',
        });
    });

    test('should track revenue with an explicit currency and properties', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - tracking revenue in USD with extra properties
        await analytics.revenue(100, {
            currency: 'USD',
            properties: { product: 'pro-plan' },
        });

        // Then - currency and properties are forwarded
        expect(client.track).toHaveBeenCalledWith('revenue', {
            __revenue: 100,
            currency: 'USD',
            product: 'pro-plan',
            profileId: undefined,
        });
    });

    test('should identify a profile and flatten codified traits into properties', async () => {
        // Given - an adapter and a profile using codified Segment-style traits, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - identifying the profile
        await analytics.identify({
            createdAt: new Date('2026-01-15T10:00:00.000Z'),
            email: 'user@example.com',
            firstName: 'Jean',
            plan: 'pro',
            profileId: 'user-1',
            properties: { referral: 'friend' },
            username: 'jean',
        });

        // Then - native OpenPanel fields stay top-level, other traits join properties
        expect(client.identify).toHaveBeenCalledWith({
            avatar: undefined,
            email: 'user@example.com',
            firstName: 'Jean',
            lastName: undefined,
            profileId: 'user-1',
            properties: {
                createdAt: '2026-01-15T10:00:00.000Z',
                plan: 'pro',
                referral: 'friend',
                username: 'jean',
            },
        });
    });

    test('should increment and decrement profile counters', async () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - incrementing and decrementing counters
        await analytics.increment('logins', { profileId: 'user-1' });
        await analytics.decrement('credits', { profileId: 'user-1', value: 2 });

        // Then - payloads follow the SDK shape
        expect(client.increment).toHaveBeenCalledWith({
            profileId: 'user-1',
            property: 'logins',
            value: undefined,
        });
        expect(client.decrement).toHaveBeenCalledWith({
            profileId: 'user-1',
            property: 'credits',
            value: 2,
        });
    });

    test('should create an independent child scope', () => {
        // Given - an adapter
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - creating a request-scoped child
        const child = analytics.child({ ip: '1.2.3.4', userAgent: 'Mozilla/5.0' });

        // Then - the child is a separate adapter instance
        expect(child).toBeInstanceOf(OpenPanelAnalyticsAdapter);
        expect(child).not.toBe(analytics);
    });

    test('should forward global properties set after construction', () => {
        // Given - an adapter, on a doubled SDK client
        const client = spyOnClient();
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When - setting global properties
        analytics.setGlobalProperties({ version: '1.0.0' });

        // Then - they are forwarded to the client
        expect(client.setGlobalProperties).toHaveBeenCalledWith({ version: '1.0.0' });
    });
});
