import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NoopAnalyticsAdapter, OpenPanelAnalyticsAdapter } from '../../src/index.js';

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

    const requestsSentTo = (url: string) =>
        fetchMock.mock.calls
            .filter(([requestUrl]) => String(requestUrl).startsWith(url))
            .map(([, init]) => JSON.parse(String((init as RequestInit).body)));

    it('should send track events to a self-hosted instance', async () => {
        // Given — an adapter pointed at a self-hosted ingest endpoint
        const analytics = new OpenPanelAnalyticsAdapter({
            apiUrl: 'https://analytics.example.com/api',
            clientId: 'client-id',
            clientSecret: 'client-secret',
        });

        // When — tracking an event through the public API
        await analytics.track('article_read', {
            profileId: 'user-1',
            properties: { slug: 'hello-world' },
        });

        // Then — an HTTP request hits the instance's /track endpoint
        const payloads = requestsSentTo('https://analytics.example.com/api/track');
        expect(payloads).toHaveLength(1);
        expect(payloads[0]).toMatchObject({
            payload: {
                name: 'article_read',
                properties: { slug: 'hello-world' },
            },
            type: 'track',
        });

        // Then — the request authenticates with the configured client credentials
        const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(requestInit.headers).toMatchObject({
            'openpanel-client-id': 'client-id',
            'openpanel-client-secret': 'client-secret',
        });
    });

    it('should send identify and counter updates through the full flow', async () => {
        // Given — an adapter with global properties
        const analytics = new OpenPanelAnalyticsAdapter({
            apiUrl: 'https://analytics.example.com/api',
            clientId: 'client-id',
            globalProperties: { app: 'integration-test' },
        });

        // When — identifying then incrementing a counter
        await analytics.identify({ email: 'user@example.com', profileId: 'user-1' });
        await analytics.increment('logins', { profileId: 'user-1' });

        // Then — both payloads reach the instance with the expected types
        const payloads = requestsSentTo('https://analytics.example.com/api/track');
        expect(payloads).toHaveLength(2);
        expect(payloads[0]).toMatchObject({
            payload: { email: 'user@example.com', profileId: 'user-1' },
            type: 'identify',
        });
        expect(payloads[1]).toMatchObject({
            payload: { profileId: 'user-1', property: 'logins' },
            type: 'increment',
        });
    });

    it('should send nothing when using the noop adapter', async () => {
        // Given — a noop adapter
        const analytics = new NoopAnalyticsAdapter();

        // When — using the full port surface
        analytics.setGlobalProperties({ app: 'integration-test' });
        await analytics.track('article_read', { profileId: 'user-1' });
        await analytics.identify({ profileId: 'user-1' });
        await analytics.increment('logins', { profileId: 'user-1' });
        await analytics.decrement('credits', { profileId: 'user-1' });

        // Then — no HTTP request is made
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
