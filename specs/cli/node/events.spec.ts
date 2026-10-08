import { directory, packed, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startIngest } from './__setup__/ingest.js';

describe('events', () => {
    test("track, page and revenue reach the ingest as OpenPanel events, with the global properties and the client's credentials", async () => {
        // Given - an adapter with a secret and global properties tracking an event, a page view and revenue with and without their options, then a global property set later, and an adapter with neither
        await using ingest = await startIngest();
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: ingest.url })
            .exec('events.mjs');

        // Then - each call is one track request: a page is a screen_view with its reserved properties and no empty one, revenue carries EUR unless told otherwise, a later global property joins every event after it, and an adapter with no secret sends none
        expect(result.exitCode).toBe(0);
        expect(result.stderr.text).toBe('');
        expect(text(ingest.received())).toMatch(`
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"article_read","profileId":"user-1","properties":{"app":"shop","slug":"hello-world"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"cart_opened","properties":{"app":"shop"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"screen_view","profileId":"user-1","properties":{"app":"shop","__path":"https://shop.example/articles/hello?utm_source=news","__referrer":"https://news.example/","__title":"Hello World"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"screen_view","properties":{"app":"shop","__path":"https://shop.example/"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"revenue","profileId":"user-1","properties":{"app":"shop","currency":"EUR","__revenue":29.99}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"revenue","properties":{"app":"shop","currency":"USD","product":"pro-plan","__revenue":100}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"checkout_started","properties":{"app":"shop","release":"2.4.0","items":3}}}
            POST /api/track [openpanel-client-id=browser-client user-agent=node] {"type":"track","payload":{"name":"cart_opened","properties":{}}}
        `);
    });
});
