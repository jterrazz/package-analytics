---
name: jterrazz-analytics
description: Use when adding or configuring product analytics (event tracking, user identification, profile counters) via @jterrazz/analytics. Covers the AnalyticsPort, the OpenPanel adapter (self-hosted) and the noop adapter.
---

# @jterrazz/analytics

Part of the @jterrazz ecosystem. Defines how all projects track product events.

## Port

```typescript
import type { AnalyticsPort } from '@jterrazz/analytics';

interface AnalyticsPort {
    track(event: string, options?: { profileId?: string; properties?: Record<string, unknown> }): Promise<void>;
    identify(profile: { profileId: string; email?: string; firstName?: string; lastName?: string; avatar?: string; properties?: Record<string, unknown> }): Promise<void>;
    increment(property: string, options: { profileId: string; value?: number }): Promise<void>;
    decrement(property: string, options: { profileId: string; value?: number }): Promise<void>;
    setGlobalProperties(properties: Record<string, unknown>): void;
}
```

## Adapters

**OpenPanel** (production — self-hosted instance):

```typescript
import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: 'https://analytics.jterrazz.com/api', // jterrazz self-hosted ingest; omit for OpenPanel cloud
    clientId: process.env.OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET, // server-side only, never in browser bundles
    globalProperties: { app: 'my-app' },
});
```

**Noop** (development / tests):

```typescript
import { NoopAnalyticsAdapter } from '@jterrazz/analytics';
const analytics = new NoopAnalyticsAdapter();
```

## Rules

- Never read `process.env` inside libraries — the app's composition root builds the config and injects the adapter.
- Depend on `AnalyticsPort` in services; inject the concrete adapter at the composition root.
- Event names are `snake_case` verbs in past tense: `user_signed_up`, `article_read`.
- `clientSecret` is server-side only. Browser-side tracking on the jterrazz stack uses `@openpanel/nextjs` with the same `apiUrl` and `clientId`.
- The self-hosted ingest endpoint only exposes `/track` publicly — dashboards live on the private network.
