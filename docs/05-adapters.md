# Adapters

The two concrete implementations of `AnalyticsPort` this package ships, and what each maps the port's calls onto. Adding a third is [02-developing.md](02-developing.md)'s "Where a new adapter's files go".

## `NoopAnalyticsAdapter`

`src/adapters/noop.adapter.ts`. Every port method is a resolved no-op, and `child()` returns `this` rather than a new scope — there is nothing to scope. Used in local development and in tests that need the port satisfied without a network call, as the integration suite's last scenario does.

## `OpenPanelAnalyticsAdapter`

`src/adapters/open-panel.adapter.ts`, backed by `@openpanel/sdk`. Sends events to [OpenPanel](https://openpanel.dev), cloud or self-hosted.

### Configuration

| Field              | Holds                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| `apiUrl`           | The ingest endpoint of a self-hosted instance; omit for OpenPanel cloud            |
| `clientId`         | Required                                                                           |
| `clientSecret`     | Required for server-side tracking and for `revenue()`                              |
| `globalProperties` | Sent with every event; applied via the SDK's `setGlobalProperties` at construction |

### How each port call maps onto the SDK

- `track(event, options)` calls `client.track(event, { ...properties, profileId })` directly — the event name and shape reach OpenPanel unchanged.
- `page(page, options)` calls `client.track('screen_view', { __path: url, __referrer, __title, profileId })` — OpenPanel derives path, query string and UTM attribution from `__path` server-side.
- `revenue(amount, options)` calls `client.track('revenue', { __revenue: amount, currency, ...properties, profileId })`, defaulting `currency` to `'EUR'` when the caller does not name one.
- `identify(profile)` splits the profile: `avatar`, `email`, `firstName`, `lastName`, `profileId` go top-level (the fields OpenPanel's own identify call expects); everything else — including `createdAt`, serialized to an ISO string — lands in `properties`, merged with the caller's own.
- `increment`/`decrement` call the SDK's own `increment`/`decrement` with `{ profileId, property, value }`.
- `setGlobalProperties` forwards to the SDK unchanged.

### `child(context)`

Builds a new `OpenPanelAnalyticsAdapter` over the same config, then layers the request context onto it: `context.ip` becomes the `openpanel-client-ip` header, `context.userAgent` becomes the `user-agent` header, `context.profileId` is set on the child's SDK client, and `context.deviceId`/`context.locale` become global properties on the child alone (`__deviceId`, `locale`) — the parent's own scope is left untouched, which is what lets a server hold one long-lived adapter and derive a fresh child per request.

Those two headers are why the port takes `ip` and `userAgent` at all: OpenPanel derives geolocation from the former and device/browser/OS from the latter, exactly as it does for a browser-side event — see [01-architecture.md](01-architecture.md) for why those derived facts never appear as port fields a caller sets by hand.

## Related

- [Architecture](01-architecture.md) — the port both adapters implement, and what it deliberately excludes.
- [Testing](03-testing.md) — the sibling test and the integration suite that prove each mapping above.
