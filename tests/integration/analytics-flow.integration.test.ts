import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type AnalyticsEvents,
    type AnalyticsPort,
    NoopAnalyticsAdapter,
    OpenPanelAnalyticsAdapter,
} from '../../src/index.js';

const API_URL = 'https://analytics.example.com/api';

/**
 * Compile-time tracking plan — mirrors how apps declare their event catalogue.
 */
interface TestEvents extends AnalyticsEvents {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
    user_signed_up: { plan: string };
}

describe('analytics flow integration', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({})));
        globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    const requests = () =>
        fetchMock.mock.calls.map(([url, init]) => ({
            body: JSON.parse(String((init as RequestInit).body)) as Record<string, unknown>,
            headers: (init as RequestInit).headers as Record<string, string>,
            url: String(url),
        }));

    const createAdapter = () =>
        new OpenPanelAnalyticsAdapter<TestEvents>({
            apiUrl: API_URL,
            clientId: 'client-id',
            clientSecret: 'client-secret',
            globalProperties: { app: 'integration-test' },
        });

    it('should send authenticated track events to the self-hosted /track endpoint', async () => {
        // Given — an adapter pointed at a self-hosted ingest endpoint
        const analytics = createAdapter();

        // When — tracking a typed event
        await analytics.track('app_link_opened', {
            profileId: 'user-1',
            properties: { platform: 'ios', slug: 'my-app' },
        });

        // Then — one request hits the instance's /track endpoint
        const [request] = requests();
        expect(request.url).toBe(`${API_URL}/track`);

        // Then — the request authenticates with the configured client credentials
        expect(request.headers).toMatchObject({
            'openpanel-client-id': 'client-id',
            'openpanel-client-secret': 'client-secret',
        });

        // Then — the payload carries the event, profile and global properties
        expect(request.body).toMatchObject({
            payload: {
                name: 'app_link_opened',
                profileId: 'user-1',
                properties: { app: 'integration-test', platform: 'ios', slug: 'my-app' },
            },
            type: 'track',
        });
    });

    it('should forward the end user ip and user-agent through a child scope', async () => {
        // Given — a request-scoped child, as built by a server composition root
        const analytics = createAdapter();
        const requestAnalytics = analytics.child({
            ip: '203.0.113.7',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        });

        // When — tracking through the child
        await requestAnalytics.track('app_link_opened', {
            properties: { platform: 'ios', slug: 'my-app' },
        });

        // Then — the ingest request carries the headers OpenPanel uses to
        // Derive geolocation (ip) and device/browser/os (user-agent)
        const [request] = requests();
        expect(request.headers).toMatchObject({
            'openpanel-client-ip': '203.0.113.7',
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        });

        // Then — global properties are inherited from the parent
        expect(request.body).toMatchObject({
            payload: { properties: { app: 'integration-test' } },
        });
    });

    it('should keep the parent scope free of child context', async () => {
        // Given — a parent adapter with a derived child scope
        const analytics = createAdapter();
        analytics.child({ ip: '203.0.113.7', userAgent: 'Mozilla/5.0' });

        // When — tracking through the parent AFTER the child was created
        await analytics.track('user_signed_up', { properties: { plan: 'free' } });

        // Then — the parent request carries no request-context headers
        const [request] = requests();
        expect(request.headers['openpanel-client-ip']).toBeUndefined();
        expect(request.headers['user-agent']).toBeUndefined();
    });

    it('should attach the child profileId and deviceId to events', async () => {
        // Given — a child scope bound to an identified user and web device
        const analytics = createAdapter();
        const requestAnalytics = analytics.child({
            deviceId: 'web-device-id',
            locale: 'fr-FR',
            profileId: 'user-42',
        });

        // When — tracking without an explicit profileId
        await requestAnalytics.track('user_signed_up', { properties: { plan: 'pro' } });

        // Then — the event inherits the scope's profile and device identity
        const [request] = requests();
        expect(request.body).toMatchObject({
            payload: {
                name: 'user_signed_up',
                profileId: 'user-42',
                properties: {
                    __deviceId: 'web-device-id',
                    locale: 'fr-FR',
                    plan: 'pro',
                },
            },
            type: 'track',
        });
    });

    it('should send page views as screen_view with reserved properties', async () => {
        // Given — an adapter
        const analytics = createAdapter();

        // When — tracking a page view with full url, title and referrer
        await analytics.page({
            referrer: 'https://news.ycombinator.com/',
            title: 'Hello World — jterrazz',
            url: 'https://jterrazz.com/articles/hello?utm_source=hn',
        });

        // Then — OpenPanel receives its reserved screen_view shape, from
        // Which it derives path, query and UTM attribution server-side
        const [request] = requests();
        expect(request.body).toMatchObject({
            payload: {
                name: 'screen_view',
                properties: {
                    __path: 'https://jterrazz.com/articles/hello?utm_source=hn',
                    __referrer: 'https://news.ycombinator.com/',
                    __title: 'Hello World — jterrazz',
                },
            },
            type: 'track',
        });
    });

    it('should send revenue events with the default EUR currency', async () => {
        // Given — an adapter
        const analytics = createAdapter();

        // When — tracking revenue without an explicit currency
        await analytics.revenue(49.9, { profileId: 'user-1' });

        // Then — the reserved revenue event carries amount and currency
        const [request] = requests();
        expect(request.body).toMatchObject({
            payload: {
                name: 'revenue',
                profileId: 'user-1',
                properties: { __revenue: 49.9, currency: 'EUR' },
            },
            type: 'track',
        });
    });

    it('should send identify payloads with codified traits in properties', async () => {
        // Given — an adapter and a profile with Segment-style traits
        const analytics = createAdapter();

        // When — identifying the user
        await analytics.identify({
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            email: 'user@example.com',
            firstName: 'Jean',
            lastName: 'Terrazzoni',
            plan: 'pro',
            profileId: 'user-1',
        });

        // Then — native fields are top-level, codified traits are properties
        const [request] = requests();
        expect(request.body).toMatchObject({
            payload: {
                email: 'user@example.com',
                firstName: 'Jean',
                lastName: 'Terrazzoni',
                profileId: 'user-1',
                properties: {
                    createdAt: '2026-02-01T00:00:00.000Z',
                    plan: 'pro',
                },
            },
            type: 'identify',
        });
    });

    it('should send profile counters through the full flow', async () => {
        // Given — an adapter
        const analytics = createAdapter();

        // When — incrementing then decrementing counters
        await analytics.increment('logins', { profileId: 'user-1' });
        await analytics.decrement('credits', { profileId: 'user-1', value: 2 });

        // Then — both payloads reach the instance with the expected types
        const payloads = requests().map((request) => request.body);
        expect(payloads[0]).toMatchObject({
            payload: { profileId: 'user-1', property: 'logins' },
            type: 'increment',
        });
        expect(payloads[1]).toMatchObject({
            payload: { profileId: 'user-1', property: 'credits', value: 2 },
            type: 'decrement',
        });
    });

    it('should send nothing when using the noop adapter', async () => {
        // Given — a noop adapter satisfying the same typed port
        const analytics: AnalyticsPort<TestEvents> = new NoopAnalyticsAdapter<TestEvents>();

        // When — using the full port surface, including a child scope
        analytics.setGlobalProperties({ app: 'integration-test' });
        const requestAnalytics = analytics.child({ ip: '1.2.3.4' });
        await requestAnalytics.track('app_link_opened', {
            properties: { platform: 'ios', slug: 'my-app' },
        });
        await analytics.page({ url: 'https://example.com/' });
        await analytics.revenue(10);
        await analytics.identify({ profileId: 'user-1' });
        await analytics.increment('logins', { profileId: 'user-1' });
        await analytics.decrement('credits', { profileId: 'user-1' });

        // Then — no HTTP request is made
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
