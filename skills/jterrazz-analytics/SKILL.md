---
name: jterrazz-analytics
description: Use when adding or configuring product analytics (event tracking, page views, revenue, user identification, profile counters) via @jterrazz/analytics. Covers the AnalyticsPort, typed event catalogues, request scopes (child), the OpenPanel adapter (self-hosted) and the noop adapter.
---

# @jterrazz/analytics

Part of the @jterrazz ecosystem. Defines how all projects track product events.

## Port

`AnalyticsPort<TEvents>` is the one type an application depends on — eight members, every one of them a property signature:

```typescript
import type { AnalyticsPort } from '@jterrazz/analytics';

type AnalyticsPort<TEvents extends AnalyticsEvents = AnalyticsEvents> = {
    child: (context: AnalyticsContext) => AnalyticsPort<TEvents>;
    decrement: (property: string, options: AnalyticsCounterOptions) => Promise<void>;
    identify: (profile: AnalyticsProfile) => Promise<void>;
    increment: (property: string, options: AnalyticsCounterOptions) => Promise<void>;
    page: (page: AnalyticsPage, options?: AnalyticsPageOptions) => Promise<void>;
    revenue: (amount: number, options?: AnalyticsRevenueOptions) => Promise<void>;
    setGlobalProperties: (properties: Record<string, unknown>) => void;
    track: (event: keyof TEvents & string, options?: AnalyticsTrackOptions) => Promise<void>;
};
```

The request scope `child` takes, and the counter options `increment`/`decrement` take:

```typescript
type AnalyticsContext = {
    deviceId?: string;
    ip?: string;
    locale?: string;
    profileId?: string;
    userAgent?: string;
};

type AnalyticsCounterOptions = { profileId: string; value?: number };
```

## Typed event catalogue (tracking plan)

Each app declares its events as a type — unknown events fail at compile time:

```typescript
type AppEvents = AnalyticsEvents & {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
};
const analytics: AnalyticsPort<AppEvents> = new OpenPanelAnalyticsAdapter<AppEvents>({ ... });
```

## Adapters

**OpenPanel** (production — self-hosted instance):

```typescript
import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.jterrazz.com/api', // jterrazz self-hosted ingest; omit for cloud
    clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET, // server-side only, never in browser bundles
    globalProperties: { app: 'my-app' },
});
```

**Noop** (development / tests): `new NoopAnalyticsAdapter()`.

## Server-side events: always use a request scope

The backend derives geolocation from `ip` and device/browser/OS from `userAgent`. A server event without them is attributed to the server, not the user:

```typescript
const requestAnalytics = analytics.child({
    ip: clientIp, // e.g. first entry of x-forwarded-for
    userAgent: request.headers['user-agent'],
    profileId: session?.userId, // links the event to the user's active web session
});
await requestAnalytics.track('subscription_started', { properties: { plan: 'pro' } });
```

## Rules

- Never read `process.env` inside libraries — the app's composition root builds the config and injects the adapter.
- Depend on `AnalyticsPort` in services; inject the concrete adapter at the composition root.
- Event names: `object_action`, snake_case, past tense (`user_signed_up`, `article_shared`). Static names only — data goes in properties, never in the name.
- Do NOT send UTM, geo, device or session data as properties: the backend derives UTM from `page().url`, geo from `ip`, device from `userAgent`, and computes sessions/bounce itself.
- `revenue()` requires the `clientSecret` (server-side only), default currency EUR.
- `profileId` is your database id — never the email (email is a trait on `identify`).
- Browser-side tracking on the jterrazz stack uses `@openpanel/nextjs` (`OpenPanelComponent`) with the same `apiUrl`/`clientId`; it powers sessions and bounce rate. Server events join those sessions via a shared `profileId`.
- The self-hosted ingest endpoint only exposes `/track` publicly — dashboards live on the private network.
