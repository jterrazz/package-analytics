import { directory, packed, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startIngest } from './__setup__/ingest.js';

describe('scopes', () => {
    test("a child scope sends the request's context with its events and leaves its parent's alone", async () => {
        // Given - an adapter with global properties, a child bound to a visitor's ip, user-agent, profile, device and locale, the parent tracking after it, a child of that child naming its own ip and locale, a child whose context is all empty strings, and a child bound to a profile alone
        await using ingest = await startIngest();
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: ingest.url })
            .exec('scopes.mjs');

        // Then - the child's events carry the visitor's ip and user-agent headers, its profile unless the event names one, its device and locale beside the parent's global properties; a child of a child keeps every field of its parent's context it does not restate, the parent's events and the empty child's carry none of it, and a field the context leaves out is sent as nothing
        expect(result.exitCode).toBe(0);
        expect(result.stderr.text).toBe('');
        expect(text(ingest.received())).toMatch(`
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret openpanel-client-ip=203.0.113.7 user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)] {"type":"track","payload":{"name":"article_read","profileId":"user-42","properties":{"app":"shop","release":"2.4.0","__deviceId":"web-device","locale":"fr-FR","slug":"hello-world"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret openpanel-client-ip=203.0.113.7 user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)] {"type":"track","payload":{"name":"article_shared","profileId":"user-7","properties":{"app":"shop","release":"2.4.0","__deviceId":"web-device","locale":"fr-FR"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"cart_opened","properties":{"app":"shop","release":"2.4.0"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret openpanel-client-ip=198.51.100.23 user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)] {"type":"track","payload":{"name":"article_read","profileId":"user-42","properties":{"app":"shop","release":"2.4.0","__deviceId":"web-device","locale":"en-GB"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"cart_opened","properties":{"app":"shop","release":"2.4.0"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"cart_opened","profileId":"user-9","properties":{"app":"shop","release":"2.4.0"}}}
        `);
    });
});
