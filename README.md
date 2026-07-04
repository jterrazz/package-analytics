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

await analytics.track('article_shared', {
    profileId: 'user-1',
    properties: { channel: 'x', slug: 'hello-world' },
});
```

## Typed event catalogue

Declare your tracking plan as a type and get compile-time safety:

```typescript
import type { AnalyticsEvents, AnalyticsPort } from '@jterrazz/analytics';

interface AppEvents extends AnalyticsEvents {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
    user_signed_up: { plan: string };
}

const analytics: AnalyticsPort<AppEvents> = new OpenPanelAnalyticsAdapter<AppEvents>({ ... });

await analytics.track('app_link_opened', { properties: { platform: 'ios', slug: 'x' } }); // ✅
await analytics.track('unknown_event'); // ❌ compile error
```

Event naming convention: `object_action`, snake_case, past tense (`user_signed_up`), static names, data in properties.

## Request scopes (server-side)

Backends derive geolocation from the IP and device/browser/OS from the user-agent. On the server, bind a scope to the incoming request so events are attributed to the real user instead of your server:

```typescript
const requestAnalytics = analytics.child({
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    profileId: session?.userId, // links server events to the active web session
});

await requestAnalytics.track('subscription_started', { properties: { plan: 'pro' } });
```

## Page views

Send the full URL — the backend extracts path, query and UTM attribution:

```typescript
await analytics.page({
    referrer: 'https://news.ycombinator.com/',
    title: 'Hello World',
    url: 'https://example.com/articles/hello?utm_source=hn',
});
```

Sessions, bounce rate and page duration are computed by the backend from page views; they need no input from this API.

## Revenue

```typescript
await analytics.revenue(49.9, { profileId: 'user-1' }); // EUR by default
await analytics.revenue(100, { currency: 'USD', properties: { product: 'pro-plan' } });
```

## Profiles

Codified traits follow the [Segment identify spec](https://segment.com/docs/connections/spec/identify/); anything else goes into `properties`:

```typescript
await analytics.identify({
    profileId: 'user-1', // your database id, never the email
    email: 'user@example.com',
    firstName: 'Jean',
    createdAt: new Date('2026-01-15'),
    plan: 'pro',
    properties: { referral: 'friend' },
});
```

## Adapters

### OpenPanelAnalyticsAdapter

Sends events to [OpenPanel](https://openpanel.dev) — cloud or self-hosted.

```typescript
const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.example.com/api', // omit for OpenPanel cloud
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret', // required for server-side tracking and revenue
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

| Method                                                    | Description                                      |
| --------------------------------------------------------- | ------------------------------------------------ |
| `track(event, { profileId?, properties? })`               | Track a named event, optionally scoped to a user |
| `page({ url, title?, referrer? }, { profileId? })`        | Track a page view                                |
| `revenue(amount, { currency?, profileId?, properties? })` | Track revenue (EUR by default)                   |
| `identify({ profileId, ...traits, properties? })`         | Attach identity and traits to a profile          |
| `increment(property, { profileId, value? })`              | Increment a numeric profile property             |
| `decrement(property, { profileId, value? })`              | Decrement a numeric profile property             |
| `setGlobalProperties(properties)`                         | Set properties sent with every subsequent event  |
| `child(context)`                                          | Create a request-scoped analytics instance       |

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
