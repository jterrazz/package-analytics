import { specification } from '@jterrazz/test';
import { afterAll } from 'vitest';

// invariant: every chain links `@jterrazz/analytics` packed, from its own spec file, so a consumer spec meets the package as a consumer installs it.
export const { cleanup, cli } = await specification.cli('node', {
    defaults: { OPENPANEL_API_URL: null, TZ: 'UTC' },
});

afterAll(cleanup);
