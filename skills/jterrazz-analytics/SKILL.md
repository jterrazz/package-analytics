---
name: jterrazz-analytics
description: Use when adding or configuring product analytics (event tracking, page views, revenue, user identification, profile counters) via @jterrazz/analytics. Covers the AnalyticsPort, typed event catalogues, request scopes (child), the OpenPanel adapter (self-hosted) and the noop adapter.
---

# @jterrazz/analytics

Part of the @jterrazz ecosystem. Defines how all projects track product events.

## Port

```typescript
import type { AnalyticsPort } from '@jterrazz/analytics';

interface AnalyticsPort<TEvents extends AnalyticsEvents = AnalyticsEvents> {
    child(context: {
        ip?: string;
        userAgent?: string;
        profileId?: string;
        deviceId?: string;
        locale?: string;
    }): AnalyticsPort<TEvents>;
    track(event: keyof TEvents, options?: { profileId?: string; properties? }): Promise<void>;
    page(page: { url: string; title?: string; referrer?: string }, options?): Promise<void>;
    revenue(amount: number, options?: { currency?; profileId?; properties? }): Promise<void>;
    identify(profile: AnalyticsProfile): Promise<void>;
    increment(property: string, options: { profileId: string; value?: number }): Promise<void>;
    decrement(property: string, options: { profileId: string; value?: number }): Promise<void>;
    setGlobalProperties(properties: Record<string, unknown>): void;
}
```

## Typed event catalogue (tracking plan)

Each app declares its events as a type — unknown events fail at compile time:

```typescript
interface AppEvents extends AnalyticsEvents {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
}
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
