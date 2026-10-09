import { directory, packed } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';

describe('noop', () => {
    test('the no-op adapter lets no event leave the process', async () => {
        // Given - a consumer's test handing the no-op adapter to its code, every port call made through a request scope, after a guard that reports and refuses every outbound request
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .fixture(directory('./__fixtures__/consumer/'))
            .exec('noop.mjs');

        // Then - every call resolves, and no request was attempted
        expect(result.exitCode).toBe(0);
        expect(result.stderr.text).toBe('');
    });
});
