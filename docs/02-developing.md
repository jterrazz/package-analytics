# Developing

How a change to this package is made: the toolchain, the commands, and where a new file goes. What the package IS is [01-architecture.md](01-architecture.md)'s; what proves a change once written is [03-testing.md](03-testing.md)'s.

## The toolchain

`@jterrazz/typescript` is the one devDependency that builds, checks and lints this package — `npm install`, then:

| Command            | Runs                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `npm run build`    | `typescript bundle` — ESM + CJS + types into `dist/`                                                                |
| `npm run lint`     | `typescript check` — typecheck, lint, format-check, knip, and (with this chapter's own bump) the Docs (layout) pass |
| `npm run lint:fix` | `typescript fix` — auto-fixes lint and formatting                                                                   |
| `npm test`         | `vitest --run`                                                                                                      |

The `Makefile` wraps the same three verbs (`make build`, `make lint`, `make test`) behind one `npm ci`, keyed on `package-lock.json` via a `node_modules/.install` stamp — there is no combined `make check` target, so proving a change locally is `make lint && make test` (or the `npm run lint && npm test` it wraps).

Quality is the `@jterrazz` toolchain's own rules, not this page's: `oxlint`/`oxfmt` presets and the Docs (layout) gate come from `@jterrazz/typescript`, and the shape a test file takes — sibling naming, `// Given` / `// When` / `// Then` — is the `jterrazz-test` skill's.

## Where a new adapter's files go

- The adapter itself: `src/adapters/<name>.adapter.ts`, a class implementing `AnalyticsPort` — see [01-architecture.md](01-architecture.md) for the shape every adapter holds to.
- Its sibling unit test: `src/adapters/<name>.adapter.test.ts`, in the same commit — see [03-testing.md](03-testing.md).
- Its export: added to `src/index.ts`, the package's one barrel.
- Its own section: [05-adapters.md](05-adapters.md), naming its config and what it maps the port onto — this is the one place that knowledge is authored; `skills/jterrazz-analytics/SKILL.md` routes into it and restates none of it.

A change to the port itself (`src/ports/analytics.ts`) touches every adapter that implements it and the integration suite that exercises the full flow — widening the interface obliges a new method on `NoopAnalyticsAdapter` and on `OpenPanelAnalyticsAdapter` alike, and `tsc` is what says so first.

## Related

- [Testing](03-testing.md) — what a change here must still prove.
- [Operating](04-operating.md) — what publishes a change once it merges.
