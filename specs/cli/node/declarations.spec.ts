import { directory, packed } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';

describe('declarations', () => {
    test('a consumer compiles its tracking plan against the declarations the tarball ships', async () => {
        // Given - a consumer's module typed by an event catalogue, with the compiler beside the packed package
        const result = await cli
            .link('@jterrazz/analytics', packed())
            .link('typescript')
            .fixture(directory('./__fixtures__/consumer/'))
            .exec('node_modules/typescript/bin/tsc -p .');

        // Then - both adapters satisfy the typed port, an undeclared event and a wrong property are refused where the consumer expects it, and the compiler reports nothing
        expect(result.exitCode).toBe(0);
        expect(result.stdout.text).toBe('');
    });
});
