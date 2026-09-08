# Architecture

One port, and adapters that implement it — vendor-neutral product analytics with no framework or backend baked into the type a caller depends on. What each adapter DOES with the port is [05-adapters.md](05-adapters.md)'s; this page owns the shape.

## The port

`src/ports/analytics.ts` exports `AnalyticsPort<TEvents>`, the one type an application depends on: `track`, `page`, `revenue`, `identify`, `increment`, `decrement`, `setGlobalProperties`, and `child` for request-scoped instances. `AnalyticsEvents` is the extension point — an app declares its own tracking plan as a type extending it, and `track` narrows `event` to that plan's keys, so an unknown event name fails at compile time rather than silently reaching a vendor.

Deliberately absent from the port: sessions, bounce rate, page duration, geolocation, device/browser/OS detection and UTM attribution. A backend derives all of these server-side from `child`'s request context (`ip`, `userAgent`) and from the full URL a `page()` call carries — the port exposes those inputs and never asks a caller to compute the outputs itself.

## The adapters

`src/adapters/` holds one file per adapter, each a class implementing `AnalyticsPort` and nothing else — no shared base class, because the port itself is the only contract two adapters need in common:

- `noop.adapter.ts` — `NoopAnalyticsAdapter`, every method a resolved no-op.
- `open-panel.adapter.ts` — `OpenPanelAnalyticsAdapter`, backed by `@openpanel/sdk`.

An adapter imports the port; the port never imports an adapter. Adding a third vendor is a new file in this folder, never a change to `src/ports/analytics.ts` — the port is the stable surface every adapter is measured against.

## The public surface

`src/index.ts` is the package's only export barrel, re-exporting the port's types and both adapter classes — `package.json`'s `exports` field publishes exactly that barrel as `.` (CJS and ESM builds under `dist/`, built by `typescript bundle`). There is no subpath export: a consumer imports everything through `@jterrazz/analytics`.

## Related

- [Developing](02-developing.md) — the toolchain, and where a new adapter's files go.
- [Adapters](05-adapters.md) — what each adapter maps the port onto.
