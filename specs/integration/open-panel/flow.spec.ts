import { defineContract, http } from '@jterrazz/test';
import { expect, test } from 'vitest';

import { NoopAnalyticsAdapter, OpenPanelAnalyticsAdapter } from '../../../src/index.js';
import type { AnalyticsEvents, AnalyticsPort } from '../../../src/index.js';
import { integration } from '../integration.specification.js';

const API_URL = 'https://analytics.example.com/api';
const TRACK_URL = `${API_URL}/track`;

/**
 * Compile-time tracking plan — mirrors how apps declare their event catalogue.
 */
type TestEvents = AnalyticsEvents & {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
    user_signed_up: { plan: string };
};

const createAdapter = () =>
    new OpenPanelAnalyticsAdapter<TestEvents>({
        apiUrl: API_URL,
        clientId: 'client-id',
        clientSecret: 'client-secret',
        globalProperties: { app: 'integration-test' },
    });

test('sends authenticated track events to the self-hosted /track endpoint', async () => {
    // Given - a self-hosted instance that accepts an authenticated, typed event
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                body: {
                    payload: {
                        name: 'app_link_opened',
                        profileId: 'user-1',
                        properties: { app: 'integration-test', platform: 'ios', slug: 'my-app' },
                    },
                    type: 'track',
                },
                headers: {
                    'openpanel-client-id': 'client-id',
                    'openpanel-client-secret': 'client-secret',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            await createAdapter().track('app_link_opened', {
                profileId: 'user-1',
                properties: { platform: 'ios', slug: 'my-app' },
            });
        });

    // Then - the request matched the declared contract; nothing else was reached
    await expect(result.error).toBeEmpty();
});

test('forwards the end user ip and user-agent through a child scope', async () => {
    // Given - a request-scoped child, as built by a server composition root
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                headers: {
                    'openpanel-client-ip': '203.0.113.7',
                    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            const requestAnalytics = createAdapter().child({
                ip: '203.0.113.7',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            });

            // Derive geolocation (ip) and device/browser/os (user-agent)
            await requestAnalytics.track('app_link_opened', {
                properties: { platform: 'ios', slug: 'my-app' },
            });
        });

    // Then - the ingest request carried the headers OpenPanel derives geolocation and device from
    await expect(result.error).toBeEmpty();
});

test("keeps the parent scope free of a child's context", async () => {
    // Given - a parent adapter with a derived child scope, never used for this call
    let observedHeaders: Record<string, string> | undefined;

    const result = await integration
        .intercept(http.post(TRACK_URL), (request) => {
            observedHeaders = request.headers;

            return http.json({});
        })
        .call(async () => {
            const analytics = createAdapter();
            analytics.child({ ip: '203.0.113.7', userAgent: 'Mozilla/5.0' });

            // Tracking through the parent AFTER the child was created
            await analytics.track('user_signed_up', { properties: { plan: 'free' } });
        });

    // Then - the parent request carries none of the child's request-context headers
    await expect(result.error).toBeEmpty();
    expect(observedHeaders?.['openpanel-client-ip']).toBeUndefined();
    expect(observedHeaders?.['user-agent']).toBeUndefined();
});

test('attaches the child profileId and deviceId to events', async () => {
    // Given - a child scope bound to an identified user and web device
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                body: {
                    payload: {
                        name: 'user_signed_up',
                        profileId: 'user-42',
                        properties: { __deviceId: 'web-device-id', locale: 'fr-FR', plan: 'pro' },
                    },
                    type: 'track',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            const requestAnalytics = createAdapter().child({
                deviceId: 'web-device-id',
                locale: 'fr-FR',
                profileId: 'user-42',
            });

            // Tracking without an explicit profileId inherits the scope's identity
            await requestAnalytics.track('user_signed_up', { properties: { plan: 'pro' } });
        });

    // Then - the event carried the scope's profile and device identity
    await expect(result.error).toBeEmpty();
});

test('sends page views as screen_view with reserved properties', async () => {
    // Given - a full url, title and referrer
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                body: {
                    payload: {
                        name: 'screen_view',
                        properties: {
                            __path: 'https://jterrazz.com/articles/hello?utm_source=hn',
                            __referrer: 'https://news.ycombinator.com/',
                            __title: 'Hello World — jterrazz',
                        },
                    },
                    type: 'track',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            // OpenPanel derives path, query and UTM attribution server-side from this shape
            await createAdapter().page({
                referrer: 'https://news.ycombinator.com/',
                title: 'Hello World — jterrazz',
                url: 'https://jterrazz.com/articles/hello?utm_source=hn',
            });
        });

    // Then - the request matched OpenPanel's reserved screen_view shape
    await expect(result.error).toBeEmpty();
});

test('sends revenue events with the default EUR currency', async () => {
    // Given - revenue tracked without an explicit currency
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                body: {
                    payload: {
                        name: 'revenue',
                        profileId: 'user-1',
                        properties: { __revenue: 49.9, currency: 'EUR' },
                    },
                    type: 'track',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            await createAdapter().revenue(49.9, { profileId: 'user-1' });
        });

    // Then - the reserved revenue event carried the amount and the default currency
    await expect(result.error).toBeEmpty();
});

test('sends identify payloads with codified traits in properties', async () => {
    // Given - a profile with Segment-style traits
    const result = await integration
        .intercept(
            http.post(TRACK_URL, {
                body: {
                    payload: {
                        email: 'user@example.com',
                        firstName: 'Jean',
                        lastName: 'Terrazzoni',
                        profileId: 'user-1',
                        properties: { createdAt: '2026-02-01T00:00:00.000Z', plan: 'pro' },
                    },
                    type: 'identify',
                },
            }),
            http.json({}),
        )
        .call(async () => {
            await createAdapter().identify({
                createdAt: new Date('2026-02-01T00:00:00.000Z'),
                email: 'user@example.com',
                firstName: 'Jean',
                lastName: 'Terrazzoni',
                plan: 'pro',
                profileId: 'user-1',
            });
        });

    // Then - native fields stayed top-level and codified traits joined properties
    await expect(result.error).toBeEmpty();
});

test('sends profile counters through the full flow', async () => {
    // Given - an increment then a decrement, each a distinct declared call
    const result = await integration
        .intercept([
            defineContract({
                request: http.post(TRACK_URL, {
                    body: {
                        payload: { profileId: 'user-1', property: 'logins' },
                        type: 'increment',
                    },
                }),
                response: http.json({}),
            }),
            defineContract({
                request: http.post(TRACK_URL, {
                    body: {
                        payload: { profileId: 'user-1', property: 'credits', value: 2 },
                        type: 'decrement',
                    },
                }),
                response: http.json({}),
            }),
        ])
        .call(async () => {
            const analytics = createAdapter();

            await analytics.increment('logins', { profileId: 'user-1' });
            await analytics.decrement('credits', { profileId: 'user-1', value: 2 });
        });

    // Then - both payloads reached the instance with the expected types
    await expect(result.error).toBeEmpty();
});

test('sends nothing when using the noop adapter', async () => {
    // Given - a noop adapter satisfying the same typed port, and a network that must stay untouched
    const result = await integration
        .intercept(http.any(/.*/u), http.unreachable())
        .call(async () => {
            const analytics: AnalyticsPort<TestEvents> = new NoopAnalyticsAdapter<TestEvents>();

            // Using the full port surface, including a child scope
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
        });

    // Then - no HTTP request was made; a stray one would have failed transport and surfaced here
    await expect(result.error).toBeEmpty();
});
