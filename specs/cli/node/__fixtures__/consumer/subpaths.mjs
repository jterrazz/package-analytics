import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const imported = await import('@jterrazz/analytics');
const required = require('@jterrazz/analytics');

for (const [subpath, names] of [
    ['@jterrazz/analytics (import)', Object.keys(imported)],
    ['@jterrazz/analytics (require)', Object.keys(required)],
]) {
    console.log(`${subpath}: ${names.toSorted().join(', ')}`);
}
