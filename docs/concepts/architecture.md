# Architecture

One port, and adapters that implement it — vendor-neutral product analytics with no framework or backend baked into the type a caller depends on. What each adapter sends for each call is [Adapters](../reference/adapters.md)'s; this page owns the shape.

## The port

`src/ports/analytics.ts` exports `AnalyticsPort<TEvents>`, the one type an application depends on: `track`, `page`, `revenue`, `identify`, `increment`, `decrement`, `setGlobalProperties`, and `child` for request-scoped instances. `AnalyticsEvents` is the constraint a tracking plan meets, not a type to extend: an app writes its plan as a plain object type, and `track` narrows `event` to that plan's keys and its properties to that event's shape, so an unknown event name fails at compile time rather than silently reaching a vendor. An extension of `AnalyticsEvents` keeps its string index and lets every name through — [Adapters § The tracking plan](../reference/adapters.md#the-tracking-plan) owns the rule. Every optional input reads `undefined` as absent, so a consumer compiled with `exactOptionalPropertyTypes` — every `@jterrazz/typescript` preset sets it — passes `process.env.X` or `session?.userId` as it comes.

Deliberately absent from the port: sessions, bounce rate, page duration, geolocation, device/browser/OS detection and UTM attribution. A backend derives all of these server-side from `child`'s request context (`ip`, `userAgent`) and from the full URL a `page()` call carries — the port exposes those inputs and never asks a caller to compute the outputs itself.

## The adapters

`src/adapters/` holds one file per adapter, each a class implementing `AnalyticsPort` and nothing else — no shared base class, because the port itself is the only contract two adapters need in common:

- `noop.adapter.ts` — `NoopAnalyticsAdapter`, every method a resolved no-op: the null object an app hands its own tests.
- `open-panel.adapter.ts` — `OpenPanelAnalyticsAdapter`, backed by `@openpanel/sdk`.

An adapter imports the port; the port never imports an adapter. Adding a third vendor is a new file in this folder, never a change to `src/ports/analytics.ts` — the port is the stable surface every adapter is measured against. The package has no container and no composition root: an app constructs the adapter it wants in its own.

## The public surface

`src/index.ts` is the package's one entry, re-exporting the port's types and both adapter classes — `package.json`'s `exports` publishes it as `.`, an ESM and a CommonJS build under `dist/`, built by `typescript build`. There is no subpath: a consumer imports everything from `@jterrazz/analytics`.

## Related

- [Develop](../guides/develop.md) — the toolchain, and where a new adapter's files go.
- [Adapters](../reference/adapters.md) — what each adapter maps the port onto.
