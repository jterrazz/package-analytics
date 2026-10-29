# The `@jterrazz/analytics` agent brief

Vendor-neutral product analytics for Node.js apps: one port (`AnalyticsPort`), pluggable adapters. This file **routes**; it does not restate what the corpus already says.

## Mental model

- **Depend on the port, inject an adapter.** `AnalyticsPort` is the only type a caller imports for its own code; `OpenPanelAnalyticsAdapter` and `NoopAnalyticsAdapter` are the two adapters this package ships today.
- **The port excludes what a backend derives.** Sessions, bounce rate, geolocation, device/browser/OS and UTM attribution are never inputs: a caller supplies `ip`/`userAgent` (via `child`) and a page's full `url`, and the backend computes the rest.
- **`child(context)` is the request scope.** A server binds one long-lived adapter and derives a fresh child per request so events attribute to the real user, not the server.

## Where knowledge lives (route here first)

The corpus is `docs/` + `README.md`, mapped by `docs/README.md`. Decisions this package alone took are in `docs/decisions/`. Do not duplicate it; link to it.

| Working on                                                    | Read                            |
| ------------------------------------------------------------- | ------------------------------- |
| the port/adapter shape, the public surface                    | `docs/concepts/architecture.md` |
| the declaration, the gestures, where a new file goes          | `docs/guides/develop.md`        |
| the specs, the ingest double, the mutation verdict            | `docs/guides/test.md`           |
| the release, and who is allowed to cut one                    | `docs/guides/release.md`        |
| `OpenPanelAnalyticsAdapter` / `NoopAnalyticsAdapter` in depth | `docs/reference/adapters.md`    |

The manual is cut by its reader's need (`guides/`, `concepts/`, `reference/`), the shape every repository of the ecosystem keeps, and `typescript check` refuses a tree that breaks it (the Docs (layout) pass).

## Setup and commands

The gestures (`make install` (`npm ci`, never a plain `npm install`, which can rewrite the lockfile), `make build`, `make lint`, `make fix`, `make test`, `make mutation`, `make check`) and what each runs are [Develop § The gestures](docs/guides/develop.md#the-gestures)'s.

## Standing rule

A new or changed export reaches `README.md`, the relevant `docs/` page and the `skills/studio-analytics/` skill in the same change. None of the three is generated, so nothing else catches a stale one ([Develop § What a change owes](docs/guides/develop.md#what-a-change-owes)).
