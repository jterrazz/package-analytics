# Adapters

The two implementations of `AnalyticsPort` this package ships, and what each sends for each port call. Adding a third is [Develop § Where a new file goes](../guides/develop.md#where-a-new-file-goes).

## `NoopAnalyticsAdapter`

`src/adapters/noop.adapter.ts`. Every port method resolves with nothing, and `child()` returns the adapter itself — there is nothing to scope. It is the adapter an app hands its own tests and its local development, where no event may leave.

## `OpenPanelAnalyticsAdapter`

`src/adapters/open-panel.adapter.ts`, backed by `@openpanel/sdk`. Sends events to [OpenPanel](https://openpanel.dev), cloud or self-hosted, as `POST <apiUrl>/track`.

### Configuration

| Field              | Holds                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| `apiUrl`           | The ingest endpoint of a self-hosted instance; omit for OpenPanel cloud              |
| `clientId`         | Required; sent as the `openpanel-client-id` header                                   |
| `clientSecret`     | Required for server-side tracking and for `revenue()`; the `openpanel-client-secret` |
| `globalProperties` | Sent with every event, as `setGlobalProperties` would                                |

### What each call sends

- `track(event, options)` — a `track` event named `event`, its `properties` merged over the global properties, and `profileId` when given.
- `page(page, options)` — a `screen_view` event with `__path` (the full url), `__referrer` and `__title`, a field left out sent as nothing; OpenPanel derives path, query and UTM attribution from `__path`.
- `revenue(amount, options)` — a `revenue` event with `currency` (`EUR` unless named), the caller's properties, `profileId` when given, and `__revenue: amount`.
- `identify(profile)` — an `identify` update: `profileId`, `avatar`, `email`, `firstName` and `lastName` top-level, the fields OpenPanel's profile holds; `name`, `phone`, `plan`, `username`, `website` and `createdAt` (as an ISO string) join `properties`, over the caller's own, and one left out leaves the caller's property of that name alone. After it, an event that names no profile is sent under this one: the SDK binds it.
- `increment` / `decrement` — an `increment` or `decrement` update with `profileId`, `property`, and `value` only when given.
- `setGlobalProperties` — merged into the properties of every later event.

### `child(context)`

Builds a new adapter over the same config, carrying the parent's global properties, then layers the request context onto it alone: `ip` becomes the `openpanel-client-ip` header and `userAgent` the `user-agent` header, `profileId` is the profile of every event that names none, and `deviceId` and `locale` join the properties as `__deviceId` and `locale`. A field absent or an empty string is sent as nothing. The parent is left untouched, which is what lets a server hold one long-lived adapter and derive a fresh child per request. A child of a child layers its context over its parent's: a field it leaves out or sends empty keeps the parent scope's value, one it states replaces it. A profile bound by `identify` is not context, and no child inherits it.

Those two headers are why the port takes `ip` and `userAgent` at all: OpenPanel derives geolocation from the former and device, browser and OS from the latter, exactly as it does for a browser-side event — [Architecture](../concepts/architecture.md#the-port) says why those derived facts are never port fields.

### The tracking plan

`OpenPanelAnalyticsAdapter<TEvents>` and `NoopAnalyticsAdapter<TEvents>` take the app's plan as a plain object type, `{ user_signed_up: { plan: string } }`: `track` then refuses an event the plan does not declare and a property its event does not allow. A plan written `AnalyticsEvents & { … }`, or an interface extending `AnalyticsEvents`, keeps the catalogue's string index, and every name type-checks.

## Related

- [Architecture](../concepts/architecture.md) — the port both adapters implement, and what it deliberately excludes.
- [Test](../guides/test.md) — the specs that read each request above.
