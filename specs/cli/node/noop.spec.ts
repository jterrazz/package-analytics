import { directory, packed } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';

describe('noop', () => {
    test('the no-op adapter answers the whole port and its child scope is itself', async () => {
        // Given - a consumer's test handing the no-op adapter to its code, every port call made through it
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .exec('noop.mjs');

        // Then - every call resolves with nothing, and the child scope is the same adapter
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            the child scope is the adapter itself: true
            every call answered: undefined, undefined, undefined, undefined, undefined, undefined
        `);
        expect(result.stderr.text).toBe('');
    });
});
