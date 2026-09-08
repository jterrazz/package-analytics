# Agent brief — `@jterrazz/analytics`

Vendor-neutral product analytics for Node.js and TypeScript apps: one port (`AnalyticsPort`), pluggable adapters. This file **routes**; it does not restate what the corpus already says.

## Mental model

- **Depend on the port, inject an adapter.** `AnalyticsPort` is the only type a caller imports for its own code; `OpenPanelAnalyticsAdapter` and `NoopAnalyticsAdapter` are the two adapters this package ships today.
- **The port excludes what a backend derives.** Sessions, bounce rate, geolocation, device/browser/OS and UTM attribution are never inputs — a caller supplies `ip`/`userAgent` (via `child`) and a page's full `url`, and the backend computes the rest.
- **`child(context)` is the request scope.** A server binds one long-lived adapter and derives a fresh child per request so events attribute to the real user, not the server.

## Where knowledge lives (route here first)

The corpus is `docs/` + `README.md`, mapped by `docs/README.md`. Do not duplicate it — link to it.

| Working on…                                                   | Read                      |
| ------------------------------------------------------------- | ------------------------- |
| The port/adapter shape, the public surface                    | `docs/01-architecture.md` |
| The toolchain, where a new adapter's files go                 | `docs/02-developing.md`   |
| The sibling tests and the integration suite                   | `docs/03-testing.md`      |
| What publishes, and what a merge does not do                  | `docs/04-operating.md`    |
| `OpenPanelAnalyticsAdapter` / `NoopAnalyticsAdapter` in depth | `docs/05-adapters.md`     |

## Setup & commands

```bash
npm install
npm run lint     # typescript check
npm run lint:fix # typescript fix
npm test         # vitest --run
npm run build    # typescript bundle
```

`make lint` / `make test` / `make build` wrap the same commands behind one `npm ci`; there is no combined `make check`.

## Standing rule

A change to `src/ports/analytics.ts` or to an adapter's public behaviour also updates: the adapter's sibling test (`docs/03-testing.md`), `src/index.ts` if the surface changed, the relevant section of `docs/01-architecture.md` or `docs/05-adapters.md`, and `README.md`'s example if it now shows something untrue. One piece of knowledge, one chapter — `skills/jterrazz-analytics/SKILL.md` and this file route into the corpus; neither restates it.
