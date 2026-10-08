import { directory, packed, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startIngest } from './__setup__/ingest.js';

describe('profiles', () => {
    test('counters and identities reach the ingest as OpenPanel profile updates', async () => {
        // Given - an increment, a decrement by two, an identify carrying every codified trait, one carrying only its properties, then an event with no profile
        await using ingest = await startIngest();
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: ingest.url })
            .exec('profiles.mjs');

        // Then - the counters name their property and only the value given, the native fields stay top-level while the other traits join the properties and win over them, a trait left out leaves the caller's property alone, and the last identify binds the next event to its profile
        expect(result.exitCode).toBe(0);
        expect(result.stderr.text).toBe('');
        expect(text(ingest.received())).toMatch(`
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"increment","payload":{"profileId":"user-1","property":"logins"}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"decrement","payload":{"profileId":"user-1","value":2,"property":"credits"}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"identify","payload":{"avatar":"https://shop.example/avatars/jean.png","email":"jean@shop.example","firstName":"Jean","lastName":"Terrazzoni","profileId":"user-1","properties":{"plan":"pro","referral":"friend","createdAt":"2026-01-15T10:00:00.000Z","name":"Jean T.","phone":"+33600000000","username":"jean","website":"https://jean.example"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"identify","payload":{"profileId":"user-2","properties":{"plan":"free"}}}
            POST /api/track [openpanel-client-id=shop-client openpanel-client-secret=shop-secret user-agent=node] {"type":"track","payload":{"name":"article_read","profileId":"user-2","properties":{}}}
        `);
    });
});
