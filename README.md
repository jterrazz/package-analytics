# @jterrazz/analytics

Vendor-neutral product analytics for Node.js apps, with pluggable adapters.

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

Declare your tracking plan as a type to get compile-time safety on event names — see [Architecture](docs/concepts/architecture.md).

## Documentation

The manual lives in [`docs/`](docs/README.md):

- [Architecture](docs/concepts/architecture.md) — the port, the adapters, the public surface.
- [Adapters](docs/reference/adapters.md) — `OpenPanelAnalyticsAdapter` and `NoopAnalyticsAdapter` in depth: config, what each call sends, request scopes.
- [Develop](docs/guides/develop.md), [Test](docs/guides/test.md) and [Release](docs/guides/release.md) — changing, proving and shipping the package.

For agents: read the pages straight from the repo, plus [`skills/jterrazz-analytics`](skills/jterrazz-analytics/SKILL.md).

## License

MIT
