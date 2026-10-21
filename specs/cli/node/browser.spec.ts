import { directory, packed, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startIngest } from './__setup__/ingest.js';

describe('browser', () => {
    test("a document on the site's host reports its page view and its interactions once, under the production environment", async () => {
        // Given - the ./browser entry installed twice in a document served from the site's own host, with a production build, then tracking an event with properties and one without
        await using ingest = await startIngest();
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: ingest.url })
            .exec('browser.mjs shop.example prod');

        // Then - outgoing links are watched through one click listener, the second install is refused, the page view carries the URL without its hash, and every event carries the app and the environment beside the SDK's own page context
        expect(result.exitCode).toBe(0);
        expect(result.stderr.text).toBe('');
        expect(result.stdout).toMatch(`
            listening: click
            installed; again: refused
        `);
        expect(text(ingest.received())).toMatch(`
            POST /api/track [openpanel-client-id=browser-client user-agent=node] {"type":"track","payload":{"name":"screen_view","properties":{"__referrer":"","app":"shop-web","environment":"production","__path":"https://shop.example/articles/hello?utm_source=news","__title":"Hello"}}}
            POST /api/track [openpanel-client-id=browser-client user-agent=node] {"type":"track","payload":{"name":"cart_opened","properties":{"__referrer":"","app":"shop-web","environment":"production","items":3,"__path":"https://shop.example/articles/hello?utm_source=news"}}}
            POST /api/track [openpanel-client-id=browser-client user-agent=node] {"type":"track","payload":{"name":"menu_opened","properties":{"__referrer":"","app":"shop-web","environment":"production","__path":"https://shop.example/articles/hello?utm_source=news"}}}
        `);
    });

    test.each([
        ['a development build', 'shop.example dev'],
        ["a preview host that is not the site's", 'preview.shop.example prod'],
    ])('%s reports nothing and hands back no tracker', async (_name, args) => {
        // Given - the ./browser entry installed where the guard must refuse
        await using ingest = await startIngest();
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: ingest.url })
            .exec(`browser.mjs ${args}`);

        // Then - no tracker exists and the ingest saw nothing
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            not installed
        `);
        expect(ingest.received()).toBe('');
    });

    test('a collector that is down costs the reader nothing', async () => {
        // Given - a production document whose ingest answers nothing
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OPENPANEL_API_URL: 'http://127.0.0.1:1/api' })
            .exec('browser.mjs shop.example prod');

        // Then - the process finishes cleanly, the failure is the SDK's own log line, never an exception
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            listening: click
            installed; again: refused
        `);
    });
});
