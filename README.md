# @jterrazz/analytics

Vendor-neutral product analytics for Node.js and TypeScript apps, with pluggable adapters.

## Installation

```bash
npm install @jterrazz/analytics
```

## Usage

```typescript
import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.jterrazz.com/api', // self-hosted instance
    clientId: process.env.OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET, // server-side only
});

await analytics.track('article_read', {
    profileId: 'user-1',
    properties: { slug: 'hello-world' },
});
```

## Adapters

### OpenPanelAnalyticsAdapter

Sends events to [OpenPanel](https://openpanel.dev) — cloud or self-hosted.

```typescript
const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.example.com/api', // omit for OpenPanel cloud
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret', // required for server-side tracking
    globalProperties: { app: 'my-app' }, // sent with every event
});
```

### NoopAnalyticsAdapter

Implements the port but sends nothing. Use it in local development and tests.

```typescript
import { NoopAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new NoopAnalyticsAdapter();
```

## API

| Method                                                                         | Description                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------ |
| `track(event, { profileId?, properties? })`                                    | Track a named event, optionally scoped to a user |
| `identify({ profileId, email?, firstName?, lastName?, avatar?, properties? })` | Attach identity and traits to a profile          |
| `increment(property, { profileId, value? })`                                   | Increment a numeric profile property             |
| `decrement(property, { profileId, value? })`                                   | Decrement a numeric profile property             |
| `setGlobalProperties(properties)`                                              | Set properties sent with every subsequent event  |

## Port Interface

Depend on the port, inject the adapter:

```typescript
import type { AnalyticsPort } from '@jterrazz/analytics';

class SignupService {
    constructor(private readonly analytics: AnalyticsPort) {}

    async signup(email: string): Promise<void> {
        // ...create the user...
        await this.analytics.track('user_signed_up', {
            profileId: user.id,
            properties: { plan: 'free' },
        });
    }
}
```

## License

MIT
