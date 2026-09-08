# @jterrazz/analytics

Vendor-neutral product analytics for Node.js and TypeScript apps, with pluggable adapters.

## Installation

```bash
npm install @jterrazz/analytics
```

## Quick start

```typescript
import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.jterrazz.com/api', // self-hosted instance
    clientId: process.env.OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET, // server-side only
});

await analytics.track('article_shared', {
    profileId: 'user-1',
    properties: { channel: 'x', slug: 'hello-world' },
});
```

Declare your tracking plan as a type to get compile-time safety on event names — see [Architecture](docs/01-architecture.md).

## Documentation

The full corpus lives in [`docs/`](docs/):

- [Architecture](docs/01-architecture.md) — the port, the adapters, the public surface.
- [Developing](docs/02-developing.md) — the toolchain, where a new adapter's files go.
- [Testing](docs/03-testing.md) — the sibling tests and the integration suite.
- [Operating](docs/04-operating.md) — what publishes this package, and what a merge does not do.
- [Adapters](docs/05-adapters.md) — `OpenPanelAnalyticsAdapter` and `NoopAnalyticsAdapter` in depth: config, event mapping, request scopes.

For agents: read the chapters straight from the repo, plus [`skills/jterrazz-analytics`](skills/jterrazz-analytics/SKILL.md).

## License

MIT
